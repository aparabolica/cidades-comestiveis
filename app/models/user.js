
/*!
 * Module dependencies
 */

var _ = require('underscore');
var async = require('async');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var moment = require('moment');
var validator = require('validator');
var autoIncrement = require('mongoose-auto-increment');

/**
 * User schema
 */

var UserSchema = new Schema({
	role: { type: String, enum: ['admin', 'moderator', 'user'], default: 'user'},
	name: { type: String, required: 'missing_name'},
	email: { type: String, required: 'missing_email', validate: [validator.isEmail, 'invalid_email'] },
	picture: String,
	token: { type: String },
	hashed_password: {type: String, required: 'missing_password'},
	salt: { type: String, default: '' },
	bio: {type: String, default: '' },
	location: { type: {type: String}, coordinates: []},
	updatedAt: Date,
	registeredAt: {type: Date, default: Date.now}
});

/**
 * Virtuals
 */

UserSchema
	.virtual('password')
	.set(function(password) {
		this._password = password
		this.salt = this.makeSalt()
		this.hashed_password = this.encryptPassword(password)
	})
	.get(function() { return this._password });

UserSchema
	.virtual('longitude')
	.set(function(longitude) {
		var self = this;
		if (!self.location.coordinates.length){
			self.location.type = 'Point';
			self.location.coordinates = [null,null];
		}
		this.location.coordinates[0] = longitude;
	})

UserSchema
	.virtual('latitude')
	.set(function(latitude) {
		var self=this;
		if (!self.location.coordinates.length) {
			self.location.type = 'Point';
			self.location.coordinates = [null,null];
		}
		this.location.coordinates[1] = latitude;
	})


/**
 * Validations
 */

UserSchema.path('email').validate(function (email, done) {
	var User = mongoose.model('User')

	// Check only when it is a new user or when email field is modified
	if (this.isNew || this.isModified('email')) {
		User.find({ email: email }).exec(function (err, users) {
			done(!err && users.length === 0)
		})
	} else done(true);
}, 'email_already_registered');

UserSchema.path('hashed_password').validate(function(v) {
	var self = this;
  if (self._password && (self._password.length < 6)) {
    self.invalidate('password', 'short_password');
  }

  if (self.isNew && !self._password) {
    self.invalidate('password', 'missing_password');
  }
}, null);

UserSchema.path('location.coordinates').validate(function(v) {
	var self = this;

	if (self.location.coordinates.length != 0) {
		var lon = self.location.coordinates[0];
		var lat = self.location.coordinates[1];

		/* validate longitude */
		if (!lon) self.invalidate('location.coordinates', 'missing_longitude');
		else if (!validator.isFloat(lon)) self.invalidate('location.coordinates', 'invalid_longitude');

		/* validate longitude */
		if (!lat) self.invalidate('location', 'missing_latitude');
		else if (!validator.isFloat(lat)) self.invalidate('location.coordinates', 'invalid_latitude');
	}
}, null);

/** Pre/Post middleware */

UserSchema.pre('save', function(next){
	var self = this;
	if (self.isNew) {
		mongoose.model('User').count(function(err, count){
			if (err) return next(err);
			if (count == 0) self.role = 'admin';
			next();
		});
	} else next();
});

/**
 * Methods
 */

UserSchema.methods = {

	privateInfo: function() {

		var info = {
			_id: this._id,
			name: this.name,
			picture: this.picture,
			email: this.email,
			role: this.role,
			bio: this.bio,
			registeredAt: this.registeredAt,
			location: this.location
		};

		return info;

	},

	publicInfo: function() {
		return {
			_id: this._id,
			name: this.name,
			picture: this.picture,
			bio: this.bio,
			registeredAt: this.registeredAt
		};
	},

	/**
	 * Authenticate - check if the passwords are the same
	 *
	 * @param {String} plainText
	 * @return {Boolean}
	 * @api public
	 */

	authenticate: function (plainText) {
		return this.encryptPassword(plainText) === this.hashed_password
	},

	/**
	 * Make salt
	 *
	 * @return {String}
	 * @api public
	 */

	makeSalt: function () {
		return Math.round((new Date().valueOf() * Math.random())) + ''
	},

	/**
	 * Encrypt password
	 *
	 * @param {String} password
	 * @return {String}
	 * @api public
	 */

	encryptPassword: function (password) {
		if (!password) return ''
		var encrypred
		try {
			encrypred = crypto.createHmac('sha1', this.salt).update(password).digest('hex')
			return encrypred
		} catch (err) {
			return ''
		}
	},

	/**
	 * Send reset password token if not using OAuth
	 */

	sendResetToken: function() {
		var
			Token = mongoose.model('Token'),
			self = this,
			token;


		if (self.doesNotRequireValidation){
			var seed = crypto.randomBytes(20);
			var id = crypto.createHash('sha1').update(seed).digest('hex');

			token = new Token({
				_id: id,
				user: self,
				expiresAt: moment().add('hour', 1).toDate()
			}).save();
		}
	},

	contributions: function(doneGetContributions) {

		var self = this;

		function getAreas(doneGetAreas) {
			mongoose.model('Area')
				.find({creator: self._id})
				.sort({'createdAt': -1})
				.lean()
				.exec(function(err, areas){
					if (err) return doneGetAreas(err);

					areas = _.map(areas, function(a){
						a.type = 'area';
						return a;
					})

					doneGetAreas(null, areas);
				});
		}

		function getResources(doneGetResources) {
			mongoose.model('Resource')
				.find({creator: self})
				.sort({'createdAt': -1})
				.lean()
				.exec(function(err, resources){
					if (err) return doneGetResources(err);

					resources = _.map(resources, function(r){
						r.type = 'resource';
						return r;
					})

					doneGetResources(null, resources);
				});
		}

		function getInitiatives(doneGetInitiatives) {
			mongoose.model('Initiative')
				.find({creator: self})
				.sort({'createdAt': -1})
				.lean()
				.exec(function(err, initiatives){
					if (err) return doneGetInitiatives(err);

					initiatives = _.map(initiatives, function(i){
						i.type = 'initiative';
						return i;
					})

					doneGetInitiatives(null, initiatives);
				});
		}

		async.series([getAreas,getResources,getInitiatives], function(err, results){
			doneGetContributions(err, _.flatten(results));
		})

	}

}


/**
 * Statics
 */

UserSchema.static({

	list: function (options, cb) {
    var criteria = options.criteria || {}

    this.find(criteria)
      .sort('name') // sort by date
			.select('_id name')
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },

})

/**
 * Register
 */

mongoose.model('User', UserSchema)

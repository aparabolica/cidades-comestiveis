
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var moment = require('moment');
var validator = require('validator');

/**
 * User schema
 */

var UserSchema = new Schema({
	role: { type: String, enum: ['admin', 'moderator', 'user'], default: 'user'},
	name: { type: String, default: '' },
	email: { type: String, default: '', validate: [validator.isEmail, 'Invalid e-mail address.'] },
	token: { type: String },
	username: String,
	hashed_password: { type: String, default: '' },
	authToken: { type: String, default: '' },
	salt: { type: String, default: '' },
	logins: Number,
	lastLogin: Date,
	updatedAt: Date,
	localization: String,
	bio: {type: String, default: '' },
	web: String,
	emailConfirmed: {type: Boolean, default: false}
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

/**
 * Validations
 */

var validatePresenceOf = function (value) {
	return value && value.length;
}

// the below 5 validations only apply if you are signing up traditionally

UserSchema.path('name').validate(function (name) {
	return name.length;
}, 'Name cannot be blank.');

UserSchema.path('email').validate(function (email) {
	return email.length
}, 'Email cannot be blank.');

UserSchema.path('email').validate(function (email, done) {
	var User = mongoose.model('User')

	// Check only when it is a new user or when email field is modified
	if (this.isNew || this.isModified('email')) {
		User.find({ email: email }).exec(function (err, users) {
			done(!err && users.length === 0)
		})
	} else
		fn(true);
}, 'E-mail address already in use.');

UserSchema.path('username').validate(function (username, fn) {
	var User = mongoose.model('User');

	// Check only when it is a new user or when username field is modified
	if (this.isNew || this.isModified('username')) {
		User.find({ username: username }).exec(function (err, users) {
			fn(!err && users.length === 0)
		})
	} else
		fn(true);
}, 'Username already in use.');

/**
 * Methods
 */

UserSchema.methods = {


	/**
	 * Info - avoids sending sensitive information to the client
	 *
	 * @return {}
	 * @api public
	 */

	info: function() {

		var info = {
			_id: this._id,
			name: this.name,
			username: this.username,
			email: this.email,
			status: this.status,
			role: this.role,
			bio: this.bio
		};

		return info;

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

}


/**
 * Statics
 */

UserSchema.static({

	load: function (options, cb) {
		this.findOne(options)
			.select('email name username bio status needsEmailsConfirmation role')
			.exec(cb)
	},

	getAdmin: function(done) {
		this.findOne({role: 'admin'}, done);
	}


})

/**
 * Register
 */

mongoose.model('User', UserSchema)

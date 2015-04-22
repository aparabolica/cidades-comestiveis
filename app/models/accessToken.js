
/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

/**
 * User schema
 */

var AccessTokenSchema = new Schema({
	_id: { type: String },
	expired: {type: Boolean, default: false},
	createdAt: {type: Date, default: Date.now},
	expiresAt: {type: Date, required: true, default: moment().add(15, 'day').toDate() },
	user: { type: Number, ref: 'User' }
});

/**
 * Virtuals
 **/

AccessTokenSchema.virtual('isValid').get(function() {
	return (this.expired) || (this.expiresAt > Date.now);
});

/**
 * Statics
 */

AccessTokenSchema.statics = {

	load: function (id, cb) {
		this.findOne({ _id : id })
			.populate('user')
			.exec(cb)
	},

}

/**
 * Register
 */

mongoose.model('AccessToken', AccessTokenSchema);

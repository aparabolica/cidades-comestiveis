
var crypto = require('crypto');
var _ = require('underscore');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var AccessToken = mongoose.model('AccessToken');
var messaging = require('../lib/messaging');

// Access Token generator
var generateAccessToken = function(user, res) {

	var token = new AccessToken({user: user._id});

	var seed = crypto.randomBytes(20);
	token._id = crypto.createHash('sha1').update(seed).digest('hex');

	token.save(function(err) {
		if (err)
			return res.json(401, messaging.mongooseErrors(req.i18n.t, err, 'accessToken'));

		var response = _.extend({
			accessToken: token._id
		}, user);

		res.json(response);

	});

}

exports.login = function(req, res, next) {

	passport.authenticate('local', function(err, user, info) {

		// Unknown error
		if (err) {
			return res.status(400).json(messaging.error(req.i18n, err));

		// Error raised by passport
		} else if (info && info.message) {
			res.status(400).json(messaging.error(info.message));

		// User not found.
		} else if (!user) {
			return res.status(403).json(messaging.error("access_token.local.unauthorized"));

		// Login successful, proceed with token
		} else if (user) {
			generateAccessToken(user, res);
		}

	})(req, res, next);

};

exports.logout = function(req, res, next) {

	req.logout();

	if (req.headers.authorization) {
		var access_token = req.headers.authorization.split(' ')[1];
		AccessToken.findOne({_id: access_token}, function(err, at){
			if (err) return res.status(400).json(err);
			if (!at) return res.status(400).json(messaging.error("access_token.logout.error.inexistent_token"));
			at.expired = true;
			at.save(function(err){
				if (err) return res.status(400).json(err);
				else return res.json(messaging.success('access_token.logout.successful'));
			});
		});
	} else {
		res.status(400).json(messaging.error('access_token.logout.error.not_logged'));
	}

};

exports.isLogged = function (req, res, next) {

	passport.authenticate('bearer', { session: false }, function(err, user, info) {

		if (req.isAuthenticated()) {
			// user is allowed through local strategy
			return next();
		}

		if (err) {
			return res.status(401).send(messaging.error(info));
		}

		if (!user) {
			return res.status(401).send(messaging.error('access_token.unauthorized'));
		}

		if (user) {
			req.user = user;
			return next();
		}

		// (default res.forbidden() behavior can be overridden in `config/403.js`)
		return res.forbidden('You are not allowed to perform this action.');

	})(req, res, next);

}

exports.isAdmin = function(req,res,next) {

	if (req.user.role == 'admin')
		next();
	else
		return res.status(401).send(messaging.error('access_token.unauthorized'));

}

exports.canUpdate = function(req,res,next) {

	if ((req.object.creator == req.user._id.toHexString()) || (req.user.role == 'admin'))
		next();
	else
		return res.status(401).send(messaging.error('access_token.unauthorized'));

}

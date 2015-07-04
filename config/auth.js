
var crypto = require('crypto');
var _ = require('underscore');
var fbgraph = require('fbgraph');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var AccessToken = mongoose.model('Token');
var messaging = require('../lib/messaging');



// Access Token generator
var generateAccessToken = function(user, res) {

	var token = new AccessToken({user: user._id});

	var seed = crypto.randomBytes(20);
	token._id = crypto.createHash('sha1').update(seed).digest('hex');
	token.type = 'access';

	token.save(function(err) {
		if (err)
			return res.json(401, messaging.mongooseErrors('access_token.error'));

		user = user.toObject ? user.toObject() : user;

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
			return res.status(500).json(messaging.error(req.i18n, err));

		// Error raised by passport
		} else if (info && info.message) {
			res.status(400).json(messaging.error(info.message));

		// User not found.
		} else if (!user) {
			return res.status(401).json(messaging.error("access_token.local.unauthorized"));

		// Check e-mail confirmation
		} else if (!user.emailConfirmed) {
			return res.status(401).json(messaging.error("access_token.local.email_not_confirmed"));

		// Login successful, proceed with token
		} else if (user) {
			generateAccessToken(user, res);
		}

	})(req, res, next);

};

exports.facebook = function(req, res, next) {

	var fbAccessToken = req.body.authResponse.access_token;
	fbgraph.setAccessToken(fbAccessToken);
	fbgraph.get("me?fields=id,name,picture,email", function(err, fbData) {
		if (err)
			return res.status(401).json(messaging.error("access_token.local.unauthorized"));
		else {

			fbgraph.get(fbData.id + "/picture?height=150&width=150", function(err, picture) {
				// Facebook data
				var email = fbData.email;
				var name = fbData.name;

				User.findOne({email: email}, function(err, user){
					// Mongoose error
					if (err) return res.status(500);

					// Create user if not already registered
					else if (!user) {

						var seed = crypto.randomBytes(20);

						var user = new User({
							name: name,
							email: email,
							picture: picture.location,
							password: crypto.createHash('sha1').update(seed).digest('hex'),
							emailConfirmed: true
						});

						user.save(function(err){
							if (err) return res.status(500);
							generateAccessToken(user, res);
						})

					// User is registered, generate token
					} else generateAccessToken(user, res);
			})
			})
		}
	});

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

	if ((req.object.creator._id && (req.object.creator._id.toHexString() == req.user._id.toHexString()))
			|| (req.object.creator == req.user._id.toHexString()) || (req.user.role == 'admin'))
		next();
	else
		return res.status(401).send(messaging.error('access_token.unauthorized'));

}

exports.canUpdateUser = function(req,res,next) {

	if ((req.object._id.toHexString() == req.user._id.toHexString())
			|| (req.user.role == 'admin'))
		next();
	else
		return res.status(401).send(messaging.error('access_token.unauthorized'));

}


var crypto = require('crypto');
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
		}, user.info());

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
		}

		// User needs to finish migration.
		else if (user.status == 'to_migrate') {
			return res.status(400).json(messaging.error("access_token.local.needs_migration"));

		// User doesn't have a password, because it logged before via Facebook or Google
		} else if (!user.hashed_password) {
			mailer.passwordNeeded(user, req.app.locals.settings.general.serverUrl, user.callback_url, function(err){
				if (err)
					return res.status(400).json(messaging.error("access_token.local.error.send_email"));
				else
					return res.status(400).json(messaging.error("access_token.local.error.need_password"));
			});

		// User needs to confirm his email, send another e-mail
		} else if (req.app.locals.settings.mailer.enforceEmailConfirmation && !user.emailConfirmed) {

			var data = {
				user: user,
				callbackUrl: req.app.locals.settings.general.clientUrl + '/login'
			}

			req.app.locals.mailer.sendEmail('confirm_email', user.email, data, req.i18n, function(err) {
				if (err)
					return res.status(400).json(messaging.error("access_token.local.error.send_email"));
				else
					return res.status(400).json(messaging.error("access_token.local.error.needs_email_confirmation"));
			});

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

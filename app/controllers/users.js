/* Dependencies */

var _ = require('underscore');
var messaging = require('../../lib/messaging')
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Area = mongoose.model('Area');
var validator = require('validator');


/* Load user object */
exports.load = function (req, res, next, id){

  /* Try to load user */
  User.findById(id, function (err, user) {
    if (err)
      return res.status(400).json(messaging.mongooseErrors(err, 'users'));
    else if (!user)
      return res.status(404).json(messaging.error('errors.users.not_found'));
    else {
      req.object = user;
      next();
    }
  });
};

/* Create new user. */
exports.new = function(req, res) {
  var user = new User(req.body);
  user.save(function(err){
    if (err)
      return res.status(400).json(messaging.mongooseErrors(err, 'users'));
    else
      return res.status(201).json(user.privateInfo());
  });
};

/* Update user. */
exports.update = function(req, res) {

  var params = req.body;
  var user = req.object;

  /* No parameters informed */
  if (Object.keys(params).length == 0)
    return res.status(400).json(messaging.error('errors.users.missing_parameters'));

  /* Stop e-mail change */
  if (params.email)
    return res.status(400).json(messaging.error('errors.users.cannot_change_email'));

  /* User is changing password */
  if (params.password) {
    if (!params.currentPassword){
      return res.status(400).json(messaging.error('errors.users.missing_current_password'));
    }

    if (!user.authenticate(params.currentPassword)){
      return res.status(400).json(messaging.error('errors.users.wrong_password'));
    }

    user.password = params.password;
  }

  user = _.extend(user, params);

  user.save(function(err){
    if (err)
      return res.status(400).json(messaging.mongooseErrors(err, 'users'));
    else
      return res.status(200).json(user.privateInfo());
  });
};

/* Get public info about a user. */
exports.get = function(req, res) {
  var user = req.object;
  res.status(200).json(user.publicInfo());
};

/* Get user contributions. */
exports.contributions = function(req, res) {
  var user = req.object;

  user.contributions(function(err, contribs){
    if (err)
      return res.status(400).json(messaging.mongooseErrors(err, 'users'));
    else
      return res.status(200).json({contributions: contribs});
  });

};

/* Get a list of users */
exports.list = function(req, res) {

  var page = req.query['page'];
  var perPage = req.query['perPage'];

  /* Validate query parameters */
  if (page) {
    if (!validator.isInt(page))
      return res.status(400).json(messaging.error('errors.query.invalid_parameters'));
    else
      page = parseInt(page) - 1;
  } else page = 0;

  if (perPage){
    if (!validator.isInt(perPage))
      return res.status(400).json(messaging.error('errors.query.invalid_parameters'));
    else
      perPage = parseInt(perPage);
  } else perPage = 10;

  /* Mongoose Options */
  var options = {
    perPage: perPage,
    page: page
  };

  User.list(options, function (err, users) {
    if (err)
      return res.status(500).json(messaging.error('errors.internal_error'));

    /* Send response */
    User.count().exec(function (err, count) {
      res.status(200).json({
        count: count,
        perPage: perPage,
        page: page + 1,
        users: users
      });
    });
  });
};

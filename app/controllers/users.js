/* Dependencies */

var messaging = require('../../lib/messaging')
var mongoose = require('mongoose');
var User = mongoose.model('User');
var validator = require('validator');


/* Load user object */
exports.load = function (req, res, next, id){

  /* Catch invalid ids (non positive integers) */
  if (!validator.isInt(id,{min: 1}))
    return res.status(404).json(messaging.error('errors.users.invalid_id'));

  /* Try to load user */
  User.findById(id, function (err, user) {
    if (err) return next(err);
    if (!user) return res.status(404).json(messaging.error('errors.users.not_found'));
    req.user = user;
    next();
  });
};

/* Create new user. */
exports.new = function(req, res) {
  var user = new User(req.body);
  user.save(function(err){
    if (err)
      return res.status(400).json(messaging.mongooseErrors(err, 'user'));
    else
      return res.status(201).json(user.privateInfo());
  });
};

/* Get public info about a user. */
exports.get = function(req, res) {
  res.status(200).json(req.user.publicInfo());
};

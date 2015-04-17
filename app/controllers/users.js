/* Dependencies */

var messaging = require('../../lib/messaging')
var mongoose = require('mongoose');
var User = mongoose.model('User');

/* Create new user. */
exports.new = function(req, res, next) {

  var user = new User(req.body);

  user.save(function(err){
    if (err)
      return res.status(400).json(messaging.mongooseErrors(err, 'user'));
    else
      return res.status(201).json(user.privateInfo());
  });
};

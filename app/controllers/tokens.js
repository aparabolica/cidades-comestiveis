/* Dependencies */

var messaging = require('../../lib/messaging')
var mongoose = require('mongoose');
var Token = mongoose.model('Token');


exports.load = function(req,res,next,id){
  Token.findById(id).populate('user').exec(function(err, token){
    if (err)
      return res.status(400).send('erro');
    else if (!token)
      return res.status(404).send('token not found');
    else {
      req.token = token;
      next();
    }
  });
}


/* Load user object */
exports.open = function (req, res){
  var token = req.token;

  if (token.expiresAt < Date.now()) {
    return res.status(403).json(messaging.error('This token has expired'));
  }

  var user = token.user;

  if (token.type == 'email_confirmation') {
    user.emailConfirmed = true;

    var successMessage;
    if (token.data.newEmail) {
      user.email = token.data.newEmail;
      successMessage = messaging.success('E-mail changed successfully');
    } else {
      successMessage = messaging.success('E-mail confirmed successfully');
    }

    user.save(function(err){
      if (err) return res.sendStatus(500);
      else return res.status(200).json(successMessage);
    })
  }
};

/* Dependencies */

var messaging = require('../../lib/messaging')
var mongoose = require('mongoose');
var Token = mongoose.model('Token');


exports.load = function(req,res,next,id){
  Token.findById(id).populate('user').exec(function(err, token){
    if (err) return res.redirect(process.env.APP_URL + '/status/internal_error');
    else if (!token)
      return res.redirect(process.env.APP_URL + '/status/token_not_found');
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
    return res.redirect(process.env.APP_URL + '/status/expired_token');
  }

  var user = token.user;

  if (token.type == 'email_confirmation') {
    user.emailConfirmed = true;
  }

  if (token.data && token.data.newEmail) {
    user.email = token.data.newEmail;
  }

  user.save(function(err){
    if (err) return res.redirect(process.env.APP_URL + '/status/internal_error');
    else res.redirect(process.env.APP_URL + '/status/email_confirmed');
  });
};

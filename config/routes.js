
/* Controllers */

var auth = require('./auth');
var lands = require('../app/controllers/lands');
var users = require('../app/controllers/users');

module.exports = function (app, config) {


  /* Authentication routes */
  var authRoutes = require('express').Router();
  authRoutes.post('/login', auth.login);
  authRoutes.get('/logout', auth.logout);
  app.use(config.apiPrefix, authRoutes);

  /* Users routes */
  var usersRoutes = require('express').Router();
  usersRoutes.post('/users', users.new);
  app.use(config.apiPrefix, usersRoutes);

  /* Lands routes */
  var landRoutes = require('express').Router();
  landRoutes.get('/lands', [auth.requiresLogin, lands.create]);
  landRoutes.post('/lands', [auth.requiresLogin, lands.create]);
  app.use(config.apiPrefix, landRoutes);

  /* For all other routes, send client app */
  app.get('/*', function(req, res) {
  	res.sendFile(config.rootPath + '/public/views/index.html');
  });

}

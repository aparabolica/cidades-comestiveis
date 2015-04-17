
/* Controllers */

var auth = require('./auth');
var lands = require('../app/controllers/lands');

module.exports = function (app, config) {


  /* Authentication routes */
  var authRoutes = require('express').Router();
  authRoutes.post('/login', auth.login);
  authRoutes.get('/logout', auth.logout);
  app.use(config.apiPrefix, authRoutes);

  /* Lands routes */
  var landRoutes = require('express').Router();
  landRoutes.get('/', [auth.requiresLogin, lands.create]);
  landRoutes.post('/', [auth.requiresLogin, lands.create]);
  app.use(config.apiPrefix + '/lands', landRoutes);


  // For all other routes, send client app
  app.get('/*', function(req, res) {
  	res.sendFile(config.rootPath + '/public/views/index.html');
  });


}


/* Dependencies */
var messaging = require('../lib/messaging');

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
  usersRoutes.param('id', users.load);
  usersRoutes.get('/users', users.list);
  usersRoutes.get('/users/:id', users.get);
  usersRoutes.post('/users', users.new);
  app.use(config.apiPrefix, usersRoutes);

  /* Lands routes */
  var landRoutes = require('express').Router();
  landRoutes.get('/lands', [auth.requiresLogin, lands.create]);
  landRoutes.post('/lands', [auth.requiresLogin, lands.create]);
  app.use(config.apiPrefix, landRoutes);

  /* Send 404 (Not found) to non existent API routes */
  app.all('/api/*', function(req,res){
    return res.status(404).json(messaging.error('error.api.route_not_found'));
  })

  /* For all other routes, send client app */
  app.get('/*', function(req, res) {
    res.sendFile(config.rootPath + '/public/views/index.html');
  });

}

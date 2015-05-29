
/* Dependencies */
var messaging = require('../lib/messaging');

/* Controllers */
var auth = require('./auth');
var areas = require('../app/controllers/areas');
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
  usersRoutes.post('/users', users.new);
  usersRoutes.put('/users/:id', users.update);
  usersRoutes.get('/users/:id', users.get);
  usersRoutes.get('/users', users.list);
  app.use(config.apiPrefix, usersRoutes);

  /* Areas routes */
  var areaRoutes = require('express').Router();
  areaRoutes.post('/areas', [auth.requiresLogin, areas.create]);
  areaRoutes.get('/areas/:id', areas.show);
  areaRoutes.put('/areas/:id', [auth.requiresLogin, areas.update]);
  areaRoutes.post('/areas/:id', [auth.requiresLogin, areas.update]);
  areaRoutes.get('/areas', areas.list);
  app.use(config.apiPrefix, areaRoutes);

  /* Send 404 (Not found) to non existent API routes */
  app.all('/api/*', function(req,res){
    return res.status(404).json(messaging.error('error.api.route_not_found'));
  })

  /* For all other routes, send client app */
  app.get('/*', function(req, res) {
    res.sendFile(config.rootPath + '/public/views/index.html');
  });

}

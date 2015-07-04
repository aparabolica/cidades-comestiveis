
/* Dependencies */
var messaging = require('../lib/messaging');

/* Controllers */
var auth = require('./auth');
var users = require('../app/controllers/users');
var areas = require('../app/controllers/areas');
var initiatives = require('../app/controllers/initiatives');
var resources = require('../app/controllers/resources');
var tokens = require('../app/controllers/tokens');

module.exports = function (app, config) {


  /* Authentication routes */
  var authRoutes = require('express').Router();
  authRoutes.post('/login', auth.login);
  authRoutes.post('/login/facebook', auth.facebook);
  authRoutes.get('/logout', auth.logout);
  app.use(config.apiPrefix, authRoutes);

  /* Token routes */
  var tokenRoutes = require('express').Router();
  tokenRoutes.param('id', tokens.load);
  tokenRoutes.get('/token/:id', tokens.open);
  app.use(config.apiPrefix, tokenRoutes);

  /* Users routes */
  var usersRoutes = require('express').Router();
  usersRoutes.param('id', users.load);
  usersRoutes.post('/users', users.new);
  usersRoutes.put('/users/:id', [auth.isLogged, auth.canUpdateUser, users.update]);
  usersRoutes.get('/users/:id', users.get);
  usersRoutes.get('/users/:id/contributions', users.contributions);
  usersRoutes.post('/users/:id/message', [auth.isLogged,users.message]);
  usersRoutes.get('/users', users.list);
  app.use(config.apiPrefix, usersRoutes);

  /* Areas routes */
  var areaRoutes = require('express').Router();
  areaRoutes.param('id', areas.load);
  areaRoutes.post('/areas', [auth.isLogged, areas.create]);
  areaRoutes.post('/areas/:id/image', [auth.isLogged, auth.canUpdate, areas.updateImage]);
  areaRoutes.get('/areas/:id', areas.show);
  areaRoutes.put('/areas/:id', [auth.isLogged, auth.canUpdate, areas.update]);
  areaRoutes.get('/areas', areas.list);
  app.use(config.apiPrefix, areaRoutes);

  /* Initiative routes */
  var initiativeRoutes = require('express').Router();
  initiativeRoutes.param('id', initiatives.load);
  initiativeRoutes.post('/initiatives', [auth.isLogged, initiatives.create]);
  initiativeRoutes.get('/initiatives/:id', initiatives.show);
  initiativeRoutes.put('/initiatives/:id', [auth.isLogged, auth.canUpdate, initiatives.update]);
  initiativeRoutes.post('/initiatives/:id/image', [auth.isLogged, auth.canUpdate, initiatives.updateImage]);
  initiativeRoutes.put('/initiatives/:id/addArea/:area_id', [auth.isLogged, auth.canUpdate, initiatives.addArea]);
  initiativeRoutes.put('/initiatives/:id/removeArea/:area_id', [auth.isLogged, auth.canUpdate, initiatives.removeArea]);
  initiativeRoutes.get('/initiatives', initiatives.list);
  app.use(config.apiPrefix, initiativeRoutes);

  /* Resource routes */
  var resourcesRoutes = require('express').Router();
  resourcesRoutes.param('id', resources.load);
  resourcesRoutes.post('/resources', [auth.isLogged, resources.create]);
  resourcesRoutes.get('/resources/:id', resources.show);
  resourcesRoutes.put('/resources/:id', [auth.isLogged, auth.canUpdate, resources.update]);
  resourcesRoutes.delete('/resources/:id', [auth.isLogged, auth.canUpdate, resources.remove]);
  resourcesRoutes.post('/resources/:id/image', [auth.isLogged, auth.canUpdate, resources.updateImage]);
  resourcesRoutes.get('/resources', resources.list);
  app.use(config.apiPrefix, resourcesRoutes);

  /* Send 404 (Not found) to non existent API routes */
  app.all('/api/*', function(req,res){
    return res.status(404).json(messaging.error('error.api.route_not_found'));
  })

  /* For all other routes, send client app */
  app.get('/*', function(req, res) {
    res.sendFile(config.rootPath + '/public/views/index.html');
  });

}

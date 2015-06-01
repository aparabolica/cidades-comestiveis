
/* Dependencies */
var messaging = require('../lib/messaging');

/* Controllers */
var auth = require('./auth');
var users = require('../app/controllers/users');
var areas = require('../app/controllers/areas');
var initiatives = require('../app/controllers/initiatives');
var resourceTypes = require('../app/controllers/resourceTypes');

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
  usersRoutes.get('/users/:id/contributions', users.contributions);
  usersRoutes.get('/users', users.list);
  app.use(config.apiPrefix, usersRoutes);

  /* Areas routes */
  var areaRoutes = require('express').Router();
  areaRoutes.param('id', areas.load);
  areaRoutes.post('/areas', [auth.isLogged, areas.create]);
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
  initiativeRoutes.put('/initiatives/:id/addArea/:area_id', [auth.isLogged, auth.canUpdate, initiatives.addArea]);
  initiativeRoutes.put('/initiatives/:id/removeArea/:area_id', [auth.isLogged, auth.canUpdate, initiatives.removeArea]);
  initiativeRoutes.get('/initiatives', initiatives.list);
  app.use(config.apiPrefix, initiativeRoutes);

  /* Resource type routes */
  var resourceTypesRoutes = require('express').Router();
  resourceTypesRoutes.param('id', resourceTypes.load);
  resourceTypesRoutes.post('/resource_types', [auth.isLogged, auth.isAdmin, resourceTypes.create]);
  resourceTypesRoutes.get('/resource_types/:id', resourceTypes.show);
  resourceTypesRoutes.put('/resource_types/:id', [auth.isLogged, auth.isAdmin, resourceTypes.update]);
  resourceTypesRoutes.get('/resource_types', resourceTypes.list);
  app.use(config.apiPrefix, resourceTypesRoutes);

  /* Send 404 (Not found) to non existent API routes */
  app.all('/api/*', function(req,res){
    return res.status(404).json(messaging.error('error.api.route_not_found'));
  })

  /* For all other routes, send client app */
  app.get('/*', function(req, res) {
    res.sendFile(config.rootPath + '/public/views/index.html');
  });

}

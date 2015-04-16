var apiRoutes = require('express').Router();

var auth = require('./auth');

module.exports = function (app, config) {

  // Authorization
  apiRoutes.post('/login', auth.login);
  apiRoutes.get('/logout', auth.logout);

  // Set '/api/v1' as base path for API routes
  app.use(config.apiPrefix, apiRoutes);

  // For all other routes, send client app
  app.get('/*', function(req, res) {
  	res.sendFile(config.rootPath + '/public/views/index.html');
  });


}


var routes = require('../routes');
var lands = require('../routes/lands');

/**
 * Expose routes
 */

module.exports = function (app, config) {
  var apiPrefix = config.apiPrefix;

  // Search
  app.use('/', routes);
  app.use(apiPrefix + '/lands', lands);

}

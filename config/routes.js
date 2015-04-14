
var routes = require('../routes');
var lands = require('../routes/lands');

/**
 * Expose routes
 */

module.exports = function (app) {
  var apiPrefix = app.locals('apiPrefix');

  // Search
  app.use('/', routes);
  app.use(apiPrefix + '/lands', lands);

}

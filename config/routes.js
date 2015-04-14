
var routes = require('../routes');
var lands = require('../routes/lands');

/**
 * Expose routes
 */

module.exports = function (app, config) {
  var apiPrefix = config.apiPrefix;
  console.log(config);
  console.log(apiPrefix);

  // Search
  app.use('/', routes);
  app.use(apiPrefix + '/lands', lands);

}

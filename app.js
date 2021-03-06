/**
 * Module dependencies
 */

var fs = require('fs');
if(fs.existsSync('./.env')) {
  require('dotenv').load();
}
var express = require('express');
var passport = require('passport');
var env = process.env.NODE_ENV || 'development';
var config = require('./config/config')[env];
var rootPath = config.rootPath;
var mongoose = require('mongoose');

mongoose.connect(config.db);

// Bootstrap models
fs.readdirSync(rootPath + '/app/models').forEach(function (file) {
  if (~file.indexOf('.js')) require(rootPath + '/app/models/' + file)
})

// Bootstrap passport config
require(rootPath + '/config/passport')(passport, config)

var app = express();

// Bootstrap application settings
require(rootPath + '/config/express')(app, config, passport)

// Bootstrap routes
require(rootPath+ '/config/routes')(app, config)

// Start the app by listening on <port>
var port = process.env.PORT || 3000;
app.listen(port);
console.log('Express app started on port ' + port);

// Expose app
module.exports = app;

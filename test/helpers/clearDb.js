
/**
 * Module dependencies.
 */


var fs = require('fs');
var mongoose = require('mongoose');
var async = require('async');
var User = mongoose.model('User');
var Area = mongoose.model('Area');


exports.database = function (done) {
  async.parallel([
    function (cb) {
      User.collection.remove(cb)
    },
    function (cb) {
      Area.collection.remove(cb)
    }
  ], done)
}

exports.all = function(done) {

  var self = this;

  async.parallel([self.database], done);
}

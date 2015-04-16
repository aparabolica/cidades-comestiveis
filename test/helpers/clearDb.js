
/**
 * Module dependencies.
 */


var fs = require('fs');
var mongoose = require('mongoose');
var async = require('async');
var User = mongoose.model('User');


exports.database = function (done) {
  async.parallel([
    function (cb) {
      User.collection.remove(cb)
    }
  ], done)
}

exports.all = function(done) {

  var self = this;

  async.parallel([self.database], done);
}

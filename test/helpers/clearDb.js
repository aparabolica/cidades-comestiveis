
/**
 * Module dependencies.
 */


var fs = require('fs');
var mongoose = require('mongoose');
var async = require('async');
var User = mongoose.model('User');
var Area = mongoose.model('Area');
var Initiative = mongoose.model('Initiative');
var ResourceType = mongoose.model('ResourceType');
var Resource = mongoose.model('Resource');


exports.database = function (done) {
  async.parallel([
    function (cb) {
      User.collection.remove(cb)
    },
    function (cb) {
      Area.collection.remove(cb)
    },
    function (cb) {
      Initiative.collection.remove(cb)
    },
    function (cb) {
      ResourceType.collection.remove(cb)
    },
    function (cb) {
      Resource.collection.remove(cb)
    }
  ], done)
}

exports.all = function(done) {

  var self = this;

  async.parallel([self.database], done);
}

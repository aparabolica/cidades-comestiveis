
/**
 * Module dependencies.
 **/

var async = require('async');
var rosie = require('rosie').Factory;
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Area = mongoose.model('Area');

/**
 * USERS
 **/

rosie.define('User')
	.sequence('name', function(i) { return 'user' + i })
	.sequence('email', function(i) { return 'email' + i + '@example.com' })
	.attr('password', '123456')

exports.createUser = function(done){
	var user = new User(rosie.build('User'));
	user.save(function(err){
		done(err, user);
	})
}

exports.createAdmin = function(done){
	var user = new User(rosie.build('User'));
	user.role = 'admin';
	user.save(function(err){
		done(err, user);
	})
}

exports.createUsers = function(n, doneCreateUsers){
	var self = this;
	async.timesSeries(n, function(n,doneEach){
		self.createUser(doneEach)
	}, doneCreateUsers);
}

/**
 * AREAS
 **/

rosie.define('Area')
	.sequence('address', function(i) { return 'address ' + i })
	.sequence('description', function(i) { return 'some description for area ' + i })
	.attr('geometry', function(){
		var lat = -90 + Math.random() * 180;
		var lon = -180 + Math.random() * 360;
		return {
			type: 'Point',
			coordinates: [lon,lat]
		}
	})

exports.createArea = function(creator_id, done){
	var area = new Area(rosie.build('Area'));
	area.creator = creator_id;
	area.save(function(err){
		done(err, area);
	})
}

exports.createAreas = function(n, creator_id, doneCreateAreas){
	var self = this;

	async.timesSeries(n, function(n,doneEach){
		self.createArea(creator_id, doneEach)
	}, function(err){
		doneCreateAreas();
	});
}

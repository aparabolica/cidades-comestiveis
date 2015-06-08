
/**
 * Module dependencies.
 **/

var async = require('async');
var rosie = require('rosie').Factory;
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Area = mongoose.model('Area');
var Initiative = mongoose.model('Initiative');
var Resource = mongoose.model('Resource');

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

/**
 * Initiatives
 **/

rosie.define('Initiative')
	.sequence('name', function(i) { return 'name ' + i })
	.sequence('description', function(i) { return 'some description for initiative ' + i })
	.sequence('website', function(i) { return 'www ' + i })
	.sequence('facebook', function(i) { return 'facebook ' + i });


exports.createInitiative = function(creator_id, area_id, done){
	var initiative = new Initiative(rosie.build('Initiative'));
	initiative.creator = creator_id;
	initiative.save(function(err){
		done(err, initiative);
	})
}

exports.createInitiatives = function(n, creator_id, area_id, doneCreateInitiatives){
	var self = this;

	async.timesSeries(n, function(n,doneEach){
		self.createInitiative(creator_id, area_id, doneEach)
	}, doneCreateInitiatives);
}

/**
 * Initiatives
 **/

rosie.define('Resource')
	.sequence('description', function(i) {
			return 'some description for item ' + i
		})
	.sequence('name', function(i) { return 'name for item ' + i })
	.option('bbox', [-180,-90,180,90])
	.attr('geometry', ['bbox'], function(bbox){
		// http://geojson.org/geojson-spec.html#bounding-boxes
		var lat = bbox[1] + Math.random() * (bbox[3]-bbox[1]);
		var lon = bbox[0] + Math.random() * (bbox[2]-bbox[0]);

		return {
			type: 'Point',
			coordinates: [lon,lat]
		}
	})


exports.createResource = function(creatorId, bbox, done){
	var resource = new Resource(rosie.build('Resource', {},{bbox: bbox}));
	resource.creator = creatorId;
	resource.category = 'Tool';
	resource.save(function(err){
		done(err, resource);
	})
}

exports.createResources = function(n, creatorId, bbox, doneCreateResources){
	var self = this;
	async.timesSeries(n, function(i,doneEach){
		self.createResource(creatorId, bbox, doneEach)
	}, doneCreateResources);
}

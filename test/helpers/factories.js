
/**
 * Module dependencies.
 **/

var rosie = require('rosie').Factory;
var mongoose = require('mongoose');
var User = mongoose.model('User');

/**
 * The factories
 **/

rosie.define('User')
	.sequence('name', function(i) { return 'user' + i })
	.sequence('email', function(i) { return 'email' + i + '@example.com' })
	.attr('password', '123456')
	.attr('emailConfirmed', true)


/**
 * Helper functions
 **/

exports.createUser = function(done){
	var user = new User(rosie.build('User'));
	user.save(function(err){
		done(err, user);
	})
}
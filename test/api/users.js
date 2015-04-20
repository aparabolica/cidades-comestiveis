/* Module dependencies */

var request = require('supertest');
var async = require('async');
var should = require('should');

/* The app */

var app = require('../../app');

/* Helpers */

var expressHelper = require('../helpers/express');
var clearDb = require('../helpers/clearDb');
var factories = require('../helpers/factories');
var messaging = require('../../lib/messaging')

/* Config */

var config = require('../../config/config')['test'];
var apiPrefix = config.apiPrefix;

/* The tests */

describe('API: Users', function(){

  /* Init Application */

  before(function (doneBefore) {
    expressHelper.whenReady(function(){
      clearDb.all(function(err){
        should.not.exist(err);
        doneBefore();
      });
    });
  });

  /* POST /api/v#/users */

  describe('POST /api/v#/users', function(){
    context('when user info is valid', function(){
      it('return 201 (Created successfully) and the user info', function(doneIt){

        /* User info */
        var user = {
          name: 'User 1',
          email: 'user1@email.com',
          password: '+8characthers',
          longitude: -46.63318,
          latitude: -23.55046

        }

        /* The request */
        request(app)
          .post(apiPrefix + '/users')
          .send(user)
          .expect(201)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          should.not.exist(err);
          var
            body = res.body,
            section;

          /* User basic info */
          body.should.have.property('name', user.name);
          body.should.have.property('email', user.email);
          body.should.have.property('role');
          body.should.have.property('registeredAt');
          body.should.not.have.property('password');
          body.should.have.property('location');

          /* Location geojson */
          var locationGeojson = body.location;
          locationGeojson.should.have.property('type', 'Point');
          locationGeojson.should.have.property('coordinates');
          locationGeojson.coordinates.should.be.an.Array;

          /* Coordinates */
          var coordinates = locationGeojson.coordinates
          coordinates[0].should.be.equal(user.longitude);
          coordinates[1].should.be.equal(user.latitude);

          doneIt();
        }
      });

      it('can log succesfully');
    });

    context('when user name', function(){
      it('is empty return 400 (Bad request) and proper error message', function(doneIt){
        /* User info */
        var user = {
          name: '',
          email: 'user2@email.com',
          password: '+8characthers'
        }

        /* The request */
        request(app)
          .post(apiPrefix + '/users')
          .send(user)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          should.not.exist(err);

					res.body.messages.should.have.lengthOf(1);
					messaging.hasValidMessages(res.body).should.be.true;
					res.body.messages[0].should.have.property('text', 'mongoose.errors.user.missing_name');
					doneIt();
        }
      });
    });

    context('when email', function(){
      it('is missing return 400 (Bad request) and proper error message', function(doneIt){
        /* User info */
        var user = {
          name: 'User2',
          password: '+8characthers'
        }

        /* The request */
        request(app)
          .post(apiPrefix + '/users')
          .send(user)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          should.not.exist(err);

          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'mongoose.errors.user.missing_email');
          doneIt();
        }
      });

      it('is invalid return 400 (Bad request) and proper error message', function(doneIt){
        /* User info */
        var user = {
          name: 'User2',
          email: 'not a valid e-mail',
          password: '+8characthers'
        }

        /* The request */
        request(app)
          .post(apiPrefix + '/users')
          .send(user)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          should.not.exist(err);

          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'mongoose.errors.user.invalid_email');
          doneIt();
        }
      });

      it('already exists return 400 (Bad request) and proper error message', function(doneIt){
        /* User info */
        var user = {
          name: 'User2',
          email: 'user1@email.com',
          password: '+8characthers'
        }

        /* The request */
        request(app)
          .post(apiPrefix + '/users')
          .send(user)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          should.not.exist(err);

          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'mongoose.errors.user.email_already_registered');
          doneIt();
        }
      });
    });
    context('when password', function(){
      it('is missing return 400 (Bad request) and proper error message', function(doneIt){
        /* User info */
        var user = {
          name: 'User2',
          email: 'user2@email.com'
        }

        /* The request */
        request(app)
          .post(apiPrefix + '/users')
          .send(user)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          should.not.exist(err);

          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'mongoose.errors.user.missing_password');
          doneIt();
        }
      });

      it('is too short return 400 (Bad request) and proper error message', function(doneIt){
        /* User info */
        var user = {
          name: 'User2',
          email: 'user2@email.com',
          password: 'short'
        }

        /* The request */
        request(app)
          .post(apiPrefix + '/users')
          .send(user)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          should.not.exist(err);

          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'mongoose.errors.user.short_password');
          doneIt();
        }

      });
    });
  });


  describe('GET /api/v#/users/:id', function(){
    context('User exists', function(){
      it('should return user public info')
    })
  })
});

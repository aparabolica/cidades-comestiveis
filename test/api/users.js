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

/* Expose object instances */
var user1;

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
    context('when parameters are valid', function(){
      it('return 201 (Created successfully) and the user info', function(doneIt){
        /* User info */
        user1 = {
          name: 'User 1',
          email: 'user1@email.com',
          password: '+8characthers',
          longitude: -46.63318,
          latitude: -23.55046

        }

        /* The request */
        request(app)
          .post(apiPrefix + '/users')
          .send(user1)
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
          body.should.have.property('_id');
          body.should.have.property('name', user1.name);
          body.should.have.property('email', user1.email);
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
          coordinates[0].should.be.equal(user1.longitude);
          coordinates[1].should.be.equal(user1.latitude);

          /* Keep user id for later use */
          user1.id = body._id;

          doneIt();
        }
      });

    });

    context('when user name', function(){
      it('is missing return 400 (Bad request) and proper error message', function(doneIt){
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
      it('should return user public info', function(doneIt){
        /* The request */
        request(app)
          .get(apiPrefix + '/users/'  + user1.id)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          /* User public info */
          var body = res.body;
          body.should.have.property('_id', user1.id);
          body.should.have.property('name', user1.name);
          body.should.have.property('registeredAt');
          body.should.not.have.property('email');
          body.should.not.have.property('password');
          body.should.not.have.property('location');
          doneIt();
        }
      })
    });

    context('User does not exists', function(){
      it('should return 404 (Not found) and error message', function(doneIt){

        /* The request */
        request(app)
          .get(apiPrefix + '/users/111111111111111111111111')
          .expect(404)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          /* Check error message */
          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'errors.users.not_found');
          doneIt();
        }
      })
    })

    context('Invalid id (not a positive integer)', function(){
      it('should return 404 (Not found) and error message', function(doneIt){

        /* The request */
        request(app)
          .get(apiPrefix + '/users/1a')
          .expect(404)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          /* Check error message */
          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'errors.users.invalid_id');
          doneIt();
        }
      })
    })

  })
});

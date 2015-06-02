/* Module dependencies */

var request = require('supertest');
var _ = require('underscore');
var async = require('async');
var should = require('should');
var mongoose = require('mongoose');

/* The app */

var app = require('../../app');

/* Helpers */

var expressHelper = require('../helpers/express');
var clearDb = require('../helpers/clearDb');
var factory = require('../helpers/factory');
var messaging = require('../../lib/messaging')

/* Config */

var config = require('../../config/config')['test'];
var apiPrefix = config.apiPrefix;

/* Mongoose models */

var User = mongoose.model('User');
var Area = mongoose.model('Area');

/* Expose object instances */
var admin1;
var admin1AccessToken;
var user1;
var user1AccessToken;
var user2;
var user2AccessToken;

/* The tests */

describe('API: Users', function(){

  /* Init Application */

  before(function (doneBefore) {
    expressHelper.whenReady(function(){
      clearDb.all(function(err){
        should.not.exist(err);

        async.series([function(doneEach){
          factory.createUser(function(err, admin1){
            should.not.exist(err);

            admin1.should.have.property('role', 'admin');
            expressHelper.login(admin1.email, admin1.password, function(token){
              admin1AccessToken = token;
              doneEach();
            });
          });
        }, function (doneEach){
          factory.createUser(function(err,usr){
            should.not.exist(err);
            user1 = usr;
            expressHelper.login(user1.email, user1.password, function(token){
              user1AccessToken = token;
              factory.createAreas(9, user1, doneEach);
            });
          });
        }, function(doneEach){
          /* Create 25 users */
          factory.createUsers(24, doneEach);

        }, function(doneEach){
          Area.findOne({}, function(err, area){
            should.not.exist(err);
            factory.createInitiatives(12, user1._id, area._id, doneEach);
          });
        }], doneBefore);
      });
    });
  });

  /* POST /api/v#/users */

  describe('POST /api/v#/users', function(){
    context('when parameters are valid', function(){
      it('return 201 (Created successfully) and the user info', function(doneIt){
        /* User info */
        var payload = {
          name: 'First user',
          email: 'theveryfirstuser@email.com',
          password: '+8characthers',
          longitude: -46.63318,
          latitude: -23.55046
        }

        /* The request */
        request(app)
          .post(apiPrefix + '/users')
          .send(payload)
          .expect(201)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          should.not.exist(err);
          var body = res.body;

          /* User basic info */
          body.should.have.property('_id');
          body.should.have.property('name', payload.name);
          body.should.have.property('email', payload.email);
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
          coordinates[0].should.be.equal(payload.longitude);
          coordinates[1].should.be.equal(payload.latitude);

          user2 = body;

          expressHelper.login(payload.email, payload.password, function(token){
            user2AccessToken = token;
            doneIt();
          });
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
					res.body.messages[0].should.have.property('text', 'mongoose.errors.users.missing_name');
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
          res.body.messages[0].should.have.property('text', 'mongoose.errors.users.missing_email');
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
          res.body.messages[0].should.have.property('text', 'mongoose.errors.users.invalid_email');
          doneIt();
        }
      });

      it('already exists return 400 (Bad request) and proper error message', function(doneIt){
        /* User info */
        var user = {
          name: 'User2',
          email: 'theveryfirstuser@email.com',
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
          res.body.messages[0].should.have.property('text', 'mongoose.errors.users.email_already_registered');
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
          res.body.messages[0].should.have.property('text', 'mongoose.errors.users.missing_password');
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
          res.body.messages[0].should.have.property('text', 'mongoose.errors.users.short_password');
          doneIt();
        }

      });
    });
  });

  describe('PUT /api/v#/users', function(){
    context('not logged in', function(){
      it('should return 401 (Unauthorized)', function(doneIt){
        request(app)
          .put(apiPrefix + '/users/'+ user1.id)
          .expect(401)
          .end(function(err,res){
            should.not.exist(err);
            res.body.messages.should.have.lengthOf(1);
            messaging.hasValidMessages(res.body).should.be.true;
            res.body.messages[0].should.have.property('text', 'access_token.unauthorized');
            doneIt();
          });
      });
    });

    context('when parameters are missing', function() {
      it('should return 400 (Bad request)', function(doneIt){

        /* The request */
        request(app)
          .put(apiPrefix + '/users/'+ user1.id)
          .set('Authorization', user1AccessToken)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          should.not.exist(err);

					res.body.messages.should.have.lengthOf(1);
					messaging.hasValidMessages(res.body).should.be.true;
					res.body.messages[0].should.have.property('text', 'errors.users.missing_parameters');
					doneIt();
        }
      });
    });

    context('when trying to change e-mail', function(){
      it('should return 400 (Bad request)', function(doneIt){

        /* The request */
        request(app)
          .put(apiPrefix + '/users/'+ user1.id)
          .set('Authorization', user1AccessToken)
          .send({email: 'new@email.com'})
          .expect(400)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          should.not.exist(err);

          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'errors.users.cannot_change_email');
          doneIt();
        }
      });
    })

    context('when changing password', function(){
      it('return 400 (Bad request) if missing current password', function(doneIt){
        /* The request */
        request(app)
          .put(apiPrefix + '/users/'+ user1.id)
          .set('Authorization', user1AccessToken)
          .send({password: 'mynewpassword'})
          .expect(400)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          should.not.exist(err);

          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'errors.users.missing_current_password');
          doneIt();
        }
      });

      it('return 400 (Bad request) if invalid current password', function(doneIt){
        /* The request */
        request(app)
          .put(apiPrefix + '/users/'+ user1.id)
          .set('Authorization', user1AccessToken)
          .send({currentPassword: 'awrongpassword', password: 'mynewpassword'})
          .expect(400)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          should.not.exist(err);

          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'errors.users.wrong_password');
          doneIt();
        }
      })

      it('return 400 (Bad request) if new password is invalid', function(doneIt){

        /* The request */
        request(app)
          .put(apiPrefix + '/users/'+ user1.id)
          .set('Authorization', user1AccessToken)
          .send({currentPassword: user1.password, password: 'short'})
          .expect(400)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'mongoose.errors.users.short_password');
          doneIt();
        }
      })

      it('return 200 (Success) if current and new password are valid', function(doneIt){

        var payload = {
          currentPassword: user1.password,
          password: 'aperfectpassword'
        }

        /* The request */
        request(app)
          .put(apiPrefix + '/users/'+ user1.id)
          .set('Authorization', user1AccessToken)
          .send({currentPassword: user1.password, password: 'aperfectpassword'})
          .expect(200)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          var body = res.body;

          /* Returned user object should be valid */
          Object.keys(body).should.have.length(7);
          body.should.have.property('_id');
          body.should.have.property('name', user1.name);
          body.should.have.property('email', user1.email);
          body.should.have.property('role');
          body.should.have.property('bio');
          body.should.have.property('registeredAt');
          body.should.have.property('location');

          User.findById(user1.id, function(err, user){
            if (err) return doneIt(err);

            should.exist(user);

            should(user.authenticate(payload.password)).be.true;
            doneIt();
          })
        }

      });
    });

    context('when properties are valid',function(){
      it('should return 200 (Success) and updated user document', function(doneIt){

        var payload = {
          name: 'First user renamed',
          longitude: -46.22222,
          latitude: -23.22222
        }

        /* The request */
        request(app)
          .put(apiPrefix + '/users/'+ user1.id)
          .set('Authorization', user1AccessToken)
          .send(payload)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) doneIt(err);
          var body = res.body;

          Object.keys(body).should.have.length(7);
          body.should.have.property('_id');
          body.should.have.property('name', payload.name);
          body.should.have.property('email', user1.email);
          body.should.have.property('role');
          body.should.have.property('bio');
          body.should.have.property('registeredAt');
          body.should.have.property('location');

          /* Location geojson */
          var locationGeojson = body.location;
          locationGeojson.should.have.property('type', 'Point');
          locationGeojson.should.have.property('coordinates');
          locationGeojson.coordinates.should.be.an.Array;

          /* Coordinates */
          var coordinates = locationGeojson.coordinates
          coordinates[0].should.be.equal(payload.longitude);
          coordinates[1].should.be.equal(payload.latitude);

          user1 = _.extend(user1, payload);
          doneIt();
        }
      })
    })
  })


  describe('GET /api/v#/users/:id', function(){
    context('and user exists', function(){
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
  })

  describe('GET /api/v#/users/:id/contributions', function(){
    it('should return a list of areas and initiatives', function(doneIt){
      /* The request */
      request(app)
        .get(apiPrefix + '/users/'  + user1._id + '/contributions')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(onResponse);

      /* Verify response */
      function onResponse(err, res) {
        if (err) return doneIt(err);

        /* User public info */
        var body = res.body;
        body.should.have.property('contributions');
        body.contributions.should.be.instanceOf(Array).and.have.length(21);

        _.each(body.contributions, function(c){
          c.should.have.property('type');
        })

        doneIt();
      }
    });
  });


  describe('GET /api/v#/users', function(){
    context('with invalid parameters', function(){
      it('should return 400 (Bad request) and error message', function(doneIt){
        var params = {
          perPage: 'not an integer',
          page: 'not an integer'
        };

        /* The request */
        request(app)
          .get(apiPrefix + '/users')
          .query(params)
          .expect('Content-Type', /json/)
          .expect(400)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          /* Check error message */
          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'errors.query.invalid_parameters');
          doneIt();
        };

      });
    });

    context('without parameters', function(){
      it('should get first page', function(doneIt){
        /* The request */
        request(app)
          .get(apiPrefix + '/users')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          /* Check pagination */
          var body = res.body;
          body.should.have.property('count', 27);
          body.should.have.property('perPage', 10);
          body.should.have.property('page', 1);
          body.should.have.property('users');

          /* Check data */
          var data = body.users;
          data.should.have.lengthOf(10);
          User.find({}).sort('name').limit(10).exec(function(err, users){
            if (err) return doneIt(err);
            for (var i = 0; i < 10; i++) {
              Object.keys(data[i]).should.have.length(2);
              data[i].should.have.property('_id', users[i]._id.toHexString());
              data[i].should.have.property('name', users[i].name);
            }
             doneIt();
          })
        }
      });
    });

    context('with optional parameters', function(){

      it('should get second page accordingly', function(doneIt){
        var params = {
          page: 2
        };

        /* The request */
        request(app)
          .get(apiPrefix + '/users')
          .query(params)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          /* Check pagination */
          var body = res.body;
          body.should.have.property('count', 27);
          body.should.have.property('perPage', 10);
          body.should.have.property('page', 2);
          body.should.have.property('users');

          /* Check data */
          var data = body.users;
          data.should.have.lengthOf(10);
          User.find({}).sort('name').skip(10).limit(10).exec(function(err, users){
            if (err) return doneIt(err);
            for (var i = 0; i < 10; i++) {
              Object.keys(data[i]).should.have.length(2);
              data[i].should.have.property('_id', users[i]._id.toHexString());
              data[i].should.have.property('name', users[i].name);
            }
            doneIt();
          });
        }
      });

      it('should get list with a different perPage setting', function(doneIt){
        var params = {
          page: 3,
          perPage: 8
        };

        var skip = params.perPage * (params.page-1);

        /* The request */
        request(app)
          .get(apiPrefix + '/users')
          .query(params)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          /* Check pagination */
          var body = res.body;
          body.should.have.property('count', 27);
          body.should.have.property('perPage', params.perPage);
          body.should.have.property('page', params.page);
          body.should.have.property('users');

          /* Check data */
          var data = body.users;
          data.should.have.lengthOf(params.perPage);

          User.find({})
            .sort('name')
            .skip(skip)
            .limit(params.perPage)
            .exec(function(err, users){
              if (err) return doneIt(err);

              /* Verify user list */
              for (var i = 0; i < params.perPage; i++) {

                var responseUser = data[i];
                var dbUser = users[i];

                /* Verify user object */
                Object.keys(responseUser).should.have.length(2);
                responseUser.should.have.property('_id', dbUser._id.toHexString());
                responseUser.should.have.property('name', dbUser.name);
              }
              doneIt();
          });
        }
      });
    });
  });


});

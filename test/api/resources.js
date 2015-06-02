/* Module dependencies */

var request = require('supertest');
var async = require('async');
var should = require('should');
var moment = require('moment');
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

/* Agents and objects */
var admin1;
var admin1AccessToken;
var user1;
var user1AccessToken;
var user1Resource1;
var user1Resource2;
var user2;
var user2AccessToken;

/* Pagination */
var resourceCount = 60;
var defaultPerPage = 30;
var defaultPage = 1;


/* The tests */

describe('API: Resources', function(){

  before(function (doneBefore) {

    /*
     * Init database
     */

    expressHelper.whenReady(function(){
      clearDb.all(function(err){
        should.not.exist(err);
        async.series([createUsers, createResources], doneBefore)
      });
    });

    /*
     * Create users
     */
    function createUsers(doneCreateUsers) {
      async.series([function(done){
        factory.createUser(function(err,usr){
          should.not.exist(err);
          // first user is admin
          admin1 = usr;
          expressHelper.login(admin1.email, admin1.password, function(token){
            admin1AccessToken = token;
            done();
          });
        });
      }, function(done){
        factory.createUser(function(err,usr){
          should.not.exist(err);
          user1 = usr;
          expressHelper.login(user1.email, user1.password, function(token){
            user1AccessToken = token;
            done();
          });
        });
      },function(done){
        factory.createUser(function(err,usr){
          should.not.exist(err);
          user2 = usr;
          expressHelper.login(user2.email, user2.password, function(token){
            user2AccessToken = token;
            done();
          });
        });
      }], doneCreateUsers);
    }

    /*
     * Create resources
     */
    function createResources(doneCreateResources) {
      factory.createResources(resourceCount, user1, doneCreateResources);
    }


  });



  /*
    POST /api/v1/resources
  */

  describe('POST /api/v1/resources', function(){
    context('not logged in', function(){
      it('should return 401 (Unauthorized)', function(doneIt){
        request(app)
          .post(apiPrefix + '/resources')
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

    context('when logged in', function(){
      it('return 201 (Created) for valid payload', function(doneIt){
        var payload = {
          availableAt: new Date('2015-10-01'),
          availableUntil: new Date('2015-11-02'),
          category: 'Supply',
          description: 'Sharing a resource'
        }

        request(app)
          .post(apiPrefix + '/resources')
          .set('Authorization', user1AccessToken)
          .send(payload)
          .expect(201)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;

            body.should.have.property('availableAt');
            body.should.have.property('availableUntil');
            body.should.have.property('creator', user1._id.toHexString());
            body.should.have.property('category', payload.category);
            body.should.have.property('geometry');

            user1Resource1 = res.body;

            doneIt();
          })
      });

      it('return 400 (Bad request) for invalid payload', function(doneIt){
        var payload = {
          description: 'Sharing a resource'
        }

        request(app)
          .post(apiPrefix + '/resources')
          .set('Authorization', user1AccessToken)
          .send(payload)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;

            res.body.messages.should.have.lengthOf(1);
  					messaging.hasValidMessages(res.body).should.be.true;
  					res.body.messages[0].should.have.property('text', 'mongoose.errors.resources.missing_category');

            doneIt();
          });
      });
    });
  });

  /*
    GET /api/v1/resources/:id
  */

  describe('GET /api/v1/resources/:id', function(){
    it('return status 200 and object json for valid id', function(doneIt){
      request(app)
        .get(apiPrefix + '/resources/' + user1Resource1._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          should.not.exist(err);
          var body = res.body;

          body.should.have.property('availableAt', user1Resource1.availableAt);
          body.should.have.property('availableUntil', user1Resource1.availableUntil);
          body.should.have.property('creator');
          body.should.have.property('category', user1Resource1.category);
          body.should.have.property('geometry');

          doneIt();
        });
    });

    it('return 404 for id not found', function(doneIt){
      request(app)
        .get(apiPrefix + '/resources/556899153f90be8f422f3d3f')
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          should.not.exist(err);
          var body = res.body;

          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'errors.resources.not_found');

          doneIt();
        });
    });
  });

  /*
    GET /api/v1/resources
  */

  describe('GET /api/v1/resources', function(){
    context('valid parameters', function(){
      it('return 200 and first page when no parameters are passed', function(doneIt){

        /* The request */
        request(app)
          .get(apiPrefix + '/resources')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          /* Check pagination */
          var body = res.body;
          body.should.have.property('count', resourceCount+1);
          body.should.have.property('perPage', defaultPerPage);
          body.should.have.property('page', defaultPage);
          body.should.have.property('resources');

          /* Check data */
          var data = body.resources;
          data.should.have.lengthOf(defaultPerPage);
          mongoose.model('Resource')
            .find({})
            .sort('availableUntil')
            .limit(defaultPerPage)
            .populate('creator', '_id name')
            .lean()
            .exec(function(err, resources){
              if (err) return doneIt(err);
              for (var i = 0; i < defaultPerPage; i++) {

                var resource = resources[i];
                data[i].should.have.property('_id', resource._id.toHexString());
                data[i].should.have.property('description', resource.description);

                var creator = resource.creator;
                data[i].should.have.property('creator');
                data[i]['creator'].should.have.property('name');
                data[i]['creator'].should.have.property('_id');
              }
              doneIt();
            });
        }
      });

      it('return 200 and proper page when parameters are passed', function(doneIt){

        var options = {
          page: 3,
          perPage: 14
        }

        /* The request */
        request(app)
          .get(apiPrefix + '/resources')
          .query(options)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          /* Check pagination */
          var body = res.body;
          body.should.have.property('count', resourceCount+1);
          body.should.have.property('perPage', options.perPage);
          body.should.have.property('page', options.page);
          body.should.have.property('resources');

          /* Check data */
          var data = body.resources;
          data.should.have.lengthOf(options.perPage);
          mongoose.model('Resource')
              .find({})
              .sort('availableUntil')
              .limit(options.perPage)
              .skip(options.perPage*(options.page-1))
              .populate('creator', '_id name')
              .lean()
              .exec(function(err, resources){
                if (err) return doneIt(err);

                for (var i = 0; i < options.perPage; i++) {

                  var resource = resources[i];
                  data[i].should.have.property('_id', resource._id.toHexString());
                  data[i].should.have.property('description', resource.description);

                  var creator = resource.creator;
                  data[i].should.have.property('creator');
                  data[i]['creator'].should.have.property('name');
                  data[i]['creator'].should.have.property('_id');
                }
                doneIt();
              });
        }
      });
    });

    context('bad parameters', function(){
      it('return 400 and error messages', function(doneIt){
        var params = {
          perPage: 'not an integer',
          page: 'not an integer'
        };

        /* The request */
        request(app)
          .get(apiPrefix + '/resources')
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
          res.body.messages[0].should.have.property('text', 'errors.resources.list.invalid_pagination');
          doneIt();
        };
      });
    });
  });


  /*
    PUT /api/v1/resources/:id
  */

  describe('PUT /api/v1/resources/:id', function(){
    context('not logged in', function(){
      it('should return 401 (Unauthorized)', function(doneIt){
        mongoose.model('Resource').findOne(function(err, resource){
          should.not.exist(err);
          should.exist(resource);
          request(app)
            .put(apiPrefix + '/resources/'+resource._id)
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
    });

    context('when logged as user1', function(){
      it('return 200 (Success) for valid data', function(doneIt){
        var payload = {
          description: 'changed description',
        }

        request(app)
          .put(apiPrefix + '/resources/'+ user1Resource1._id)
          .set('Authorization', user1AccessToken)
          .send(payload)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;

            body.should.have.property('description', payload.description);

            /* Keep area for later usage */
            user1Resource1 = res.body;

            doneIt();
          });
      });

      it('return 400 (Bad request) for invalid parameters');
      it('return 404 (Not found) for id not found');
    });

    context('when editor is not the creator', function(){
      it('return 200 (Success) for admins', function(doneIt){
        var payload = {
          description: 'a changed description by admin',
        }

        request(app)
          .put(apiPrefix + '/resources/'+ user1Resource1._id)
          .set('Authorization', admin1AccessToken)
          .send(payload)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;

            body.should.have.property('description', payload.description);

            /* Keep area for later usage */
            user1Resource1 = res.body;

            doneIt();
          });
      });

      it('return 401 (Unauthorized) for other users', function(doneIt){
        var payload = {
          name: 'another new name',
        }


        request(app)
          .put(apiPrefix + '/resources/'+user1Resource1._id)
          .set('Authorization', user2AccessToken)
          .send(payload)
          .expect(401)
          .end(function(err,res){
            should.not.exist(err);
            res.body.messages.should.have.lengthOf(1);
            messaging.hasValidMessages(res.body).should.be.true;
            res.body.messages[0].should.have.property('text', 'access_token.unauthorized');
            doneIt();
          });
      });
    })
  });



  /*
   * After tests, clear database
   */

  after(function (done) {
    clearDb.all(function(err){
      should.not.exist(err);
      done(err);
    });
  });
})

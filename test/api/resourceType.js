/* Module dependencies */

var request = require('supertest');
var async = require('async');
var should = require('should');
var moment = require('moment');
var mongoose = require('mongoose');

/* The app */

var app = require('../../app');

/* Models */
var ResourceType = mongoose.model('ResourceType');

/* Helpers */

var expressHelper = require('../helpers/express');
var clearDb = require('../helpers/clearDb');
var factory = require('../helpers/factory');
var messaging = require('../../lib/messaging')

/* Config */

var config = require('../../config/config')['test'];
var apiPrefix = config.apiPrefix;

/* Some users */
var admin1;
var admin1AccessToken;
var admin1ResourceType1
var user1;
var user1AccessToken;

/* Pagination */
var resourceTypeCount = 34;
var defaultPerPage = 30;
var defaultPage = 1;


/* The tests */

describe('API: Resource Types', function(){

  before(function (doneBefore) {

    /*
     * Init database
     */

    expressHelper.whenReady(function(){
      clearDb.all(function(err){
        should.not.exist(err);
      async.series([createUsers, createResourceTypes], doneBefore)
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
      }], doneCreateUsers);
    }

    function createResourceTypes(doneCreateResourceTypes) {
      factory.createResourceTypes(33, doneCreateResourceTypes)
    }
  });



  /*
    POST /api/v1/resource_type
  */

  describe('POST /api/v1/resource_types', function(){
    context('not logged in', function(){
      it('should return 401 (Unauthorized)', function(doneIt){
        request(app)
          .post(apiPrefix + '/resource_types')
          // .expect(401)
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
      it('return 401 (Unauthorized) for non-admin users', function(doneIt){
          var payload = {
            category: 'Tool',
            name: 'Hammer'
          }

          request(app)
            .post(apiPrefix + '/resource_types')
            .set('Authorization', user1AccessToken)
            .send(payload)
            .expect(401)
            .expect('Content-Type', /json/)
            .end(function(err, res){
              should.not.exist(err);
              res.body.messages.should.have.lengthOf(1);
              messaging.hasValidMessages(res.body).should.be.true;
              res.body.messages[0].should.have.property('text', 'access_token.unauthorized');
              doneIt();
            });
      });


      it('return 201 (Created) for valid data posted by admin', function(doneIt){
        var payload = {
          category: 'Tool',
          name: 'Hammer',
          description: 'Tool to drive nails'
        }

        request(app)
          .post(apiPrefix + '/resource_types')
          .set('Authorization', admin1AccessToken)
          .send(payload)
          .expect(201)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;

            body.should.have.property('category', payload.category);
            body.should.have.property('name', payload.name);
            body.should.have.property('description', payload.description);

            // keep for later use
            admin1ResourceType1 = res.body;

            doneIt();
          })
      });

      it('return 400 (Bad request) for invalid data', function(doneIt){
        var payload = {
          name: '',
          category: 'Tool'
        }

        request(app)
          .post(apiPrefix + '/resource_types')
          .set('Authorization', admin1AccessToken)
          .send(payload)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;

            res.body.messages.should.have.lengthOf(1);
  					messaging.hasValidMessages(res.body).should.be.true;
  					res.body.messages[0].should.have.property('text', 'mongoose.errors.resource_types.missing_name');

            doneIt();
          });
      });
    });
  });

  /*
    GET /api/v1/resource_types/:id
  */

  describe('GET /api/v1/resource_types/:id', function(){
    it('return status 200 and object json for valid id', function(doneIt){
      request(app)
        .get(apiPrefix + '/resource_types/' + admin1ResourceType1._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          should.not.exist(err);
          var body = res.body;

          body.should.have.property('category', admin1ResourceType1.category);
          body.should.have.property('name', admin1ResourceType1.name);
          body.should.have.property('description', admin1ResourceType1.description);

          doneIt();
        });
    });

    it('return 404 for id not found', function(doneIt){
      request(app)
        .get(apiPrefix + '/resource_types/556899153f90be8f422f3d3f')
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          should.not.exist(err);
          var body = res.body;

          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'errors.resource_types.not_found');

          doneIt();
        });
    });
  });

  /*
    GET /api/v1/resource_type
  */

  describe('GET /api/v1/resource_types', function(){
    context('valid parameters', function(){
      it('return 200 and first page when no parameters are passed', function(doneIt){

        /* The request */
        request(app)
          .get(apiPrefix + '/resource_types')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          /* Check pagination */
          var body = res.body;
          body.should.have.property('count', resourceTypeCount);
          body.should.have.property('perPage', defaultPerPage);
          body.should.have.property('page', defaultPage);
          body.should.have.property('resourceTypes');

          /* Check data */
          var data = body.resourceTypes;
          data.should.have.lengthOf(defaultPerPage);
          mongoose.model('ResourceType')
            .find({})
            .sort('name')
            .limit(defaultPerPage)
            .lean()
            .exec(function(err, rts){
              if (err) return doneIt(err);
              for (var i = 0; i < defaultPerPage; i++) {

                var rt = rts[i];
                data[i].should.have.property('category', rt.category);
                data[i].should.have.property('name', rt.name);
                data[i].should.have.property('description', rt.description);

              }
             doneIt();
            });
        }
      });

      it('return 200 and proper page when parameters are passed', function(doneIt){

        var options = {
          page: 2,
          perPage: 11
        }

        /* The request */
        request(app)
          .get(apiPrefix + '/resource_types')
          .query(options)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          /* Check pagination */
          var body = res.body;
          body.should.have.property('count', resourceTypeCount);
          body.should.have.property('perPage', options.perPage);
          body.should.have.property('page', options.page);
          body.should.have.property('resourceTypes');

          /* Check data */
          var data = body.resourceTypes;
          data.should.have.lengthOf(options.perPage);
          mongoose.model('ResourceType')
              .find({})
              .sort('name')
              .limit(options.perPage)
              .skip(options.perPage*(options.page-1))
              .lean()
          .exec(function(err, rts){
            if (err) return doneIt(err);

            for (var i = 0; i < options.perPage; i++) {

              var rt = rts[i];
              data[i].should.have.property('category', rt.category);
              data[i].should.have.property('name', rt.name);
              data[i].should.have.property('description', rt.description);

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
          .get(apiPrefix + '/resource_types')
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
          res.body.messages[0].should.have.property('text', 'errors.resource_types.list.invalid_pagination');
          doneIt();
        };
      });
    });
  });


  /*
    PUT /api/v1/resource_types/:id
  */

  describe('PUT /api/v1/resource_types/:id', function(){
    context('not logged in', function(){
      it('should return 401 (Unauthorized)', function(doneIt){
        ResourceType.findOne(function(err, rt){
          should.not.exist(err);
          should.exist(rt);
          request(app)
            .put(apiPrefix + '/resource_types/'+rt._id)
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

    context('when logged as admin', function(){
      it('return 200 (Success) for valid data', function(doneIt){
        var payload = {
          name: 'rt new name',
          description: 'changed description',
          category: 'Knowledge'
        }

        request(app)
          .put(apiPrefix + '/resource_types/'+ admin1ResourceType1._id)
          .set('Authorization', admin1AccessToken)
          .send(payload)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;

            body.should.have.property('category', payload.category);
            body.should.have.property('name', payload.name);
            body.should.have.property('description', payload.description);

            /* Keep area for later usage */
            admin1ResourceType1 = res.body;

            doneIt();
          });
      });

      it('return 400 (Bad request) for invalid parameters');
      it('return 404 (Not found) for id not found');
    });

    context('when editor is a regular user', function(){

      it('return 401 (Unauthorized) for other users', function(doneIt){
        var payload = {
          name: 'another new name',
        }

        request(app)
          .put(apiPrefix + '/resource_types/'+admin1ResourceType1._id)
          .set('Authorization', user1AccessToken)
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

/* Module dependencies */

var request = require('supertest');
var async = require('async');
var should = require('should');
var moment = require('moment');
var mongoose = require('mongoose');

/* The app */

var app = require('../../app');

/* Models */
var Initiative = mongoose.model('Initiative');

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
var user1;
var user1AccessToken;
var user1Area1;
var user1Area2;
var user1Initiative1;
var user2;
var user2AccessToken;
var user2Area1;
var user2Area2;

/* Pagination */
var initiativeCount = 71;
var defaultPerPage = 30;
var defaultPage = 1;


/* The tests */

describe('API: Initiatives', function(){

  before(function (doneBefore) {

    /*
     * Init database
     */

    expressHelper.whenReady(function(){
      clearDb.all(function(err){
        should.not.exist(err);
        async.series([createUsers, createAreas, createInitiatives], doneBefore)
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
     * Create areas
     */
    function createAreas(doneCreateAreas) {
      async.parallel([function(doneCreateArea){
        factory.createArea(user1._id, function(err, area){
          should.not.exist(err);
          user1Area1 = area;
          doneCreateArea();
        });
      }, function(doneCreateArea){
        factory.createArea(user1._id, function(err,area){
          should.not.exist(err);
          user1Area2 = area;
          doneCreateArea();
        });
      }, function(doneCreateArea){
        factory.createArea(user2._id, function(err,area){
          should.not.exist(err);
          user2Area1 = area;
          doneCreateArea();
        });
      }, function(doneCreateArea){
        factory.createArea(user2._id, function(err,area){
          should.not.exist(err);
          user2Area2 = area;
          doneCreateArea();
        });
      }], doneCreateAreas);
    }

    /*
     * Create initiatives
     */
    function createInitiatives(doneCreateInitiatives) {
      factory.createInitiatives(70, user1, user1Area1, doneCreateInitiatives);
    }
  });



  /*
    POST /api/v1/initiatives
  */

  describe('POST /api/v1/initiatives', function(){
    context('not logged in', function(){
      it('should return 401 (Unauthorized)', function(doneIt){
        request(app)
          .post(apiPrefix + '/initiatives')
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
      it('return 201 (Created) for valid initiative data', function(doneIt){
        var initiative = {
          name: 'Initiative #1',
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur ultricies felis at.',
          creator: user1._id,
          areas: [user1Area1._id, user2Area1._id]
        }

        request(app)
          .post(apiPrefix + '/initiatives')
          .set('Authorization', user1AccessToken)
          .send(initiative)
          .expect(201)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;

            body.should.have.property('name', initiative.name);
            body.should.have.property('description', initiative.description);
            body.should.have.property('creator', user1._id.toHexString());
            body.should.have.property('areas');
            body.areas.should.be.instanceOf(Array).and.have.length(2);

            user1Initiative1 = res.body;

            doneIt();
          })
      });

      it('return 400 (Bad request) for invalid initiative data', function(doneIt){
        var initiative = {
          name: '',
          initiatives: [user1Area1._id, user2Area1._id]
        }

        request(app)
          .post(apiPrefix + '/initiatives')
          .set('Authorization', user1AccessToken)
          .send(initiative)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;

            res.body.messages.should.have.lengthOf(1);
  					messaging.hasValidMessages(res.body).should.be.true;
  					res.body.messages[0].should.have.property('text', 'mongoose.errors.initiatives.missing_name');

            doneIt();
          });
      });
    });
  });

  /*
    GET /api/v1/initiatives/:id
  */

  describe('GET /api/v1/initiatives/:id', function(){
    it('return status 200 and object json for valid id', function(doneIt){
      request(app)
        .get(apiPrefix + '/initiatives/' + user1Initiative1._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          should.not.exist(err);
          var body = res.body;

          body.should.have.property('name', user1Initiative1.name);
          body.should.have.property('description', user1Initiative1.description);
          body.should.have.property('creator');
          body.creator.should.have.property('_id', user1._id.toHexString());
          body.creator.should.have.property('name', user1.name);
          body.should.have.property('areas');
          body.areas.should.be.instanceOf(Array).and.have.length(2);

          doneIt();
        });
    });

    it('return 404 for id not found', function(doneIt){
      request(app)
        .get(apiPrefix + '/initiatives/556899153f90be8f422f3d3f')
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          should.not.exist(err);
          var body = res.body;

          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'errors.initiatives.not_found');

          doneIt();
        });
    });
  });

  /*
    GET /api/v1/initiatives
  */

  describe('GET /api/v1/initiatives', function(){
    context('valid parameters', function(){
      it('return 200 and first page when no parameters are passed', function(doneIt){

        /* The request */
        request(app)
          .get(apiPrefix + '/initiatives')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          /* Check pagination */
          var body = res.body;
          body.should.have.property('count', initiativeCount);
          body.should.have.property('perPage', defaultPerPage);
          body.should.have.property('page', defaultPage);
          body.should.have.property('initiatives');

          /* Check data */
          var data = body.initiatives;
          data.should.have.lengthOf(defaultPerPage);
          mongoose.model('Initiative').find({}).sort('name').limit(defaultPerPage).populate('creator', '_id name').lean().exec(function(err, initiatives){
            if (err) return doneIt(err);
            for (var i = 0; i < defaultPerPage; i++) {

              var initiative = initiatives[i];
              data[i].should.have.property('_id', initiative._id.toHexString());
              data[i].should.have.property('name', initiative.name);
              data[i].should.have.property('description', initiative.description);

              data[i].should.have.property('createdAt');
              var createdAt = moment(data[i].createdAt).format();
              createdAt.should.equal(moment(initiative.createdAt).format());

              data[i].should.have.property('areas');
              data[i].areas.should.be.instanceOf(Array);

              var creator = initiative.creator;
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
          .get(apiPrefix + '/initiatives')
          .query(options)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          /* Check pagination */
          var body = res.body;
          body.should.have.property('count', initiativeCount);
          body.should.have.property('perPage', options.perPage);
          body.should.have.property('page', options.page);
          body.should.have.property('initiatives');

          /* Check data */
          var data = body.initiatives;
          data.should.have.lengthOf(options.perPage);
          mongoose.model('Initiative')
              .find({})
              .sort('name')
              .limit(options.perPage)
              .skip(options.perPage*(options.page-1))
              .populate('creator', '_id name')
              .lean()
          .exec(function(err, initiatives){
            if (err) return doneIt(err);

            for (var i = 0; i < options.perPage; i++) {
              var initiative = initiatives[i];
              data[i].should.have.property('_id', initiative._id.toHexString());
              data[i].should.have.property('name', initiative.name);
              data[i].should.have.property('description', initiative.description);

              data[i].should.have.property('createdAt');
              var createdAt = moment(data[i].createdAt).format();
              createdAt.should.equal(moment(initiative.createdAt).format());

              data[i].should.have.property('areas');
              data[i].areas.should.be.instanceOf(Array);

              var creator = initiative.creator;
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
          .get(apiPrefix + '/initiatives')
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
          res.body.messages[0].should.have.property('text', 'errors.initiatives.list.invalid_pagination');
          doneIt();
        };
      });
    });
  });


  /*
    PUT /api/v1/initiatives/:id
  */

  describe('PUT /api/v1/initiatives/:id', function(){
    context('not logged in', function(){
      it('should return 401 (Unauthorized)', function(doneIt){
        Initiative.findOne(function(err, initiative){
          should.not.exist(err);
          should.exist(initiative);
          request(app)
            .put(apiPrefix + '/initiatives/'+user1Initiative1._id)
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
        var initiativeChanges = {
          name: 'initiative new name',
          description: 'changed description',
          facebook: 'a link to facebook',
          areas: [user1Area1._id]
        }

        request(app)
          .put(apiPrefix + '/initiatives/'+ user1Initiative1._id)
          .set('Authorization', user1AccessToken)
          .send(initiativeChanges)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;

            body.should.have.property('name', initiativeChanges.name);
            body.should.have.property('description', initiativeChanges.description);
            body.should.have.property('facebook', initiativeChanges.facebook);
            body.should.have.property('creator');
            body.creator.should.have.property('_id', user1._id.toHexString());
            body.creator.should.have.property('name', user1.name);
            body.should.have.property('areas');
            body.areas.should.containDeepOrdered([user1Area1._id]);

            /* Keep area for later usage */
            user1Initiative1 = res.body;

            doneIt();
          });
      });

      it('return 400 (Bad request) for invalid parameters');
      it('return 404 (Not found) for id not found');
    });

    context('when editor is not the creator', function(){
      it('return 200 (Success) for admins', function(doneIt){
        var initiativeChanges = {
          name: 'new name by admin',
          description: 'a changed description by admin',
          facebook: 'another link to facebook',
          areas: [user1Area1._id, user1Area2._id]
        }

        request(app)
          .put(apiPrefix + '/initiatives/'+ user1Initiative1._id)
          .set('Authorization', admin1AccessToken)
          .send(initiativeChanges)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;

            body.should.have.property('name', initiativeChanges.name);
            body.should.have.property('description', initiativeChanges.description);
            body.should.have.property('facebook', initiativeChanges.facebook);
            body.should.have.property('creator');
            body.creator.should.have.property('_id', user1._id.toHexString());
            body.creator.should.have.property('name', user1.name);
            body.should.have.property('areas');
            body.areas.should.containDeepOrdered(initiativeChanges.areas);

            /* Keep area for later usage */
            user1Initiative1 = res.body;

            doneIt();
          });
      });

      it('return 401 (Unauthorized) for other users', function(doneIt){
        var initiativeChanges = {
          name: 'another new name',
        }


        request(app)
          .put(apiPrefix + '/initiatives/'+user1Initiative1._id)
          .set('Authorization', user2AccessToken)
          .send(initiativeChanges)
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
    PUT /api/v1/initiatives/:id/addArea/:area_id
  */
  describe('PUT /api/v1/initiatives/:id/addArea/', function(){
    context('not logged in', function(){
      it('should return 401 (Unauthorized)', function(doneIt){
        Initiative.findOne(function(err, initiative){
          should.not.exist(err);
          should.exist(initiative);
          request(app)
            .put(apiPrefix + '/initiatives/'+user1Initiative1._id+'/addArea/'+user1Area1._id)
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
        request(app)
          .put(apiPrefix + '/initiatives/'+ user1Initiative1._id+'/addArea/'+user2Area1._id)
          .set('Authorization', user1AccessToken)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;
            body.should.have.property('areas');
            body.areas.should.have.length(3);
            doneIt();
          });
      });

      it('return 400 (Bad request) for invalid parameters');
      it('return 404 (Not found) for id not found');
    });

    context('when editor is not the creator', function(){
      it('return 200 (Success) for admins', function(doneIt){
        request(app)
          .put(apiPrefix + '/initiatives/'+ user1Initiative1._id+'/addArea/'+user2Area2._id)
          .set('Authorization', admin1AccessToken)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;
            body.should.have.property('areas');
            body.areas.should.have.length(4);
            doneIt();
          });
      });

      it('return 401 (Unauthorized) for other users', function(doneIt){
        request(app)
          .put(apiPrefix + '/initiatives/'+user1Initiative1._id+'/addArea/'+user1Area1._id)
          .set('Authorization', user2AccessToken)
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
    PUT /api/v1/initiatives/:id/removeArea/:area_id
  */
  describe('PUT /api/v1/initiatives/:id/removeArea/', function(){
    context('not logged in', function(){
      it('should return 401 (Unauthorized)', function(doneIt){
        Initiative.findOne(function(err, initiative){
          should.not.exist(err);
          should.exist(initiative);
          request(app)
            .put(apiPrefix + '/initiatives/'+user1Initiative1._id+'/removeArea/'+user1Area1._id)
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
        request(app)
          .put(apiPrefix + '/initiatives/'+ user1Initiative1._id+'/removeArea/'+user2Area1._id)
          .set('Authorization', user1AccessToken)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;
            body.should.have.property('areas');
            body.areas.should.have.length(3);
            doneIt();
          });
      });

      it('return 400 (Bad request) for invalid parameters');
      it('return 404 (Not found) for id not found');
    });

    context('when editor is not the creator', function(){
      it('return 200 (Success) for admins', function(doneIt){
        request(app)
          .put(apiPrefix + '/initiatives/'+ user1Initiative1._id+'/removeArea/'+user2Area2._id)
          .set('Authorization', admin1AccessToken)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;
            body.should.have.property('areas');
            body.areas.should.have.length(2);
            doneIt();
          });
      });

      it('return 401 (Unauthorized) for other users', function(doneIt){
        request(app)
          .put(apiPrefix + '/initiatives/'+user1Initiative1._id+'/removeArea/'+user1Area1._id)
          .set('Authorization', user2AccessToken)
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

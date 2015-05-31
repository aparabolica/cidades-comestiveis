/* Module dependencies */

var request = require('supertest');
var async = require('async');
var should = require('should');
var moment = require('moment');
var mongoose = require('mongoose');

/* The app */

var app = require('../../app');

/* Models */

var Area = mongoose.model('Area');

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
var user2;
var user2AccessToken;

/* Pagination */
var areaCount = 85;
var defaultPerPage = 30;
var defaultPage = 1;


/* The tests */

describe('API: Areas', function(){

  before(function (doneBefore) {

    /*
     * Init database
     */

    expressHelper.whenReady(function(){
      clearDb.all(function(err){
        should.not.exist(err);
        async.series([createUsers, createAreas], doneBefore)
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
      async.parallel([function(doneCreateAreas1){
        factory.createAreas(39, user1._id, doneCreateAreas1);
      }, function(doneCreateAreas2){
        factory.createAreas(45, user2._id, doneCreateAreas2);
      }], doneCreateAreas);
    }
  });



  /*
    POST /api/version/areas
  */

  describe('POST /api/version/areas', function(){
    context('not logged in', function(){
      it('should return 401 (Unauthorized)', function(doneIt){
        request(app)
          .post(apiPrefix + '/areas')
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
      it('return 201 (Created) for valid area data', function(doneIt){
        var area = {
          address: 'Rua Ipsum Lorem, 101, São Paulo, SP, CEP 04304-202',
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur ultricies felis at.',
          geometry: {
            type: 'Point',
            coordinates: [-46.63318, -23.55046]
          }
        }

        request(app)
          .post(apiPrefix + '/areas')
          .set('Authorization', user1AccessToken)
          .send(area)
          .expect(201)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;

            /* User basic info */
            body.should.have.property('address', area.address);
            body.should.have.property('creator', user1._id);

            /* Location geojson */
            var geometryGeojson = body.geometry;
            geometryGeojson.should.have.property('type', area.geometry.type);
            geometryGeojson.should.have.property('coordinates');
            geometryGeojson.coordinates.should.be.an.Array;

            /* Coordinates */
            var coordinates = geometryGeojson.coordinates
            coordinates[0].should.be.equal(area.geometry.coordinates[0]);
            coordinates[1].should.be.equal(area.geometry.coordinates[1]);

            /* Keep area for later usage */
            user1Area1 = res.body;

            doneIt();
          })
      });

      it('return 400 (Bad request) for invalid area data', function(doneIt){
        var area = {
          address: '',
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur ultricies felis at.'
        }

        request(app)
          .post(apiPrefix + '/areas')
          .set('Authorization', user1AccessToken)
          .send(area)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;

            res.body.messages.should.have.lengthOf(1);
  					messaging.hasValidMessages(res.body).should.be.true;
  					res.body.messages[0].should.have.property('text', 'mongoose.errors.areas.missing_address');

            doneIt();
          });
      });
    });
  });

  /*
    GET /api/version/areas/:id
  */

  describe('GET /api/version/areas/:id', function(){
    it('return status 200 and object json for valid id', function(doneIt){
      request(app)
        .get(apiPrefix + '/areas/' + user1Area1._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          should.not.exist(err);
          var body = res.body;

          /* User basic info */
          body.should.have.property('address', user1Area1.address);
          body.should.have.property('creator');
          body['creator'].should.have.property('_id', user1._id);
          body['creator'].should.have.property('name', user1.name);

          /* Location geojson */
          var geometryGeojson = body.geometry;
          geometryGeojson.should.have.property('type', user1Area1.geometry.type);
          geometryGeojson.should.have.property('coordinates');
          geometryGeojson.coordinates.should.be.an.Array;

          /* Coordinates */
          var coordinates = geometryGeojson.coordinates
          coordinates[0].should.be.equal(user1Area1.geometry.coordinates[0]);
          coordinates[1].should.be.equal(user1Area1.geometry.coordinates[1]);

          /* Keep area for later usage */
          user1Area1 = res.body;

          doneIt();
        });
    });

    it('return 404 for id not found', function(doneIt){
      request(app)
        .get(apiPrefix + '/areas/999999/')
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          should.not.exist(err);
          var body = res.body;

          res.body.messages.should.have.lengthOf(1);
          messaging.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property('text', 'errors.areas.not_found');

          doneIt();
        });
    });
  });

  /*
    GET /api/version/areas
  */

  describe('GET /api/version/areas', function(){
    context('valid parameters', function(){
      it('return 200 and first page when no parameters are passed', function(doneIt){

        /* The request */
        request(app)
          .get(apiPrefix + '/areas')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          /* Check pagination */
          var body = res.body;
          body.should.have.property('count', areaCount);
          body.should.have.property('perPage', defaultPerPage);
          body.should.have.property('page', defaultPage);
          body.should.have.property('areas');

          /* Check data */
          var data = body.areas;
          data.should.have.lengthOf(defaultPerPage);
          mongoose.model('Area').find({}).sort('address').limit(defaultPerPage).populate('creator', '_id name').lean().exec(function(err, areas){
            if (err) return doneIt(err);
            for (var i = 0; i < defaultPerPage; i++) {

              var area = areas[i];
              data[i].should.have.property('_id', area._id);
              data[i].should.have.property('address', area.address);
              data[i].should.have.property('description', area.description);
              data[i].should.have.property('createdAt');

              var createdAt = moment(data[i].createdAt).format();
              createdAt.should.equal(moment(area.createdAt).format());

              var creator = area.creator;
              data[i].should.have.property('creator');
              data[i]['creator'].should.have.property('name', creator.name);
              data[i]['creator'].should.have.property('_id', creator._id);

              var geometry = area.geometry;
              data[i].should.have.property('geometry');
              data[i]['geometry'].should.have.property('type', geometry.type);

              var coordinates = geometry.coordinates;
              data[i]['geometry'].should.have.property('coordinates');
              data[i]['geometry']['coordinates'].should.containDeepOrdered(coordinates);
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
          .get(apiPrefix + '/areas')
          .query(options)
          // .expect('Content-Type', /json/)
          .expect(200)
          .end(onResponse);

        /* Verify response */
        function onResponse(err, res) {
          if (err) return doneIt(err);

          /* Check pagination */
          var body = res.body;
          body.should.have.property('count', areaCount);
          body.should.have.property('perPage', options.perPage);
          body.should.have.property('page', options.page);
          body.should.have.property('areas');

          /* Check data */
          var data = body.areas;
          data.should.have.lengthOf(options.perPage);
          mongoose.model('Area').find({}).sort('address')
              .limit(options.perPage).skip(options.perPage*(options.page-1))
              .populate('creator', '_id name')
              .lean().exec(function(err, areas){
            if (err) return doneIt(err);
            for (var i = 0; i < options.perPage; i++) {

              var area = areas[i];
              data[i].should.have.property('_id', area._id);
              data[i].should.have.property('address', area.address);
              data[i].should.have.property('description', area.description);
              data[i].should.have.property('createdAt');

              var createdAt = moment(data[i].createdAt).format();
              createdAt.should.equal(moment(area.createdAt).format());

              var creator = area.creator;
              data[i].should.have.property('creator');
              data[i]['creator'].should.have.property('name', creator.name);
              data[i]['creator'].should.have.property('_id', creator._id);

              var geometry = area.geometry;
              data[i].should.have.property('geometry');
              data[i]['geometry'].should.have.property('type', geometry.type);

              var coordinates = geometry.coordinates;
              data[i]['geometry'].should.have.property('coordinates');
              data[i]['geometry']['coordinates'].should.containDeepOrdered(coordinates);
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
          .get(apiPrefix + '/areas')
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
          res.body.messages[0].should.have.property('text', 'errors.areas.list.invalid_pagination');
          doneIt();
        };
      });
    });
  });


  /*
    PUT /api/version/areas/:id
  */

  describe('PUT /api/version/areas/:id', function(){
    context('not logged in', function(){
      it('should return 401 (Unauthorized)', function(doneIt){
        Area.findOne(function(err, area){
          should.not.exist(err);
          should.exist(area);
          request(app)
            .put(apiPrefix + '/areas/'+area.id)
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
      it('return 200 (Success) for valid area data', function(doneIt){
        var areaChanges = {
          address: 'changed address',
          description: 'changed description',
          geometry: {
            type: 'Point',
            coordinates: [-46.222222, -23.11111]
          }
        }

        request(app)
          .put(apiPrefix + '/areas/'+ user1Area1._id)
          .set('Authorization', user1AccessToken)
          .send(areaChanges)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;

            /* User basic info */
            body.should.have.property('address', areaChanges.address);
            body.should.have.property('creator', user1._id);

            /* Location geojson */
            var geometryGeojson = body.geometry;
            geometryGeojson.should.have.property('type', areaChanges.geometry.type);
            geometryGeojson.should.have.property('coordinates');
            geometryGeojson.coordinates.should.be.an.Array;

            /* Coordinates */
            var coordinates = geometryGeojson.coordinates
            coordinates[0].should.be.equal(areaChanges.geometry.coordinates[0]);
            coordinates[1].should.be.equal(areaChanges.geometry.coordinates[1]);

            /* Keep area for later usage */
            user1Area1 = res.body;

            doneIt();
          });
      });

      it('return 400 (Bad request) for invalid area data');
      it('return 404 (Not found) for id not found');
    });

    context('when editor is not the creator', function(){
      it('return 200 (Success) for admins', function(doneIt){
        var areaChanges = {
          address: 'changed address by admin',
          description: 'changed description by admin',
          geometry: {
            type: 'Point',
            coordinates: [-46.222222, -23.11111]
          }
        }

        request(app)
          .put(apiPrefix + '/areas/'+ user1Area1._id)
          .set('Authorization', admin1AccessToken)
          .send(areaChanges)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res){
            should.not.exist(err);
            var body = res.body;

            /* User basic info */
            body.should.have.property('address', areaChanges.address);
            body.should.have.property('creator', user1._id);

            /* Location geojson */
            var geometryGeojson = body.geometry;
            geometryGeojson.should.have.property('type', areaChanges.geometry.type);
            geometryGeojson.should.have.property('coordinates');
            geometryGeojson.coordinates.should.be.an.Array;

            /* Coordinates */
            var coordinates = geometryGeojson.coordinates
            coordinates[0].should.be.equal(areaChanges.geometry.coordinates[0]);
            coordinates[1].should.be.equal(areaChanges.geometry.coordinates[1]);

            /* Keep area for later usage */
            user1Area1 = res.body;

            doneIt();
          });
      });

      it('return 401 (Unauthorized) for other users', function(doneIt){
        var areaChanges = {
          address: 'changed address by user2',
          description: 'changed description by user2',
          geometry: {
            type: 'Point',
            coordinates: [-46.222222, -23.11111]
          }
        }

        request(app)
          .put(apiPrefix + '/areas/'+user1Area1._id)
          .set('Authorization', user2AccessToken)
          .send(areaChanges)
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

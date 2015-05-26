/* Module dependencies */

var request = require('supertest');
var async = require('async');
var should = require('should');

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


/* Local instances */
var user1;
var user1AccessToken;


/* The tests */

describe('API: Areas', function(){

  before(function (doneBefore) {

    /*
     * Init database
     */

    expressHelper.whenReady(function(){
      clearDb.all(function(err){
        should.not.exist(err);
        async.series([createUsers], doneBefore)
      });
    });

    /*
     * Create user1
     */
    function createUsers(doneCreateUsers) {
      async.series([function(done){
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

            doneIt();
          })
      });

      it('return 400 (Bad request) for invalid area data');
    });
  });

  /*
    GET /api/version/areas/:id
  */

  describe('GET /api/version/areas/:id', function(){
    it('return status 200 and object json for valid id');
    it('return 404 for id not found');
  });

  /*
    GET /api/version/areas
  */

  describe('GET /api/version/areas', function(){
    it('return status 200 (OK) and object json for valid id');
    it('return 400 (Bad request)');
  });


  /*
    PUT /api/version/areas/:id
  */

  describe('PUT /api/version/areas/:id', function(){
    context('not logged in', function(){
      it('should return 401 (Unauthorized)');
    });

    context('when logged as user', function(){
      it('return 201 (Created) for valid area data');
      it('return 400 (Bad request) for invalid area data');
    });
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

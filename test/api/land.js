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

/* Config */

var apiPrefix = 'api/v1';
var config = require('../../config/config')['test'];

/* The tests */

describe('API: Lands', function(){

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
     * Create user1, user2 and admin
     */
    function createUsers(doneCreateUsers) {
      async.series([function(done){
          factories.createUser(function(err,usr){
            should.not.exist(err);
            user1 = usr;
            expressHelper.login(user1.email, user1.password, function(token){
              user1AccessToken = token;
              done();
            });
          });
        }, function(done){
          factories.createUser(function(err,usr){
            should.not.exist(err);
            user2 = usr;
            done()
          });
        }, function(done){
          factories.createUser(function(err,usr){
            should.not.exist(err);
            admin = usr;
            admin.role = 'admin';
            done()
          });
      }], doneCreateUsers);
    }
  });



  /*
    POST /api/version/lands
  */

  describe('POST /api/version/lands', function(){
    context('not logged in', function(){
      it('should return 401 (Unauthorized)', function(doneIt){
        request(app)
          .post(apiPrefix + '/lands')
          .expect(401)
          .end(function(err,res){
            should.not.exist(err);
            res.body.messages.should.have.lengthOf(1);
            messages.hasValidMessages(res.body).should.be.true;
            res.body.messages[0].should.have.property('text', i18n.t('access_token.unauthorized'));
            doneIt();
          });
      });
    });

    context('when logged in', function(){
      it('return 201 (Created) for valid land data');
      it('return 400 (Bad request) for invalid land data');
    });
  });

  /*
    GET /api/version/lands/:id
  */

  describe('GET /api/version/lands/:id', function(){
    it('return status 200 and object json for valid id');
    it('return 404 for id not found');
  });

  /*
    GET /api/version/lands
  */

  describe('GET /api/version/lands', function(){
    it('return status 200 (OK) and object json for valid id');
    it('return 400 (Bad request)');
  });


  /*
    PUT /api/version/lands/:id
  */

  describe('PUT /api/version/lands/:id', function(){
    context('not logged in', function(){
      it('should return 401 (Unauthorized)');
    });

    context('when logged as user', function(){
      it('return 201 (Created) for valid land data');
      it('return 400 (Bad request) for invalid land data');
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

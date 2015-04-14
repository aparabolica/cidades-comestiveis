var request = require('supertest');
var should = require('should');
var app = require('../../app');

/*
  Config
 */

var apiPrefix = 'api/v1';

/*
 * Create user1, user2 and admin
 */
// function createUsers(doneCreateUsers) {
//   async.series([function(done){
//       factory.createUser(function(err,usr){
//         should.not.exist(err);
//         user1 = usr;
//         helper.login(user1.email, user1.password, function(token){
//           user1AccessToken = token;
//           done();
//         });
//       });
//     }, function(done){
//       factory.createUser(function(err,usr){
//         should.not.exist(err);
//         user2 = usr;
//         done()
//       });
//     }, function(done){
//       factory.createUser(function(err,usr){
//         should.not.exist(err);
//         admin = usr;
//         admin.role = 'admin';
//         done()
//       });
//   }], doneCreateUsers);
// }

describe('API: Lands', function(){

  /*
    POST /api/v1/lands
  */

  describe('POST /api/v1/lands', function(){
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
    GET /api/v1/lands/:id
  */

  describe('GET /api/v1/lands/:id', function(){
    it('return status 200 and object json for valid id');
    it('return 404 for id not found');
  });

  /*
    GET /api/v1/lands
  */

  describe('GET /api/v1/lands', function(){
    it('return status 200 (OK) and object json for valid id');
    it('return 400 (Bad request)');
  });


  /*
    PUT /api/v1/lands/:id
  */

  describe('PUT /api/v1/lands/:id', function(){
    context('not logged in', function(){
      it('should return 401 (Unauthorized)');
    });

    context('when logged as user', function(){
      it('return 201 (Created) for valid land data');
      it('return 400 (Bad request) for invalid land data');
    });
  });

})

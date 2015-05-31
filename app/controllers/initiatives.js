var mongoose = require('mongoose');
var Initiative = mongoose.model('Initiative');
var User = mongoose.model('User');
var Initiative = mongoose.model('Initiative');
var messaging = require('../../lib/messaging');
var validator = require('validator');
var _ = require('underscore');

exports.load = function(req,res,next,id){
  Initiative.findById(id, function(err, initiative){
    if (err)
      return res.status(400).json(messaging.mongooseErrors(err, 'initiatives'));
    else if (!initiative)
      return res.status(404).json(messaging.error('errors.initiatives.not_found'));
    else {
      req.object = initiative;
      next();
    }
  });
}

/* Create new initiative. */
exports.create = function(req, res, next) {
  var initiative = new Initiative(req.body);

  initiative.creator = req.user._id;

  initiative.save(function(err) {
    if (err) res.status(400).json(messaging.mongooseErrors(err, 'initiatives'));
    else res.status(201).json(initiative);
  });
}

/* Update initiative. */
exports.update = function(req, res, next) {
  var initiative = _.extend(req.object, req.body);

  initiative.save(function(err) {
    if(err)
      res.status(400).json(messaging.mongooseErrors(err, 'initiatives'));
    else {
      initiative.populate('creator', '_id name', function(err){
        res.status(200).json(initiative);
      })
    }
  });
}

/* Show initiative. */
exports.show = function(req, res, next) {
  var initiative = req.object;

  User.populate(initiative, {path:'creator', select: '_id name'},function(err, result){
    if(err)
      res.status(400).json(messaging.mongooseErrors(err, 'initiatives'));
    else
      res.status(200).json(result);
  });
}

/* List initiatives */
exports.list = function(req, res, next) {
  var page = req.query['page'];
  var perPage = req.query['perPage'];

  /* Validate query parameters */
  if (page) {
    if (!validator.isInt(page))
      return res.status(400).json(messaging.error('errors.initiatives.list.invalid_pagination'));
    else
      page = parseInt(page) - 1;
  } else page = 0;

  if (perPage){
    if (!validator.isInt(perPage))
      return res.status(400).json(messaging.error('errors.initiatives.list.invalid_pagination'));
    else
      perPage = parseInt(perPage);
  } else perPage = 30;

  /* Mongoose Options */
  var options = {
    perPage: perPage,
    page: page
  };

  Initiative.list(options, function (err, initiatives) {
    if (err)
      return res.status(500).json(messaging.error('errors.internal_error'));

    /* Send response */
    Initiative.count().exec(function (err, count) {
      res.status(200).json({
        count: count,
        perPage: perPage,
        page: page + 1,
        initiatives: initiatives
      });
    });
  });
}

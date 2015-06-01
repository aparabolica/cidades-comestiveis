var mongoose = require('mongoose');
var ResourceType = mongoose.model('ResourceType');
var User = mongoose.model('User');
var messaging = require('../../lib/messaging');
var validator = require('validator');
var _ = require('underscore');

exports.load = function(req,res,next,id){
  ResourceType.findById(id, function(err, rt){
    if (err)
      return res.status(400).json(messaging.mongooseErrors(err, 'resource_type'));
    else if (!rt)
      return res.status(404).json(messaging.error('errors.resource_types.not_found'));
    else {
      req.object = rt;
      next();
    }
  });
}

/* Create new */
exports.create = function(req, res, next) {
  var rt = new ResourceType(req.body);

  rt.creator = req.user._id;

  rt.save(function(err) {
    if (err) res.status(400).json(messaging.mongooseErrors(err, 'resource_types'));
    else res.status(201).json(rt);
  });
}

/* Update */
exports.update = function(req, res, next) {
  var rs = _.extend(req.object, req.body);

  rs.save(function(err) {
    if(err)
      res.status(400).json(messaging.mongooseErrors(err, 'resource_types'));
    else
      res.status(200).json(rs);
  });
}

/* Show  */
exports.show = function(req, res, next) {
  res.status(200).json(req.object);
}

/* List */
exports.list = function(req, res, next) {
  var page = req.query['page'];
  var perPage = req.query['perPage'];

  /* Validate query parameters */
  if (page) {
    if (!validator.isInt(page))
      return res.status(400).json(messaging.error('errors.resource_types.list.invalid_pagination'));
    else
      page = parseInt(page) - 1;
  } else page = 0;

  if (perPage){
    if (!validator.isInt(perPage))
      return res.status(400).json(messaging.error('errors.resource_types.list.invalid_pagination'));
    else
      perPage = parseInt(perPage);
  } else perPage = 30;

  /* Mongoose Options */
  var options = {
    perPage: perPage,
    page: page
  };

  ResourceType.list(options, function (err, rts) {
    if (err)
      return res.status(500).json(messaging.error('errors.internal_error'));

    /* Send response */
    ResourceType.count().exec(function (err, count) {
      res.status(200).json({
        count: count,
        perPage: perPage,
        page: page + 1,
        resourceTypes: rts
      });
    });
  });
}

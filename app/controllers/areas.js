var mongoose = require('mongoose');
var Area = mongoose.model('Area');
var messaging = require('../../lib/messaging');
var validator = require('validator');
var _ = require('underscore');

/* Create new area. */
exports.create = function(req, res, next) {
  var area = new Area(req.body);

  area.creator = req.user._id;

  area.save(function(err) {
    if (err) res.status(400).json(messaging.mongooseErrors(err, 'areas'));
    else res.status(201).json(area);
  });
}

/* Update area. */
exports.update = function(req, res, next) {
  var area_id = parseInt(req.params.id);


  Area.findById(area_id).exec(function(err, area) {
    if (err) res.status(400).json(messaging.mongooseErrors(err, 'areas'));
    else if(req.user._id != area.creator) res.status(400).json(messaging.error('errors.areas.not_allowed'));
    else if (!area) res.status(404).json(messaging.error('errors.areas.not_found'));
    else {
      area = _.extend(area, req.body);
      area.save(function(err) {
        if(err) {
          return res.status(400).json(messaging.mongooseErrors(err, 'areas'));
        } else {
          return res.status(200).json(area);
        }
      })
    }
  });
}

/* Show area. */
exports.show = function(req, res, next) {

  var area_id = parseInt(req.params.id);

  Area.findById(area_id).populate('creator', '_id name').exec(function(err, area) {
    if (err) res.status(400).json(messaging.mongooseErrors(err, 'areas'));
    else if (!area) res.status(404).json(messaging.error('errors.areas.not_found'));
    else res.status(200).json(area);
  });

}

/* List areas */
exports.list = function(req, res, next) {
  var page = req.query['page'];
  var perPage = req.query['perPage'];

  /* Validate query parameters */
  if (page) {
    if (!validator.isInt(page))
      return res.status(400).json(messaging.error('errors.areas.list.invalid_pagination'));
    else
      page = parseInt(page) - 1;
  } else page = 0;

  if (perPage){
    if (!validator.isInt(perPage))
      return res.status(400).json(messaging.error('errors.areas.list.invalid_pagination'));
    else
      perPage = parseInt(perPage);
  } else perPage = 30;

  /* Mongoose Options */
  var options = {
    perPage: perPage,
    page: page
  };

  Area.list(options, function (err, areas) {
    if (err)
      return res.status(500).json(messaging.error('errors.internal_error'));

    /* Send response */
    Area.count().exec(function (err, count) {
      res.status(200).json({
        count: count,
        perPage: perPage,
        page: page + 1,
        areas: areas
      });
    });
  });
}

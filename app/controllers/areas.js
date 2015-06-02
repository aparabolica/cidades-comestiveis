var _ = require('underscore');
var validator = require('validator');
var messaging = require('../../lib/messaging');
var formidable = require('formidable');
var mongoose = require('mongoose');
var Area = mongoose.model('Area');
var User = mongoose.model('User');

var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

exports.load = function(req,res,next,id){
  Area.findById(id, function(err, area){
    if (err)
      return res.status(400).json(messaging.mongooseErrors(err, 'areas'));
    else if (!area)
      return res.status(404).json(messaging.error('errors.areas.not_found'));
    else {
      req.object = area;
      next();
    }
  });
}

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
  var area = _.extend(req.object, req.body);

  area.save(function(err) {
    if(err)
      res.status(400).json(messaging.mongooseErrors(err, 'areas'));
    else
      res.status(200).json(area);
  });
}

/* Upload image */
exports.updateImage = function(req, res, next) {
  var area = req.object;

  // parse a file upload
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    cloudinary.uploader.upload(files.image.path, function(result) {
      if (result.error)
        return res.status(400).json(messaging.error('errors.areas.image.upload_error'));
      else {
        area.image = result;
        area.save(function(err) {
          if(err)
            res.status(400).json(messaging.mongooseErrors(err, 'areas'));
          else
            res.status(200).json(area);
        });
      }
    });
  });
}

/* Show area. */
exports.show = function(req, res, next) {
  var area = req.object;

  User.populate(area, {path:'creator', select: '_id name'},function(err, result){
    if(err)
      res.status(400).json(messaging.mongooseErrors(err, 'areas'));
    else
      res.status(200).json(result);
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

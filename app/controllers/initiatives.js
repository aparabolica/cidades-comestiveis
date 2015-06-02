var mongoose = require('mongoose');
var Initiative = mongoose.model('Initiative');
var User = mongoose.model('User');
var Initiative = mongoose.model('Initiative');
var Area = mongoose.model('Area');
var messaging = require('../../lib/messaging');
var validator = require('validator');
var _ = require('underscore');

var formidable = require('formidable');
var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});


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

/* Upload image */
exports.updateImage = function(req, res, next) {
  var initiative = req.object;

  // parse a file upload
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    cloudinary.uploader.upload(files.image.path, function(result) {
      if (result.error)
        return res.status(400).json(messaging.error('errors.initiatives.image.upload_error'));
      else {
        initiative.image = result;
        initiative.save(function(err) {
          if(err)
            res.status(400).json(messaging.mongooseErrors(err, 'areas'));
          else
            res.status(200).json(area);
        });
      }
    });
  });
}

exports.addArea = function(req, res, next) {
  var initiative = req.object;

  // Find area
  Area.findById(req.params['area_id'], function(err, area){
    if (err) return res.status(400).json(messaging.mongooseErrors(err, 'areas'));

    if (!area) return res.status(404).json(messaging.error('errors.areas.not_found'));

    // Set areas
    initiative.areas.addToSet(area);

    // Save
    initiative.save(function(err) {
      if(err)
        res.status(400).json(messaging.mongooseErrors(err, 'initiatives'));
      else {
        initiative
          .populate('creator', '_id name').populate('areas', function(err){
            res.status(200).json(initiative);
          })
      }
    });
  });
}

exports.removeArea = function(req, res, next) {
  var initiative = req.object;
  var area_id = mongoose.Types.ObjectId(req.params['area_id']);

  // Set areas
  initiative.areas.pull(area_id);

  Initiative.update({_id: initiative._id}, { $pull: { areas: area_id } }, function(err) {
    if(err)
      res.status(400).json(messaging.mongooseErrors(err, 'initiatives'));
    else {
      initiative
        .populate('creator', '_id name').populate('areas', function(err){
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

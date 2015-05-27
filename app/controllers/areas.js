var mongoose = require('mongoose');
var Area = mongoose.model('Area');
var messaging = require('../../lib/messaging');

/* Create new area. */
exports.create = function(req, res, next) {
  var area = new Area(req.body);

  area.creator = req.user._id;

  area.save(function(err) {
    if (err) res.status(400).json(messaging.mongooseErrors(err, 'areas'));
    else res.status(201).json(area);
  });
};

/* Show area. */
exports.show = function(req, res, next) {

  var area_id = parseInt(req.params.id);

  Area.findById(area_id).populate('creator', '_id name').exec(function(err, area) {
    if (err) res.status(400).json(messaging.mongooseErrors(err, 'areas'));
    else if (!area) res.status(404).json(messaging.error('errors.areas.not_found'));
    else res.status(200).json(area);
  });

};

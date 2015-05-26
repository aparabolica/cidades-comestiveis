var mongoose = require('mongoose');
var Area = mongoose.model('Area');
var messaging = require('../../lib/messaging')

/* Create new area. */
exports.create = function(req, res, next) {

	var area = new Area(req.body);

	area.creator = req.user._id;

	area.save(function(err){
    // console.log(err)
		if (err) res.status(400).json(messaging.mongooseErrors(err, 'areas'));
		else res.status(201).json(area);
	});
};

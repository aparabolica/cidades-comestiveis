var validator = require('validator');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose.connection);

/**
 * Schema
 */

var AreaSchema = new Schema({
	_id: Number,
	creator: { type: Number, ref: 'User', required: 'missing_creator'},
	address: { type: String, required: 'missing_address'},
	description: { type: String },
	geometry: { type: {type: String}, coordinates: []},
	createdAt: {type: Date, default: Date.now},
	updatedAt: {type: Date}
})

/* Geo index */
AreaSchema.index({ geometry: '2dsphere' })

/** Auto-increment */
AreaSchema.plugin(autoIncrement.plugin, 'Area');

/** Pre/Post middleware */

AreaSchema.pre('save', function(next){
	if (!this.isNew)
		this.updatedAt = new Date();
	next();
});

/** Statics */

AreaSchema.static({

	list: function (options, cb) {
    var criteria = options.criteria || {}

    this.find(criteria)
      .sort('address') // sort by date
			.populate('creator', '_id name')
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }

})

/* Register model */
mongoose.model('Area', AreaSchema)

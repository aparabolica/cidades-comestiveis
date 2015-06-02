var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Schema
 */

var AreaSchema = new Schema({
	creator: { type: Schema.ObjectId, ref: 'User', required: 'missing_creator'},
	address: { type: String, required: 'missing_address'},
	description: { type: String },
	image: {},
	geometry: { type: {type: String}, coordinates: []},
	createdAt: {type: Date, default: Date.now},
	updatedAt: {type: Date},
	hasGarden: {type: Boolean, default: false},
	access: {type: String, enum: ['public', 'permissive', 'restricted'], default: 'public'}
});

/* Geo index */
AreaSchema.index({ geometry: '2dsphere' })

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

});

/* Register model */
mongoose.model('Area', AreaSchema)

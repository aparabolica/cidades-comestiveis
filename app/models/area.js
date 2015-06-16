/**
 * Module dependencies
 */

var async = require('async');
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

AreaSchema.set('toObject', { getters: true, virtuals: true });
AreaSchema.set('toJSON', { getters: true, virtuals: true });

/**
 * Geo Index
 */
AreaSchema.index({ geometry: '2dsphere' })

/**
 * Pre middleware
 */
AreaSchema.pre('save', function(next){
	if (!this.isNew)
		this.updatedAt = new Date();
	next();
});

/**
 * Virtuals
 */
var initiatives = [];
AreaSchema.virtual('initiatives').get(function(){
	return initiatives;
});
AreaSchema.virtual('initiatives').set(function(newInitiatives){
	initiatives = newInitiatives;
});

/** Statics */

AreaSchema.static({

	list: function (options, doneList) {
    var criteria = options.criteria || {}

    this.find(criteria)
      .sort('address') // sort by date
			.populate('creator', '_id name')
      .limit(options.perPage)
      .skip(options.perPage * options.page)
			.lean()
      .exec(function(err,areas){
				if (err) return doneList(err);

				// populate initiatives
				async.map(areas, function(a, doneEach){
					if (err) return doneMap(err);
					mongoose.model('Initiative').find({
		        areas: a._id
		      }, function(err, initiatives){
						if (err) return doneEach(err);
						if (initiatives) a.initiatives = initiatives;
						doneEach(null, a);
		      })
				},function(err, areas){
					doneList(err, areas);
				});
			});
  }

});

/* Register model */
mongoose.model('Area', AreaSchema)

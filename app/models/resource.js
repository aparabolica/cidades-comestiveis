
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** Schema */

var ResourceSchema = new Schema({
  creator: { type: Schema.ObjectId, ref: 'User', required: 'missing_creator'},
  availableAt: Date,
  availableUntil: Date,
  type: { type: Schema.ObjectId, ref: 'ResourceType', required: 'missing_resource_type'},
  description: {type: String },
  geometry: { type: {type: String}, coordinates: []},
});

/** Statics */

ResourceSchema.static({

	list: function (options, cb) {
    var criteria = options.criteria || {}

    console.log(options);

    this.find(criteria)
      .sort('availableUntil')
      .populate('creator', '_id name')
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
});


mongoose.model('Resource', ResourceSchema)

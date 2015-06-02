
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** Schema */

var ResourceSchema = new Schema({
  creator: { type: Schema.ObjectId, ref: 'User', required: 'missing_creator'},
  image: {},
  availableAt: Date,
  availableUntil: Date,
  category: {type: String, enum: ['Supply', 'Tool', 'Knowledge', 'Work'], required: 'missing_category'},
  name: { type: String },
  description: {type: String },
  geometry: { type: {type: String}, coordinates: []},
  createdAt: {type: Date, default: Date.now},
});

/** Statics */

ResourceSchema.static({

	list: function (options, cb) {
    var criteria = options.criteria || {}

    this.find(criteria)
      .sort('availableUntil')
      .populate('creator', '_id name')
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
});


mongoose.model('Resource', ResourceSchema)

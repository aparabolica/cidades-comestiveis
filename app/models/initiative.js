
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var InitiativeSchema = new Schema({
  name: {type: String, required: 'missing_name'},
	description: { type: String },
  image: {},
  creator: { type: Schema.ObjectId, ref: 'User', required: 'missing_creator'},
  areas: [{ type: Schema.ObjectId, ref: 'Area'}],
  website: String,
  facebook: String,
	createdAt: {type: Date, default: Date.now},
	updatedAt: {type: Date}
})

/** Statics */

InitiativeSchema.static({

	list: function (options, cb) {
    var criteria = options.criteria || {}

    this.find(criteria)
      .sort('name')
			.populate('creator', '_id name')
			.populate('areas')
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
});


/* Register model */
mongoose.model('Initiative', InitiativeSchema)

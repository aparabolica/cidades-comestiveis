
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** Schema */

var ResourceTypeSchema = new Schema({
  category: {type: String, enum: ['Supply', 'Tool', 'Knowledge', 'Work'], required: 'missing_category'},
  name: {type: String, required: 'missing_name'},
  description: {type: String}
});

/** Statics */

ResourceTypeSchema.static({

	list: function (options, cb) {
    var criteria = options.criteria || {}

    this.find(criteria)
      .sort('name')
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
});


mongoose.model('ResourceType', ResourceTypeSchema);

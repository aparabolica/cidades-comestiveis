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
	updatedAt: {type: Date},
})

/* Geo index */
AreaSchema.index({ geometry: '2dsphere' })

/* Auto-increment */
AreaSchema.plugin(autoIncrement.plugin, 'Area');

/* Pre/Post middleware */

AreaSchema.pre('save', function(next){
	this.updatedAt = new Date();
	next();
});

/* Register model */
mongoose.model('Area', AreaSchema)

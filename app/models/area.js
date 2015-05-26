
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Schema
 */

var AreaSchema = new Schema({
	creator: { type: Number, ref: 'User', required: true},
	address: { type: String, required: true },
	description: { type: String },
	geometry: { type: {type: String}, coordinates: []},
	createdAt: {type: Date, default: Date.now},
	updatedAt: {type: Date},
})

/* Geo index */
AreaSchema.index({ geometry: '2dsphere' })

/* Pre/Post middleware */

AreaSchema.pre('save', function(next){
	this.updatedAt = new Date();
	next();
});


/* Register model */
mongoose.model('Area', AreaSchema)

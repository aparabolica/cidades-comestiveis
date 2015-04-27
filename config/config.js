
/*!
* Module dependencies.
*/

var
	apiPrefix = '/api/v1',
	path = require('path'),
	rootPath = path.resolve(__dirname + '../..');


/**
* Expose config
*/

module.exports = {
	development: {
		rootPath: rootPath,
		apiPrefix: apiPrefix,
		db: 'mongodb://localhost/comestiveis_dev'
	},
	test: {
		rootPath: rootPath,
		apiPrefix: apiPrefix,
		db: 'mongodb://localhost/comestiveis_test'
	},
	production: {
		rootPath: rootPath,
		apiPrefix: apiPrefix,
		db: process.env.MONGOLAB_URI || 'mongodb://localhost/comestiveis_production'
	}
}

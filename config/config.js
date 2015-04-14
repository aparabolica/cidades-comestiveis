
/*!
* Module dependencies.
*/

var
	apiPrefix = 'api/v1',
	path = require('path'),
	rootPath = path.resolve(__dirname + '../..'),
	sessionSecret = process.env.SESSION_SECRET || 'not so secret',
	i18n = {
		lng: 'pt-BR',
		preload: ['pt-BR'],
		shorcutFunction: 'defaultValue',
		fallbackLng: 'en',
		saveMissing: true,
		debug: true
	}


/**
* Expose config
*/

module.exports = {
	development: {
		root: rootPath,
		apiPrefix: apiPrefix,
		sessionSecret: sessionSecret,
		db: 'mongodb://localhost/comestiveis_dev',
		i18n: i18n
	},
	test: {
		apiPrefix: apiPrefix,
		sessionSecret: sessionSecret,
		db: 'mongodb://localhost/comestiveis_test',
		i18n: i18n
	},
	production: {
		apiPrefix: apiPrefix,
		sessionSecret: sessionSecret,
		db: process.env.MONGOLAB_URI || 'mongodb://localhost/comestiveis_production',
		i18n: i18n
	}
}

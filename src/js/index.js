window.angular = require('angular');
window._ = require('underscore');

require('angular-ui-router');
require('angular-resource');

var app = angular.module('cc', [
	'ui.router', 
	'ngResource'
]);

require('./service');

app.controller('TestCtrl', [
	'$scope',
	'CCService',
	function($scope, CC) {

		CC.user.query(function(data) {
			console.log(data);
		});

	}
]);

angular.element(document).ready(function() {
	angular.bootstrap(document, ['cc']);
});
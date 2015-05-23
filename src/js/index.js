window.angular = require('angular');
window._ = require('underscore');

require('angular-ui-router');
require('angular-resource');
require('angular-leaflet-directive');

var app = angular.module('cc', [
	'ui.router', 
	'ngResource',
	'leaflet-directive'
]);

app.config([
	'$stateProvider',
	'$urlRouterProvider',
	'$locationProvider',
	'$httpProvider',
	function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

		$locationProvider.html5Mode({
			enabled: true,
			requireBase: false
		});
		$locationProvider.hashPrefix('!');

		$stateProvider
			.state('home', {
				url: '/',
				controller: 'HomeCtrl',
				templateUrl: '/views/home.html'
			});

		/*
		 * Trailing slash rule
		 */
		$urlRouterProvider.rule(function($injector, $location) {
			var path = $location.path(),
				search = $location.search(),
				params;

			// check to see if the path already ends in '/'
			if (path[path.length - 1] === '/') {
				return;
			}

			// If there was no search string / query params, return with a `/`
			if (Object.keys(search).length === 0) {
				return path + '/';
			}

			// Otherwise build the search string and return a `/?` prefix
			params = [];
			angular.forEach(search, function(v, k){
				params.push(k + '=' + v);
			});
			
			return path + '/?' + params.join('&');
		});
	}
])
.run([
	'$rootScope',
	'$location',
	'$window',
	function($rootScope, $location, $window) {
		/*
		 * Analytics
		 */
		$rootScope.$on('$stateChangeSuccess', function(ev, toState, toParams, fromState, fromParams) {
			if($window._gaq && fromState.name) {
				$window._gaq.push(['_trackPageview', $location.path()]);
			}
			if(fromState.name) {
				document.body.scrollTop = document.documentElement.scrollTop = 0;
			}
		});
	}
]);

require('./service');

app.controller('HomeCtrl', [
	'$scope',
	'CCService',
	function($scope, CC) {

		// CC.user.query(function(data) {
		// 	console.log(data);
		// });

	}
])

app.controller('MapCtrl', [
	'$scope',
	function($scope) {

		angular.extend($scope, {
			defaults: {
				tileLayer: "http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png",
				maxZoom: 14
			},
			center: {
				lat: -23.550520,
				lng: -46.633309,
				zoom: 12
			}
		});

	}
]);

angular.element(document).ready(function() {
	angular.bootstrap(document, ['cc']);
});
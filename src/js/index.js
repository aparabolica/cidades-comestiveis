window.angular = require('angular');
window._ = require('underscore');

require('angular-ui-router');
require('angular-resource');
require('angular-leaflet-directive');
require('ng-dialog');

var app = angular.module('cc', [
	'ngDialog',
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
	'$rootScope',
	'$scope',
	'CCService',
	function($rootScope, $scope, CC) {

		// CC.user.query(function(data) {
		// 	console.log(data);
		// });

		$scope.mapActive = false;

		$scope.initMap = function() {
			$scope.mapActive = true;
			$rootScope.$broadcast('map.activated');
		};

	}
])

app.controller('MapCtrl', [
	'$scope',
	'leafletData',
	function($scope, leaflet) {

		angular.extend($scope, {
			defaults: {
				tileLayer: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
				maxZoom: 18,
				scrollWheelZoom: false
			},
			center: {
				lat: -23.550520,
				lng: -46.633309,
				zoom: 12
			}
		});
		leaflet.getMap('map').then(function(map) {
			setTimeout(function() {
				map.invalidateSize(true);
			}, 250);
			$scope.$on('map.activated', function() {
				setTimeout(function() {
					map.invalidateSize(true);
				}, 250);
			});
		});

	}
])

app.controller('NewCtrl', [
	'$scope',
	'ngDialog',
	function($scope, ngDialog) {

		$scope.categories = [
			{
				name: 'Insumo',
				label: 'insumo'
			},
			{
				name: 'Conhecimento',
				label: 'conhecimento'
			},
			{
				name: 'Trabalho',
				label: 'trabalho'
			},
			{
				name: 'Ferramentas',
				label: 'ferramentas'
			},
			{
				name: 'Terreno',
				label: 'terreno'
			}
		];

		$scope.addNew = function() {
			ngDialog.open({
				template: '/views/new.html',
				scope: $scope
			});
		};

	}
]);

angular.element(document).ready(function() {
	angular.bootstrap(document, ['cc']);
});
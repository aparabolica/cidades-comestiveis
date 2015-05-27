window.angular = require('angular');
window._ = require('underscore');

require('angular-ui-router');
require('angular-resource');
require('angular-cookies');
require('angular-leaflet-directive');
require('ng-dialog');

var app = angular.module('cc', [
	'ngDialog',
	'ngCookies',
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
require('./auth');

app.controller('MainCtrl', [
	'CCAuth',
	'ngDialog',
	'$rootScope',
	'$scope',
	'$timeout',
	function(Auth, ngDialog, $rootScope, $scope, $timeout) {

		var dialog, user;

		$scope.$watch(function() {
			return Auth.getToken();
		}, function(res) {
			$scope.user = user = res || false;
			if(dialog && user) {
				dialog.close();
				dialog = false;
			}
		});

		$scope = angular.extend($scope, Auth);

		$scope.loginDialog = function(callback) {
			dialog = ngDialog.open({
				template: '/views/login.html',
				controller: ['$scope', 'CCAuth', function($scope, Auth) {
					$scope = angular.extend($scope, Auth);
				}],
				preCloseCallback: function() {
					if(user) {
						if(typeof callback == 'function') {
							$timeout(function() {
								callback();
							}, 50);
						} else if(typeof callback == 'string') {
							$timeout(function() {
								$rootScope.$broadcast('cc.loggedin', callback);
							}, 50);
						}
					}
				}
			});
		}
	}
]);

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
]);

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
	'$timeout',
	'ngDialog',
	function($scope, $timeout, ngDialog) {

		$scope.newDialog = function() {
			ngDialog.open({
				template: '/views/new.html',
				controller: ['$scope', function($scope) {

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
						},
						{
							name: 'Iniciativa',
							label: 'iniciativa'
						}
					];

					$scope.selectCategory = function(cat) {
						$scope.selectedCategory = cat;
					};

				}]
			});
		};

	}
]);

angular.element(document).ready(function() {
	angular.bootstrap(document, ['cc']);
});
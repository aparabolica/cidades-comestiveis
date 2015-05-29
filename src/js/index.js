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
require('./filters');

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

		CC.area.query(function(data) {
			$scope.areas = data.areas;
			console.log($scope.areas);
		});

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
				// tileLayer: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
				tileLayer: "http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg",
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

		var dialog;

		$scope.newDialog = function() {
			dialog = ngDialog.open({
				template: '/views/new.html',
				controller: ['$scope', 'leafletData', 'CCService', function($scope, leafletData, CC) {

					$scope.item = {};

					$scope.categories = [
						{
							name: 'Insumo',
							label: 'insumo',
							fields: []
						},
						{
							name: 'Conhecimento',
							label: 'conhecimento',
							fields: []
						},
						{
							name: 'Trabalho',
							label: 'trabalho',
							fields: []
						},
						{
							name: 'Ferramentas',
							label: 'ferramentas',
							fields: []
						},
						{
							name: 'Terreno',
							label: 'terreno',
							api: 'area',
							fields: ['address','description','geometry']
						},
						{
							name: 'Iniciativa',
							label: 'iniciativa',
							fields: []
						}
					];

					$scope.selectCategory = function(cat) {
						$scope.selectedCategory = cat;
					};

					$scope.hasField = function(field) {
						if($scope.selectedCategory) {
							return _.find($scope.selectedCategory.fields, function(f) { return f == field; });
						}
						return false;
					};

					$scope.map = {
						defaults: {
							// tileLayer: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
							tileLayer: "http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg",
							maxZoom: 18,
							scrollWheelZoom: false
						},
						center: {
							lat: -23.550520,
							lng: -46.633309,
							zoom: 12
						}
					}

					if($scope.item.geometry && $scope.item.geometry.coordinates.length) {
						$scope.map.center = {
							lat: $scope.item.geometry.coordinates[0],
							lng: $scope.item.geometry.coordinates[1],
							zoom: 18
						};
					}

					$scope.geolocation = navigator.geolocation;

					leafletData.getMap('item-geometry').then(function(map) {
						$scope.locate = function() {
							if($scope.geolocation) {
								$scope.geolocation.getCurrentPosition(function(pos) {
									$scope.item.geometry = {
										type: 'Point',
										coordinates: [pos.coords.latitude, pos.coords.longitude]
									};
									map.setView([pos.coords.latitude, pos.coords.longitude], 18);
								});
							}
						}
						$scope.$on('leafletDirectiveMap.dragend', function() {
							var coords = map.getCenter();
							$scope.item.geometry = {
								type: 'Point',
								coordinates: [coords.lat, coords.lng]
							};
						});
					});

					$scope.save = function(item) {
						if($scope.selectedCategory) {
							CC[$scope.selectedCategory.api].save(item, function(data) {
								dialog.close();
							});
						}
					};

				}]
			});
		};

	}
]);

app.controller('UserCtrl', [
	'$scope',
	'ngDialog',
	function($scope, ngDialog) {

		var dialog;

		$scope.editUserDialog = function() {
			dialog = ngDialog.open({
				template: '/views/edit-profile.html',
				controller: ['$scope', 'CCAuth', 'CCService', 'leafletData', function($scope, Auth, CC, leafletData) {

					$scope.user = angular.extend({}, Auth.getToken());

					$scope.map = {
						defaults: {
							// tileLayer: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
							tileLayer: "http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg",
							maxZoom: 18,
							scrollWheelZoom: false
						},
						center: {
							lat: -23.550520,
							lng: -46.633309,
							zoom: 12
						}
					}

					if($scope.user.location && $scope.user.location.coordinates.length) {
						$scope.map.center = {
							lat: $scope.user.location.coordinates[0],
							lng: $scope.user.location.coordinates[1],
							zoom: 18
						};
					}

					$scope.geolocation = navigator.geolocation;

					leafletData.getMap('user-location').then(function(map) {
						$scope.locate = function() {
							if($scope.geolocation) {
								$scope.geolocation.getCurrentPosition(function(pos) {
									$scope.user.location = {
										type: 'Point',
										coordinates: [pos.coords.latitude, pos.coords.longitude]
									};
									map.setView([pos.coords.latitude, pos.coords.longitude], 18);
								});
							}
						}
						$scope.$on('leafletDirectiveMap.dragend', function() {
							var coords = map.getCenter();
							$scope.user.location = {
								type: 'Point',
								coordinates: [coords.lat, coords.lng]
							};
						});
					});

					$scope.save = function(user) {
						delete user.email;
						CC.user.update(user, function(data) {
							Auth.setToken(angular.extend(Auth.getToken(), data));
							dialog.close();
						});
					}

				}]
			});
		}

	}
]);

angular.element(document).ready(function() {
	angular.bootstrap(document, ['cc']);
});
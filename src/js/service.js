angular.module('cc')

.factory('CCAuth', [
	'CCService',
	'$http',
	'$window',
	'$q',
	'$cookies',
	function(CC, $http, $window, $q, $cookies) {

		var apiUrl = '/api/v1';

		$window.auth = '';

		try {
			$window.auth = JSON.parse($cookies.auth);
		} catch(err) {
			$window.auth = false;
		}

		return {
			register: function(data) {
				var self = this;
				CC.user.save(data, function() {
					self.login({
						email: data.email,
						password: data.password
					});
				});
			},
			login: function(credentials) {
				var self = this;
				var deferred = $q.defer();
				$http.post(apiUrl + '/login', credentials).success(function(data) {
					self.setToken(data);
					deferred.resolve(data);
				});
				return deferred.promise;
			},
			logout: function() {
				var self = this;
				if(auth) {
					var deferred = $q.defer();
					$http.get(apiUrl + '/logout').success(function(data) {
						self.setToken('');
						deferred.resolve(true);
					}).error(function() {
						self.setToken('');
						deferred.resolve(true);
					});
					return deferred.promise;
				} else {
					return false;
				}
			},
			setToken: function(data) {
				$window.auth = data;
				try {
					$cookies.auth = JSON.stringify(data);
				} catch(err) {
					$cookies.auth = '';
				}
			},
			getToken: function() {
				return $window.auth;
			}
		}

	}
])

.factory('CCService', [
	'$q',
	'$http',
	'$resource',
	function($q, $http, $resource) {

		var apiUrl = '/api/v1';

		return {
			user: $resource(apiUrl + '/users/:id', { id: '@_id' }, {
				query: {
					method: 'GET',
					isArray: false
				},
				update: {
					method: 'PUT'
				},
				getContributions: {
					method: 'GET',
					url: apiUrl + '/users/:id/contributions'
				}
			}),
			area: $resource(apiUrl + '/areas/:id', { id: '@_id' }, {
				query: {
					method: 'GET',
					isArray: false
				},
				update: {
					method: 'PUT'
				}
			}),
			initiative: $resource(apiUrl + '/initiatives/:id', { id: '@_id' }, {
				query: {
					method: 'GET',
					isArray: false
				},
				update: {
					method: 'PUT'
				}
			}),
			resource: $resource(apiUrl + '/resources/:id', { id: '@id' }, {
				query: {
					method: 'GET',
					isArray: false
				},
				update: {
					method: 'PUT'
				}
			})
		}

	}
])

.factory('CCLoginDialog', [
	'$rootScope',
	'$timeout',
	'CCAuth',
	'ngDialog',
	function($rootScope, $timeout, Auth, ngDialog) {

		var dialog, user;

		$rootScope.$watch(function() {
			return Auth.getToken();
		}, function(res) {
			user = res || false;
			if(dialog && user) {
				dialog.close();
				dialog = false;
			}
		});

		return function(callback) {
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
			return dialog;
		}

	}
])

.factory('CCItemEdit', [
	'$state',
	'ngDialog',
	function($state, ngDialog) {

		var dialog;

		return function(item, type) {

			dialog = ngDialog.open({
				template: '/views/new.html',
				preCloseCallback: function() {
					if($state.current.name == 'home.editItem') {
						$state.go('home');
					}
				},
				controller: ['$scope', 'leafletData', 'CCService', function($scope, leafletData, CC) {

					$scope.item = item || {};

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
							label: 'area',
							api: 'area',
							fields: ['address','description', 'has-garden', 'access','geometry']
						},
						{
							name: 'Iniciativa',
							label: 'iniciativa',
							api: 'initiative',
							fields: ['name', 'description', 'website', 'facebook']
						}
					];

					$scope.selectedCategory = _.find($scope.categories, function(c) { return c.label == type; }) || null;

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
							// New item
							if(!item._id) {
								CC[$scope.selectedCategory.api].save(item, function(data) {
									dialog.close();
								});
							// Update item
							} else {
								CC[$scope.selectedCategory.api].update(item, function(data) {
									dialog.close();
									$state.go('home');
								});
							}
						}
					};

				}]
			});

			return dialog;

		};
	}
]);
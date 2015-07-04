var hello = require('hellojs');

angular.module('cc')
.run([
	function() {

		hello.init({
			'facebook': '1671515763079566'
		});

	}
])
.factory('HelloService', [
	'CCAuth',
	'$timeout',
	function(Auth, $timeout) {

		var callback;

		hello.on('auth.login', function(auth) {
			if(!Auth.getToken()) {
				Auth.facebook(auth).then(function() {
					if(typeof callback == 'function') {
						$timeout(function() {
							callback();
						}, 100);
					}
				});
			}
		});

		return {
			facebook: {
				login: function(cb) {
					callback = cb;
					if(!Auth.getToken())
						hello('facebook').login({scope: 'email,photos'});
				}
			}
		}
	}
])
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
			$window.auth = JSON.parse($cookies.get('auth'));
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
			facebook: function(credentials) {
				var self = this;
				var deferred = $q.defer();
				$http.post(apiUrl + '/login/facebook', credentials).success(function(data) {
					self.setToken(data);
					deferred.resolve(data);
				});
				return deferred.promise;
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
					hello('facebook').logout(function() {
						$http.get(apiUrl + '/logout').success(function(data) {
							self.setToken('');
							deferred.resolve(true);
						}).error(function() {
							self.setToken('');
							deferred.resolve(true);
						});
					});
					return deferred.promise;
				} else {
					return false;
				}
			},
			setToken: function(data) {
				$window.auth = data;
				try {
					$cookies.put('auth', JSON.stringify(data));
				} catch(err) {
					$cookies.remove('auth');
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
				},
				message: {
					method: 'POST',
					url: apiUrl + '/users/:id/message',
					params: {
						id: '@id'
					}
				},
				picture: {
					method: 'POST',
					url: apiUrl + '/users/:id/picture',
					params: {
						id: '@id'
					},
					transformRequest: function(data) {
						if (data === undefined)
							return data;

						var fd = new FormData();
						angular.forEach(data, function(value, key) {
							if (value instanceof FileList) {
								if (value.length == 1) {
									fd.append(key, value[0]);
								} else {
									angular.forEach(value, function(file, index) {
										fd.append(key + '_' + index, file);
									});
								}
							} else {
								fd.append(key, value);
							}
						});

						return fd;
					},
					headers: {
						'Content-Type': undefined
					}
				}
			}),
			area: $resource(apiUrl + '/areas/:id', { id: '@_id' }, {
				query: {
					method: 'GET',
					isArray: false
				},
				update: {
					method: 'PUT'
				},
				addImage: {
					method: 'POST',
					url: apiUrl + '/areas/:id/image',
					params: {
						id: '@id'
					},
					transformRequest: function(data) {
						if (data === undefined)
							return data;

						var fd = new FormData();
						angular.forEach(data, function(value, key) {
							if (value instanceof FileList) {
								if (value.length == 1) {
									fd.append(key, value[0]);
								} else {
									angular.forEach(value, function(file, index) {
										fd.append(key + '_' + index, file);
									});
								}
							} else {
								fd.append(key, value);
							}
						});

						return fd;
					},
					headers: {
						'Content-Type': undefined
					}
				}
			}),
			initiative: $resource(apiUrl + '/initiatives/:id', { id: '@_id' }, {
				query: {
					method: 'GET',
					isArray: false
				},
				update: {
					method: 'PUT'
				},
				addArea: {
					method: 'PUT',
					url: apiUrl + '/initiatives/:id/addArea/:area_id',
					params: {
						id: '@id',
						area_id: '@area_id'
					}
				},
				removeArea: {
					method: 'PUT',
					url: apiUrl + '/initiatives/:id/removeArea/:area_id'
				}
			}),
			resource: $resource(apiUrl + '/resources/:id', { id: '@_id' }, {
				query: {
					method: 'GET',
					isArray: false
				},
				update: {
					method: 'PUT'
				},
				addImage: {
					method: 'POST',
					url: apiUrl + '/resources/:id/image',
					params: {
						id: '@id'
					},
					transformRequest: function(data) {
						if (data === undefined)
							return data;

						var fd = new FormData();
						angular.forEach(data, function(value, key) {
							if (value instanceof FileList) {
								if (value.length == 1) {
									fd.append(key, value[0]);
								} else {
									angular.forEach(value, function(file, index) {
										fd.append(key + '_' + index, file);
									});
								}
							} else {
								fd.append(key, value);
							}
						});

						return fd;
					},
					headers: {
						'Content-Type': undefined
					}
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
				controller: ['$scope', 'CCAuth', 'HelloService', function($scope, Auth, HelloService) {
					$scope.fb = HelloService.facebook;
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

.factory('CCMsgs', [
	function() {
		return {
			get: function(txt) {
				var msg = '';
				switch(txt) {
					case 'mongoose.errors.areas.missing_address':
						msg = 'Você deve preencher o campo de endereço';
						break;
				}
				return msg;
			}
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
				overlay: false,
				template: '/views/new.html',
				preCloseCallback: function() {
					if($state.current.name == 'home.editItem' || $state.current.name == 'home.newItem') {
						$state.go('home');
					}
				},
				controller: ['$scope', 'leafletData', 'CCService', 'MessageService', 'CCMsgs', function($scope, leafletData, CC, Message, Msgs) {

					$scope.item = item || {};

					$scope.categories = [
						{
							name: 'Insumo',
							label: 'insumo',
							api: 'resource',
							defaultValues: {
								category: 'Supply'
							},
							fields: ['description', 'availability', 'geometry', 'image', 'supply-type']
						},
						{
							name: 'Conhecimento',
							label: 'conhecimento',
							api: 'resource',
							defaultValues: {
								category: 'Knowledge'
							},
							fields: ['description', 'availability', 'geometry', 'image']
						},
						{
							name: 'Trabalho',
							label: 'trabalho',
							api: 'resource',
							defaultValues: {
								category: 'Work'
							},
							fields: ['description', 'availability', 'geometry', 'image']
						},
						{
							name: 'Ferramentas',
							label: 'ferramentas',
							api: 'resource',
							defaultValues: {
								category: 'Tool'
							},
							fields: ['description', 'availability', 'geometry', 'image']
						},
						{
							name: 'Terreno',
							label: 'area',
							api: 'area',
							fields: ['address','description', 'has-garden', 'access', 'geometry', 'image']
						},
						{
							name: 'Iniciativa',
							label: 'initiative',
							api: 'initiative',
							fields: ['name', 'description', 'website', 'facebook']
						}
					];

					$scope.selectedCategory = _.find($scope.categories, function(c) { return c.api == type; }) || null;

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

					$scope.uploadImage = false;

					$scope.save = function(item) {
						if($scope.selectedCategory) {
							// Apply category default values
							var defaultValues = $scope.selectedCategory.defaultValues;
							if(defaultValues)
								angular.extend(item, defaultValues);
							// New item
							if(!item._id) {
								CC[$scope.selectedCategory.api].save(item, function(data) {
									if($scope.uploadImage) {
										CC[$scope.selectedCategory.api].addImage({id: data._id, file: $scope.uploadImage}, function(data) {
											Message.add('Item cadastrado com sucesso!');
											dialog.close();
											$state.go('home', {}, {reload: true});
										});
									} else {
										Message.add('Item cadastrado com sucesso!');
										dialog.close();
										$state.go('home', {}, {reload: true});
									}
								}, function(err) {
									if(err.data.messages) {
										_.each(err.data.messages, function(msg) {
											Message.add(Msgs.get(msg.text));
										});
									}
								});
							// Update item
							} else {
								CC[$scope.selectedCategory.api].update(item, function(data) {
									if($scope.uploadImage) {
										Message.add('Item atualizado com sucesso!');
										CC[$scope.selectedCategory.api].addImage({id: data._id, file: $scope.uploadImage}, function(data) {
											dialog.close();
											$state.go('home', {}, {reload: true});
										});
									} else {
										Message.add('Item atualizado com sucesso!');
										dialog.close();
										$state.go('home', {}, {reload: true});
									}
								}, function(err) {
									if(err.data.messages) {
										_.each(err.data.messages, function(msg) {
											Message.add(Msgs.get(msg.text));
										});
									}
								});
							}

						}
					};

					$scope.formatDate = function(date) {
						if(date)
							return moment(date).format('LL');
						return '';
					};

				}]
			});

			return dialog;

		};
	}
]);

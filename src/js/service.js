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
			initiative: $resource(apiUrl + '/initiatives/:id', { id: '@id' }, {
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
]);
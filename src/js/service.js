angular.module('cc')

.factory('CCAuth', [
	'$cookies',
	function($cookies) {

		var auth = '';

		try {
			auth = JSON.parse($cookies.auth);
		} catch(err) {
			auth = false;
		}

		return {
			setToken: function(data) {
				auth = data;
				try {
					$cookies.auth = JSON.stringify(data);
				} catch(err) {
					$cookies.auth = '';
				}
			},
			getToken: function() {
				return auth;
			}
		}

	}
])

.factory('CCService', [
	'$q',
	'$http',
	'$resource',
	'CCAuth',
	function($q, $http, $resource, Auth) {

		var apiUrl = '/api/v1';

		return {
			login: function(credentials) {
				var deferred = $q.defer();
				$http.post(apiUrl + '/login', credentials).success(function(data) {
					Auth.setToken(data);
					deferred.resolve(data);
				});
				return deferred.promise;
			},
			logout: function() {
				var deferred = $q.defer();
				$http.get(apiUrl + '/logout').success(function(data) {
					Auth.setToken('');
					deferred.resolve(true);
				}).error(function() {
					Auth.setToken('');
					deferred.resolve(true);
				});
				return deferred.promise;
			},
			user: $resource(apiUrl + '/users/:id', { id: '@id' }, {
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
			land: $resource(apiUrl + '/lands/:id', { id: '@id' }, {
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
angular.module('cc')

.factory('CCService', [
	'$resource',
	function($resource) {

		var apiUrl = '/api/v1';

		return {
			user: $resource(apiUrl + '/users/:id', { id: '@id' }, {
				update: {
					method: 'PUT'
				}
			}),
			resource: $resource(apiUrl + '/resources/:id', { id: '@id' }, {
				update: {
					method: 'PUT'
				}
			}),
			land: $resource(apiUrl + '/lands/:id', { id: '@id' }, {
				update: {
					method: 'PUT'
				}
			}),
			initiative: $resource(apiUrl + '/initiatives/:id', { id: '@id' }, {
				update: {
					method: 'PUT'
				}
			})
		}

	}
]);
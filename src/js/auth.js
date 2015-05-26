angular.module('cc')

.factory('authInterceptor', [
	'$rootScope',
	'$q',
	'CCAuth',
	function($rootScope, $q, Auth) {

		if(typeof $ !== 'undefined' || typeof jQuery !== 'undefined') {
			$.ajaxSetup({
				beforeSend: function(req) {
					if(Auth.getToken())
						req.setRequestHeader('Authorization', 'Bearer ' + Auth.getToken().accessToken);
				}
			});
		}

		return {
			request: function(config) {
				config.headers = config.headers || {};
				if(Auth.getToken())
					config.headers['Authorization'] = 'Bearer ' + Auth.getToken().accessToken;
				return config || $q.when(config);
			}
		};
	}
])
.config([
	'$httpProvider',
	function($httpProvider) {
		$httpProvider.interceptors.push('authInterceptor');
	}
]);
// .run([
// 	'$rootScope',
// 	'CCAuth',
// 	function($rootScope, Auth) {

// 		$rootScope.$watch(function() {
// 			return Auth.getToken();
// 		}, function(nonce) {
// 			if(nonce) {
// 				WP.getUser().then(function(data) {
// 					CC.setUser(data);
// 				});
// 			}
// 		});

// 	}
// ])
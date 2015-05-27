angular.module('cc')

.factory('authInterceptor', [
	'$rootScope',
	'$window',
	'$q',
	function($rootScope, $window, $q) {

		if(typeof $ !== 'undefined' || typeof jQuery !== 'undefined') {
			$.ajaxSetup({
				beforeSend: function(req) {
					if($window.auth)
						req.setRequestHeader('Authorization', 'Bearer ' + $window.auth.accessToken);
				}
			});
		}

		return {
			request: function(config) {
				config.headers = config.headers || {};
				if($window.auth)
					config.headers['Authorization'] = 'Bearer ' + $window.auth.accessToken;
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
var hello = require('hellojs');

angular.module('cc')
.run([
	'CCAuth',
	function(Auth) {

		hello.init({
			'facebook': '1671515763079566'
		});

		// hello('facebook').logout();

		hello.on('auth.login', function(auth) {
			Auth.facebook(auth);
			hello('facebook').api('/me').then(function(data) {
				console.log(data);
			});
		});
	}
])
.factory('HelloService', [
	function() {
		return {
			facebook: {
				login: function() {
					hello('facebook').login({scope: 'email,photos'});
				},
				logout: function() {
					hello('facebook').logout();
				}
			}
		}
	}
])
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
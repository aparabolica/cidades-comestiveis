window.angular = require('angular');
window._ = require('underscore');
window.moment = require('moment');
require('moment/locale/pt-br.js');
moment.locale('pt-br');

window.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

// window.isMobile = true;

require('angular-ui-router');
require('angular-resource');
require('angular-cookies');
require('angular-leaflet-directive');
require('ng-dialog');
require('angular-bootstrap-datetimepicker');

var app = angular.module('cc', [
	'ngDialog',
	'ngCookies',
	'ui.router',
	'ngResource',
	'leaflet-directive',
	'ui.bootstrap.datetimepicker'
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
				templateUrl: function() {
					if(!isMobile) {
						return '/views/home.html';
					} else {
						return '/views/mobile/home.html';
					}
				}
			})
			.state('home.status', {
				url: 'status/:message/'
			})
			.state('home.area', {
				url: 'terreno/:id/',
				controller: 'SingleCtrl',
				templateUrl: function() {
					if(isMobile) {
						return '/views/area.html';
					} else {
						return null;
					}
				},
				resolve: {
					Data: [
						'$stateParams',
						'CCService',
						function($stateParams, CC) {
							return CC.area.get({id: $stateParams.id}).$promise;
						}
					],
					Type: function() {
						return 'area';
					}
				}
			})
			.state('home.resource', {
				url: 'recurso/:id/',
				controller: 'SingleCtrl',
				templateUrl: function() {
					if(isMobile) {
						return '/views/resource.html';
					} else {
						return null;
					}
				},
				resolve: {
					Data: [
						'$stateParams',
						'CCService',
						function($stateParams, CC) {
							return CC.resource.get({id: $stateParams.id}).$promise;
						}
					],
					Type: function() {
						return 'resource';
					}
				}
			})
			.state('home.newItem', {
				url: 'new/',
				controller: 'NewItemCtrl'
			})
			.state('home.editItem', {
				url: 'edit/:type/:id/',
				controller: 'EditItemCtrl'
			})
			.state('projeto', {
				url: '/projeto/',
				controller: 'PageCtrl',
				templateUrl: '/views/projeto.html'
			})
			.state('manifesto', {
				url: '/manifesto/',
				controller: 'PageCtrl',
				templateUrl: '/views/manifesto.html'
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
	'ngDialog',
	function($rootScope, $location, $window, ngDialog) {
		/*
		 * Analytics
		 */
		$rootScope.$on('$stateChangeSuccess', function(ev, toState, toParams, fromState, fromParams) {

			if($window._gaq && fromState.name) {
				$window._gaq.push(['_trackPageview', $location.path()]);
			}
			if(fromState.name) {
				if(toState.name == 'home')
					ngDialog.closeAll();
				document.body.scrollTop = document.documentElement.scrollTop = 0;
			}
		});
	}
]);

require('./service');
require('./auth');
require('./directives');
require('./filters');
require('./message');

app.controller('MainCtrl', [
	'CCAuth',
	'CCLoginDialog',
	'HelloService',
	'$rootScope',
	'$state',
	'$scope',
	'$timeout',
	function(Auth, CCLoginDialog, HelloService, $rootScope, $state, $scope, $timeout) {

		$scope.fb = HelloService.facebook;

		$scope.isMobile = isMobile;

		$scope.headerUrl = '/views/includes/header.html';
		$scope.footerUrl = '/views/includes/footer.html';

		if(isMobile) {
			$scope.headerUrl = '/views/mobile/includes/header.html';
			$scope.footerUrl = '/views/mobile/includes/footer.html';

			$scope.listResultsActive = false;
			$scope.toggleList = function(activateOnly) {
				if(activateOnly) {
					$scope.listResultsActive = true;
				} else {
					if($scope.listResultsActive)
						$scope.listResultsActive = false;
					else
						$scope.listResultsActive = true;
				}
			}

			$scope.navActive = false;
			$scope.toggleNav = function() {
				if($scope.navActive == true) {
					$scope.navActive = false;
				} else {
					$scope.navActive = true;
				}
			}

			$rootScope.$on('$stateChangeSuccess', function(ev, toState, fromState) {
				$scope.navActive = false;
				if(toState.name == 'home')
					$scope.isHome = true;
				else
					$scope.isHome = false;
			});

		}

		$scope.$watch(function() {
			return Auth.getToken();
		}, function(res) {
			$scope.user = res || false;
		});

		$scope.loginDialog = CCLoginDialog;

		$scope = angular.extend($scope, Auth);

		$scope.mapActive = false;

		$scope.initMap = function() {
			$scope.mapActive = true;
			$rootScope.$broadcast('map.activated');
		};
	}
]);

app.controller('HomeCtrl', [
	'$rootScope',
	'$state',
	'$stateParams',
	'$scope',
	'MessageService',
	'CCMsgs',
	'CCService',
	function($rootScope, $state, $stateParams, $scope, Message, Msgs, CC) {

		CC.area.query(function(data) {
			$scope.areas = data.areas;
			_.each($scope.areas, function(area) {
				area.dataType = 'area';
			});
		});

		if($state.params.message) {
			Message.add(Msgs.get($state.params.message));
		}

		CC.resource.query(function(data) {
			$scope.resources = data.resources;
			_.each($scope.resources, function(item) {
				var icon = item.category.toLowerCase();
				item.icon = icon;
			});
		});

		$scope.$on('cc.map.boundsUpdate', _.debounce(function(ev, bounds) {
			var southWest = bounds.getSouthWest();
			var northEast = bounds.getNorthEast();
			var bbox = {
				"type": "Polygon",
				"coordinates": [
					[
						[southWest.lng, southWest.lat],
						[southWest.lng, northEast.lat],
						[northEast.lng, northEast.lat],
						[northEast.lng, southWest.lat],
						[southWest.lng, southWest.lat],
					]
				]
			};
			bbox = {
				"coordinates": [
					[southWest.lat, southWest.lng],
					[northEast.lat, northEast.lng]
				]
			};
			CC.resource.query({bbox: bbox}, function(data) {
				$scope.resources = data.resources;
				_.each($scope.resources, function(item) {
					var icon = item.category.toLowerCase();
					item.icon = icon;
				});
			});
		}), 500);

	}
]);

app.factory('ResourceService', [
	function() {
		return {
			getCategory: function(resource) {
				var name = '';
				switch(resource.category) {
					case 'Supply':
						name = 'Insumo';
						break;
					case 'Work':
						name = 'Trabalho';
						break;
					case 'Knowledge':
						name = 'Conhecimento';
						break;
					case 'Tool':
						name = 'Ferramenta';
						break;
				}
				return name;
			}
		}
	}
]);

app.controller('ResourceCtrl', [
	'$scope',
	'ResourceService',
	'CCService',
	'$state',
	'ngDialog',
	function($scope, Resource, CC, $state, ngDialog) {

		$scope.getResourceCategory = Resource.getCategory;

		$scope.countResources = function(category, collection) {
			return _.filter(collection, function(resource) { return resource.category == category; }).length;
		};

		$scope.catFilter = '';
		$scope.toggleFilter = function(category) {
			if($scope.catFilter == category)
				$scope.catFilter = '';
			else
				$scope.catFilter = category;
		};
	}
]);

app.controller('MapCtrl', [
	'$rootScope',
	'$scope',
	'$state',
	'$timeout',
	'leafletData',
	function($rootScope, $scope, $state, $timeout, leaflet) {

		angular.extend($scope, {
			defaults: {
				// tileLayer: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
				tileLayer: "https://{s}.tiles.mapbox.com/v4/miguelpeixe.l94olf54/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWlndWVscGVpeGUiLCJhIjoiVlc0WWlrQSJ9.pIPkSx25w7ossO6rZH9Tcw",
				// tileLayer: "http://{s}.sm.mapstack.stamen.com/((toner-lite,$ff6600[hsl-color]),(parks,$339900[hsl-color]),mapbox-water)/{z}/{x}/{y}.png",
				// tileLayer: "http://{s}.sm.mapstack.stamen.com/($eeeeee[@p],(parks,$339900[hsl-color]),mapbox-water,(toner-lite,$ff6600[hsl-color])[multiply])/{z}/{x}/{y}.png",
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
			$scope.$on('leafletDirectiveMarker.mouseover', function(event, args) {
				args.leafletEvent.target.openPopup();
				args.leafletEvent.target.setZIndexOffset(1000);
			});

			$scope.$on('leafletDirectiveMarker.mouseout', function(event, args) {
				args.leafletEvent.target.closePopup();
				args.leafletEvent.target.setZIndexOffset(0);
			});

			$scope.$on('leafletDirectiveMarker.click', function(event, args) {
				$state.go('home.' + args.model.object.dataType, { type: args.model.object.dataType, id:  args.model.object._id });
			});

			$scope.$on('leafletDirectiveMap.dragend', function(event, args) {
				if(args.leafletObject._container.id == 'map')
					$rootScope.$broadcast('cc.map.boundsUpdate', map.getBounds());
			});
			$scope.$on('leafletDirectiveMap.zoomend', function(event, args) {
				if(args.leafletObject._container.id == 'map')
					$rootScope.$broadcast('cc.map.boundsUpdate', map.getBounds());
			});
			$scope.$on('leafletDirectiveMap.load', function(event, args) {
				if(args.leafletObject._container.id == 'map')
					$rootScope.$broadcast('cc.map.boundsUpdate', map.getBounds());
			});

			if(isMobile) {
				if(navigator.geolocation) {
					$timeout(function() {
						navigator.geolocation.getCurrentPosition(function(pos) {
							map.setView([pos.coords.latitude, pos.coords.longitude], 16);
						}, function(err) {
							alert('Ative a geolocalização do seu dispositivo e atualize a página.');
						});
					}, 500);
				}
			}
		});

	}
]);

app.controller('SingleCtrl', [
	'Data',
	'Type',
	'CCAuth',
	'ngDialog',
	'$scope',
	'$state',
	'CCService',
	function(Data, Type, Auth, ngDialog, $scope, $state, CC) {

		$scope.item = Data;
		$scope.type = Type;

		var icon = false;

		if($scope.item.category) {
			icon = $scope.item.category.toLowerCase();
		} else if($scope.type == 'area') {
			if($scope.item.hasGarden) {
				icon = 'initiative';
			} else {
				icon = 'area';
			}
		}

		if(icon)
			$scope.item.icon = icon;

		var user = Auth.getToken();

		$scope.canEditCurrent = false;
		if(user) {
			if(user._id == Data.creator._id || user.role == 'admin') {
				$scope.canEditCurrent = true;
			}
		}

		$scope.canEdit = function(item, type) {
			if(user) {
				if(user._id == item.creator._id || user.role == 'admin') {
					return true;
				}
			}
			return false;
		}

		$scope.delete = function(item, type) {
			if(confirm('Você tem certeza que deseja remover este item?')) {
				CC[type].delete({id: item._id}, function() {
					ngDialog.closeAll();
					$state.go('home', {}, {reload: true});
				});
			}
		};

		$scope.unsetIniatitive = function(initiative, area) {
			if(confirm('Você tem certeza que deseja desassociar esta iniciativa do terreno?')) {
				CC.initiative.removeArea({id: initiative._id, area_id: area._id}, function() {
					area.initiatives = _.filter(area.initiatives, function(item) { return item._id !== initiative._id; });
				})
			}
		}

		if(!isMobile) {
			var dialog = ngDialog.open({
				overlay: false,
				template: '/views/' + Type + '.html',
				scope: $scope,
				preCloseCallback: function() {
					$state.go('home');
				}
			});
		}
	}
]);

app.controller('EditItemCtrl', [
	'$scope',
	'$state',
	'$stateParams',
	'CCService',
	'CCAuth',
	'CCLoginDialog',
	'CCItemEdit',
	function($scope, $state, $stateParams, CC, Auth, LoginDialog, ItemEdit) {

		$scope.editDialog = ItemEdit;

		var edit = function() {
			CC[$stateParams.type].get({id: $stateParams.id}, function(item) {
				ItemEdit(item, $stateParams.type);
			});
		};

		$scope.$watch($state.current.name, function() {
			if($state.current.name == 'home.editItem') {
				if(Auth.getToken()) {
					edit();
				} else {
					LoginDialog(edit);
				}
			}
		});
	}
]);

app.controller('NewItemCtrl', [
	'$scope',
	'$state',
	'$stateParams',
	'CCService',
	'CCAuth',
	'CCLoginDialog',
	'HelloService',
	'CCItemEdit',
	function($scope, $state, $stateParams, CC, Auth, LoginDialog, Hello, ItemEdit) {

		$scope.editDialog = ItemEdit;

		$scope.$watch($state.current.name, function() {
			if($state.current.name == 'home.newItem') {
				if(Auth.getToken()) {
					ItemEdit();
				} else {
					LoginDialog(ItemEdit);
				}
			}
		});
	}
]);

app.controller('ItemCtrl', [
	'$scope',
	'CCItemEdit',
	function($scope, ItemEdit) {

		$scope.editDialog = ItemEdit;

	}
]);

app.controller('DashboardCtrl', [
	'$scope',
	'CCService',
	'CCItemEdit',
	'CCAuth',
	function($scope, CC, ItemEdit, Auth) {

		$scope.$watch(function() {
			return Auth.getToken();
		}, function(user) {
			$scope.items = false;
			$scope.user = user;
			if(user) {
				CC.user.getContributions({id: $scope.user._id}, function(data) {
					$scope.items = data.contributions;
					_.each($scope.items, function(item) {
						var icon;
						if(item.type == 'area' || item.type == 'initiative') {
							icon = item.type;
						} else {
							icon = item.category.toLowerCase();
						}
						item.icon = icon;
					});
				});
			}
		});

		$scope.getItems = function(type) {
			if($scope.items && $scope.items.length) {
				return _.filter($scope.items, function(item) { return item.type == type; });
			} else {
				return [];
			}
		};

	}
]);

app.controller('InitiativeCtrl', [
	'CCService',
	'MessageService',
	'$scope',
	function(CC, Message, $scope) {

		$scope.addArea = function(id, area) {
			CC.initiative.addArea({id: id, area_id: area._id}, function(data) {
				if(!area.initiatives)
					area.initiatives = [];
				CC.initiative.get({id: id}, function(initiative) {
					area.initiatives.push(initiative);
					Message.add('Iniciativa associada com sucesso');
				});
			});
		};

		$scope.removeArea = function(id, areaId) {
			CC.initiative.removeArea({id: id, area_id: areaId}, function(data) {
				Message.add('Iniciativa desassociada com sucesso');
			});
		};

	}
])

app.controller('UserCtrl', [
	'$scope',
	'ngDialog',
	function($scope, ngDialog) {

		var dialog;

		$scope.editUserDialog = function() {
			dialog = ngDialog.open({
				overlay: false,
				template: '/views/edit-profile.html',
				controller: ['$scope', '$state', 'CCAuth', 'CCService', 'leafletData', 'MessageService', function($scope, $state, Auth, CC, leafletData, Message) {

					$scope.user = angular.extend({}, Auth.getToken());

					$scope.map = {
						defaults: {
							// tileLayer: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
							tileLayer: "ttps://{s}.tiles.mapbox.com/v4/miguelpeixe.l94olf54/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWlndWVscGVpeGUiLCJhIjoiVlc0WWlrQSJ9.pIPkSx25w7ossO6rZH9Tcw",
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

					$scope.uploadImage = false;

					$scope.save = function(user) {
						// delete user.email;
						CC.user.update(user, function(data) {
							Auth.setToken(angular.extend(Auth.getToken(), data));
							if($scope.uploadImage) {
								CC.user.picture({id: data._id, file: $scope.uploadImage}, function(data) {
									Message.add('Perfil atualizado.');
									$state.go('home', {}, {reload: true});
									dialog.close();
								});
							} else {
								Message.add('Perfil atualizado.');
								$state.go('home', {}, {reload: true});
								dialog.close();
							}
						});
					}

				}]
			});
		}

	}
]);

app.controller('PageCtrl', [
	'$scope',
	function($scope) {



	}
]);

app.controller('ContactCreatorCtrl', [
	'CCAuth',
	'CCService',
	'ResourceService',
	'$scope',
	'MessageService',
	function(Auth, CC, Resource, $scope, Message) {
		$scope.text = '';
		$scope.contact = function(item, text) {
			if(Auth.getToken()) {
				var mail = 'Olá ' + item.creator.name + '! \n\n' + Auth.getToken().name + ' gostaria de conversar com você sobre um recurso que você publicou no Cidades Comestíveis. \n\nRecurso: ' + Resource.getCategory(item) + '\n\nDescrição: ' + item.description + '\n\nMensagem: \n\n' + text;
				CC.user.message({id: item.creator._id, message: mail}, function(data) {
					// console.log(data);
					Message.add('Mensagem enviada! Você receberá uma resposta por email.');
				});
			}
		};
	}
]);


/*
 * Loading module
 */

app
.config([
	'$httpProvider',
	function($httpProvider) {
		$httpProvider.interceptors.push('loadingStatusInterceptor');
	}
])
.service('LoadingService', [
	function() {

		var loads = [];

		return {
			get: function() {
				return loads;
			},
			add: function(text, id) {
				if(typeof id == 'undefined')
					id = Math.random();

				var load = {
					_id: id,
					msg: text
				};

				loads.push(load);
				loads = loads; // trigger digest?
				return load._id;
			},
			remove: function(id) {
				loads = loads.filter(function(load) { return load._id !== id; });
				loads = loads;
				return loads;
			}
		}

	}
])
.directive('loadingStatusMessage', [
	'LoadingService',
	function(service) {
		return {
			link: function($scope, $element, attrs) {
				$scope.$watch(function() {
					return service.get();
				}, function(loads) {
					$scope.loads = loads;
				});
			},
			template: '<div class="loading-message"><span ng-repeat="load in loads" ng-show="load.msg">{{load.msg}}<br/></span></div>'
		};
	}
])
.factory('loadingStatusInterceptor', [
	'$q',
	'$rootScope',
	'$timeout',
	'LoadingService',
	function($q, $rootScope, $timeout, service) {
		return {
			request: function(config) {

				config.loadingId = service.add();

				return config || $q.when(config);
			},
			response: function(response) {

				if(response.config.loadingId)
					service.remove(response.config.loadingId);

				return response || $q.when(response);
			},
			responseError: function(rejection) {

				if(rejection.config.loadingId)
					service.remove(rejection.config.loadingId);

				return $q.reject(rejection);
			}
		};
	}
]);

angular.element(document).ready(function() {
	angular.bootstrap(document, ['cc']);
});

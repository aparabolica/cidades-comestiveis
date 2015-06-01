angular.module('cc')

.factory('MarkerIcons', [
	function() {

		return {
			'area-garden': {
				iconUrl: '/img/icons/carrot.png',
				shadowUrl: false,
				shadowSize: [0,0],
				iconSize: [30,42],
				iconAnchor: [15,42],
				popupAnchor: [0,-42]
			},
			'area-empty': {
				iconUrl: '/img/icons/pin.png',
				shadowUrl: false,
				shadowSize: [0,0],
				iconSize: [30,42],
				iconAnchor: [15,42],
				popupAnchor: [0,-42]
			}
		}

	}
])

.filter('areaToMarker', [
	'MarkerIcons',
	function(Icons) {
		return _.memoize(function(input) {

			if(input && input.length) {

				var markers = {};
				_.each(input, function(area) {
					markers[area._id] = {
						object: area,
						lat: area.geometry.coordinates[0],
						lng: area.geometry.coordinates[1],
						icon: area.hasGarden ? Icons['area-garden'] : Icons['area-empty'],
						message: '<p>' + area.description + '</p>'
					};
				});

				return markers;

			}

			return {};

		}, function() {
			return JSON.stringify(arguments);
		});
	}
])
angular.module('cc')

.filter('areaToMarker', [
	'leafletData',
	function(leafletData) {
		return _.memoize(function(input) {

			if(input && input.length) {

				var markers = {};
				_.each(input, function(area) {
					markers[area._id] = {
						lat: area.geometry.coordinates[0],
						lng: area.geometry.coordinates[1],
						// icon: icon,
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
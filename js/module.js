angular.module("charts", [])
    .controller("mainController", function AppController($scope) {
	$scope.month = "Jan";
	$scope.day = "1";
	$scope.year = new Date().getFullYear();
	$scope.hour = "12";
	$scope.minutes = "01";
	$scope.ampm = "PM";
        $scope.hovered = function(d) {
		if (d.month) { $scope.month = d.month; }
		if (d.day) { $scope.day = d.day; }
		if (d.hour) { $scope.hour = d.hour; }
		if (d.minutes) { $scope.minutes = d.minutes; }
		if (d.ampm) { $scope.ampm = d.ampm; }
		$scope.$apply();
        };
    })
    .directive("chart", function() {
	var chart = d3.custom.chart();
        return {
            restrict: "E",
            replace: true,
            template: '<div class="chart"></div>',
            scope:{
                hovered: "&hovered"
            },
            link: function(scope, element, attrs) {
                var chartElement = d3.select(element[0]); 
		chart.on("customMovement", function(d, i){
                    scope.hovered({args:d}); 
                });
                scope.$watch("data", function (newVal, oldVal) {
                    chartElement.datum(newVal).call(chart);
                });
            }
        }
    });

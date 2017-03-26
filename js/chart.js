d3.custom = {
	
	chart: function module() {
	
		var dispatch = d3.dispatch("customMovement");
		
		function exports(_selection) {
			
			_selection.each(function(_data) {

				/* CUSTOMIZATION VARIABLES */
				var width = 750, 
					height = 750, 
					outerRadius = 300, 
					innerRadius = 190,
					monthTickBufferOuter = 85,
					monthTickBufferInner = 65,
					dayTickBufferOuter = 55,
					dayTickBufferInner = 45,
					textContainerWidth = 238,
					fillDefault = "#000",
					fillHighlight = "#3535d2",
					fontSizeSmall = "12px",
					fontSizeBase = "14px",
					fontSizeLarge = "18px",
					fontDefault = "'Open Sans', Arial, sans-serif";

				/* BASE DATA */
				var monthData = [
					{ "month": "Jan", 	"days": 31, "order": 1 },
					{ "month": "Feb", 	"days": 28, "order": 2 },
					{ "month": "Mar", 	"days": 31, "order": 3 },
					{ "month": "Apr", 	"days": 30, "order": 4 },
					{ "month": "May", 	"days": 31, "order": 5 },
					{ "month": "June", 	"days": 30, "order": 6 },
					{ "month": "July", 	"days": 31, "order": 7 },
					{ "month": "Aug", 	"days": 31, "order": 8 },
					{ "month": "Sept",  "days": 30, "order": 9 },
					{ "month": "Oct", 	"days": 31, "order": 10 },
					{ "month": "Nov", 	"days": 30, "order": 11 },
					{ "month": "Dec", 	"days": 31, "order": 12 },
				];
				
				var dayData = populateDayData(31);
				
				/* SVG BASE */
				var svg = d3.select("body")
					.append("svg")
					.data([monthData])
					.attr("id", "root")
					.attr("width", width)
					.attr("height", height)
					.style("margin-left", (window.innerWidth - width) / 2 + "px")
					.append("svg:g")
					.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
					
				window.addEventListener("resize", function() {
					d3.select("#root").style("margin-left", (window.innerWidth - width) / 2 + "px");
				});
					
				/* MONTH SLIDER */
				var monthContainer = svg.append("g").attr("id", "monthContainer");
				
				var monthLayout = d3.layout.pie()
					.value(function() { return 1; })
					.sort(function(a, b) { return d3.ascending(a.order, b.order); });
						
				var monthArcs = monthContainer.selectAll("g.month-slice")
					.data(monthLayout)
					.enter()
					.append("svg:g")
					.attr("id", function(d, i) { return "month-slice-" + monthData[i].month; })
					.attr("class", "month-slice");
				
				var monthArcFunction = d3.svg.arc().outerRadius(outerRadius);
				monthArcs.append("svg:path").attr("d", monthArcFunction);
					
				monthArcs.append("svg:text")
					.attr("id", function(d, i) { return "month-" + monthData[i].month; })
					.attr("class", "month-tick")
					.attr("transform", function(d) {
						d.outerRadius = outerRadius + monthTickBufferOuter;
						d.innerRadius = outerRadius + monthTickBufferInner;
						return "translate(" + monthArcFunction.centroid(d) + ")";
					})
					.attr("text-anchor", "middle")
					.style("fill", fillDefault)
					.style("font", fontSizeBase + " " + fontDefault)
					.text(function(d, i) { return monthData[i].month; });
				highlightTick("#month-Jan", fontSizeLarge);
				
				var outerCircle = monthContainer.append("svg:circle")
					.attr("r", outerRadius)
					.attr("class", "circumference");
						
				var outerHandle = monthContainer.append("svg:g")
					.attr("id", "month-handle")
					.attr("class", "dot")
					.selectAll("circle")
					.data([{
						x: 0,
						y: -outerRadius,
						month: "Jan"
					}])
					.enter()
					.append("circle")
					.attr("id", "month-handle-circle")
					.attr("r", 8)
					.attr("cx", 0)
					.attr("cy", -outerRadius)
					.call(d3.behavior.drag()
						.origin(function(d) { return d; })
						.on("drag", function dragged(d) {    
							var d_from_origin = Math.sqrt(Math.pow(d3.event.x, 2) + Math.pow(d3.event.y, 2));
							var alpha = Math.acos(d3.event.x / d_from_origin);
							d3.select(this)
								.attr("cx", d.x = outerRadius * Math.cos(alpha))
								.attr("cy", d.y = d3.event.y < 0 ? -outerRadius * Math.sin(alpha) : outerRadius * Math.sin(alpha))
								.call(collisionDetection);
						})
						.on("dragend", dispatch.customMovement)
					);
				
				/* RENDER THE DAY SLIDER */				
				addDays();

				/* MONTH & DAY TICK HIGHLIGHT EFFECT */
				function highlightTick(selector, fontSize) {
					d3.select(selector)		
						.style("fill", fillHighlight)
						.style("font-size", fontSize)
						.style("font-weight", "bold");
				}
				
				function removeTickHighlight(selector, fontSize) {
					d3.selectAll(selector)
						.attr("selected", "false")
						.style("fill", fillDefault)
						.style("font-size", fontSize)
						.style("font-weight", "normal");
				}
				
				/* SLIDER DATA CAPTURE */
				// This was a little tricky. The best solution so far is to find the slider handle's position
				// on its circular slider track, instead of relying on the base SVG element positioning.
			    // 		http://datavizclub.tumblr.com/post/119852708658/collision-detection-with-svgs-bounding-box
				// 		https://stackoverflow.com/questions/34293488/d3-find-the-angle-of-line
				function collisionDetection() {
					var node, nodeData, d_from_origin, alpha, xVal, yVal, angle, referenceAngles;
					node = this.node();
					nodeBox = node.getBBox();
					nodeLeft = nodeBox.x;
					nodeRight = nodeBox.x + nodeBox.width;
					nodeTop = nodeBox.y;
					nodeBottom = nodeBox.y + nodeBox.height;
					if (d3.select(node).attr("id") === "month-handle-circle") {
						removeTickHighlight(".month-tick", fontSizeBase);
						d3.selectAll(".month-slice")
							.attr("selected", "false")
							.attr("selected", function(d) {
								removeTickHighlight("#month-" + d.data.month, fontSizeBase);
								if (this !== node) {
									d_from_origin = Math.sqrt(Math.pow(d3.event.x, 2) + Math.pow(d3.event.y, 2));
									alpha = Math.acos(d3.event.x / d_from_origin);
									xVal = d3.event.y < 0 ? -innerRadius * Math.sin(alpha) : innerRadius * Math.sin(alpha);
									yVal = innerRadius * Math.cos(alpha);
									angle = Math.atan2(yVal, 0 - xVal);
									if (nodeBox.x <= 0) { angle = (Math.PI * 2) + angle; }
									referenceAngles = d3.select(this).data()[0];
									if (angle > referenceAngles.startAngle && angle < referenceAngles.endAngle) {	
										nodeData = d3.select(node).data();
										if (d.data.month) {
											nodeData[0].month = d.data.month;
										}
										if (d.data.days) {
											dayData = populateDayData(+d.data.days);
											addDays();
											nodeData[0].day = 1;
										}
										highlightTick("#month-" + d.data.month, fontSizeLarge);
										return "true";
									} else {
										return "false";
									}
								} else {
									return "false";
								}
							});
					} else {
						removeTickHighlight(".day-tick", fontSizeSmall);
						d3.selectAll(".day-slice")
							.attr("selected", "false")
							.attr("selected", function(d, i) {
								removeTickHighlight("#day-" + d.data.day, fontSizeSmall);
								if (this !== node) {
									otherBox = this.getBBox();
									d_from_origin = Math.sqrt(Math.pow(d3.event.x, 2) + Math.pow(d3.event.y, 2));
									alpha = Math.acos(d3.event.x / d_from_origin);
									xVal = d3.event.y < 0 ? -innerRadius * Math.sin(alpha) : innerRadius * Math.sin(alpha);
									yVal = innerRadius * Math.cos(alpha);
									angle = Math.atan2(yVal, 0 - xVal);
									if (nodeBox.x <= 0) { angle = (Math.PI * 2) + angle; }
									referenceAngles = d3.select(this).data()[0];
									if (angle > referenceAngles.startAngle && angle < referenceAngles.endAngle) {
										nodeData = d3.select(node).data();
										if (d.data.day) {
											nodeData[0].day = d.data.day;
										}
										highlightTick("#day-" + d.data.day, fontSizeBase);
										return "true";
									} else {
										return "false";
									}
								} else {
									return "false";
								}
							});
					}
				}
					
				/* DAY SLIDER */
				function populateDayData(n) {
					return Array.apply(null, { length: n }).map(Number.call, Number).map(function(i) { return { "day": i + 1 }; });
				}
				
				function addDays() {
					
					d3.select("#dayContainer").remove();
					var dayContainer = svg.append("g")
						.attr("id", "dayContainer")
						.data([dayData]);
						
					var dayLayout = d3.layout.pie()
						.value(function() { return 1; })
						.sort(function(a, b) { return d3.ascending(+a.day, +b.day); });
					
					d3.selectAll(".day-slice").remove();					
					var dayArcs = dayContainer.selectAll("g.day-slice")
						.data(dayLayout)
						.enter()
						.append("svg:g")
						.attr("id", function(d, i) { return "day-slice-" + dayData[i].day; })
						.attr("class", "day-slice");
					d3.select("#day-slice-1").attr("selected", "true");
					highlightTick("#day-1", fontSizeBase);
					
					var dayArcFunction = d3.svg.arc().outerRadius(innerRadius);
					dayArcs.append("svg:path").attr("d", dayArcFunction); 
					
					d3.selectAll(".day-tick").remove();
					dayArcs.append("svg:text")
						.attr("id", function(d, i) { return "day-" + dayData[i].day; })
						.attr("class", "day-tick")
						.attr("transform", function(d) {
							d.outerRadius = innerRadius + dayTickBufferOuter;
							d.innerRadius = innerRadius + dayTickBufferInner;
							return "translate(" + dayArcFunction.centroid(d) + ")";
						})
						.attr("text-anchor", "middle")
						.style("fill", fillDefault)
						.style("font", fontSizeSmall + " " + fontDefault)
						.text(function(d, i) { return dayData[i].day; });
					
					d3.select("#day-circle").remove();
					var innerCircle = dayContainer.append("svg:circle")
						.attr("r", innerRadius)
						.attr("id", "day-circle")
						.attr("class", "circumference");
						
					d3.select("#day-handle").remove();
					var innerHandle = dayContainer.append("svg:g")
						.attr("id", "day-handle")
						.attr("class", "dot")
						.selectAll("circle")
						.data([{
							x: 0,
							y: -innerRadius,
							day: 1
						}])
						.enter()
						.append("circle")
						.attr("id", "day-handle-circle")
						.attr("r", 6)
						.attr("cx", 0)				
						.attr("cy", -innerRadius)
						.call(d3.behavior.drag()
							.origin(function(d) { return d; })
							.on("drag", function (d) {    
								var d_from_origin = Math.sqrt(Math.pow(d3.event.x, 2) + Math.pow(d3.event.y, 2));
								var alpha = Math.acos(d3.event.x / d_from_origin);
								d3.select(this)
									.attr("cx", d.x = innerRadius * Math.cos(alpha))
									.attr("cy", d.y = d3.event.y < 0 ? -innerRadius * Math.sin(alpha) : innerRadius * Math.sin(alpha))
									.call(collisionDetection);
							})
							.on("dragend", dispatch.customMovement)
						);
				}
				
				/* CLOCK TEXT */
				var textContainer = d3.select("#textContainer")
					.style("left", (window.innerWidth - textContainerWidth) / 2 + "px");
				
				window.addEventListener("resize", function() {
					d3.select("#textContainer").style("left", (window.innerWidth - textContainerWidth) / 2 + "px");
				});
				
				textContainer.append("div")
					.attr("id", "text-hour")
					.data([{
						hour: "12"
					}])
					.attr("class", "text")
					.text("12")
					.on("mousedown", function() {	
						var windowObject = d3.select(window).on("mousemove", update).on("mouseup", clear);
						var node = d3.select("#text-hour");
						function update() {
							node.classed("active", true);
							var nodeData = node.data();
							var hour = parseInt(nodeData[0].hour, 10);
							if (d3.event.movementY < 0) {
								hour++;
								if (hour > 12) { hour = "01"; }
							} else {
								hour--;
								if (hour < 1) { hour = "12"; }
							}
							if (("" + hour).length < 2) { hour = "0" + hour; }
							node.text(hour);
							nodeData[0].hour = "" + hour;
						}
						function clear() { 
							node.classed("active", false);
							windowObject.on("mousemove", null).on("mouseup", null); 
						}
					})
					.on("mousemove", dispatch.customMovement)
					.on("mouseleave", dispatch.customMovement);
					
				textContainer.append("div")
					.attr("class", "text")
					.text(":");
				
				textContainer.append("div")
					.attr("id", "text-minutes")
					.data([{
						minutes: "01"
					}])
					.attr("class", "text")
					.text("01")
					.on("mousedown", function() {	
						var windowObject = d3.select(window).on("mousemove", update).on("mouseup", clear);
						var node = d3.select("#text-minutes");
						function update() {
							node.classed("active", true);							
							var nodeData = node.data();
							var minutes = parseInt(nodeData[0].minutes, 10);
							if (d3.event.movementY < 0) {
								minutes++;
								if (minutes > 59) { minutes = "00"; }
							} else {
								minutes--;
								if (minutes < 0) { minutes = "59"; }
							}
							if (("" + minutes).length < 2) { minutes = "0" + minutes; }
							node.text(minutes);
							nodeData[0].minutes = "" + minutes;
						}
						function clear() { 
							node.classed("active", false);
							windowObject.on("mousemove", null).on("mouseup", null); 
						}
					})
					.on("mousemove", dispatch.customMovement)
					.on("mouseleave", dispatch.customMovement);
					
				textContainer.append("div")
					.attr("id", "text-ampm")
					.data([{
						ampm: "PM"
					}])
					.attr("class", "text ampm")
					.text("PM")
					.on("mousedown", function() {	
						var windowObject = d3.select(window).on("mousemove", update).on("mouseup", clear);
						var node = d3.select("#text-ampm");
						function update() {
							node.classed("active", true);
							var nodeData = node.data();
							var ampm = nodeData[0].ampm;
							if (ampm === "PM") {
								ampm = "AM";
							} else {
								ampm = "PM";
							}
							node.text(ampm);
							nodeData[0].ampm = ampm;
						}
						function clear() { 
							node.classed("active", false);
							windowObject.on("mousemove", null).on("mouseup", null); 
						}
					})
					.on("mousemove", dispatch.customMovement)
					.on("mouseleave", dispatch.customMovement);
			});
		}
		d3.rebind(exports, dispatch, "on");
		return exports;
	}
};
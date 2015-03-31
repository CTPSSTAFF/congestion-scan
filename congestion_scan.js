// JavaScript Document
var CTPS = {};
CTPS.scanApp = {};
CTPS.scanApp.googleAuthURL = "https://accounts.google.com/o/oauth2/auth";
CTPS.scanApp.client_id = "503300089620-qnibfgon758ndl97cocv321lgkdujbnc.apps.googleusercontent.com";
CTPS.scanApp.project_id = "ctps-traffic-1";
CTPS.scanApp.redirect_uri = encodeURIComponent("http://bostonmpo.org/apps/congestion_scan/congestion_scan.html");
CTPS.scanApp.scope = 'https://www.googleapis.com/auth/bigquery';
CTPS.scanApp.query = {};
CTPS.scanApp.query.szFieldList = "geo.TMC AS tmc, [from], [to], route_number, route_name, direction, segment_begin, segment_end, " + 
								"[month], [day], [hour], [minute], speed, confidence_score, c_value ";
CTPS.scanApp.query.arrTables = ["I90_D3_Demo.CMP_Expressway_Segment_Data",
							   "INRIX_2012_Quarter1.INRIX_2012_Quarter1_All",
							   "INRIX_2012_Quarter2.INRIX_2012_Quarter2_All",
							   "INRIX_2012_Quarter3.INRIX_2012_Quarter3_All",
							   "INRIX_2012_Quarter4.INRIX_2012_Quarter4_All"];
CTPS.scanApp.query.szWhereQualityClause = "confidence_score >= 20 and c_value >= 75";

CTPS.scanApp.arrRouteList = [{"label": "I-90", "value": "I-90", "dir": "East-West"}, 
							 {"label": "I-93", "value": "I-93", "dir": "North-South"}, 
							 {"label": "I-95", "value": "I-95", "dir": "North-South"},
							 {"label": "I-290", "value": "I-290", "dir": "East-West"},
							 {"label": "I-495", "value": "I-495", "dir": "North-South"}, 
							 {"label": "Route 1", "value": "US-1", "dir": "North-South"},
							 {"label": "Route 2", "value": "MA-2", "dir": "East-West"},
							 {"label": "Route 3 (MA)", "value": "MA-3", "dir": "North-South"},
							 {"label": "Route 3 (US)", "vaulue": "US-3", "dir": "North-South"},
							 {"label": "Route 24", "value": "MA-24", "dir": "North-South"},
							 {"label": "Route 128", "value": "MA-128", "dir": "North-South"}
							 ]
CTPS.scanApp["East-West"] = ["Eastbound", "Westbound"];
CTPS.scanApp["North-South"] = ["Northbound", "Southbound"];

CTPS.scanApp.handleClientLoad = function() {
	$('#loadingDiv').show();
	window.setTimeout(CTPS.scanApp.checkAuth,1);
};

CTPS.scanApp.checkAuth = function() {
	gapi.auth.authorize({"client_id": CTPS.scanApp.client_id,
						 "scope": CTPS.scanApp.scope, 
						 "immediate": true}, 
						 CTPS.scanApp.handleAuthResult);
}

CTPS.scanApp.handleAuthResult = function(authResult) {
	if (authResult && !authResult.error) {
		$('#loginDiv').hide();
		$('#logoutFrame').load(function() { window.location.reload(); });
		$('#logoutLink').click(function() { document.getElementById('logoutFrame').src = "https://www.google.com/accounts/Logout"; });
		$('#logoutDiv').css("visibility", "visible");
		$('#loadingDiv').show();
		gapi.client.load('bigquery', 'v2', CTPS.scanApp.handleBigQueryAPILoad());
	} else {
		$('#authorize-button').click(CTPS.scanApp.handleAuthClick);
		$('#loadingDiv').hide();
		$('#loginDiv').show();
	}
}

CTPS.scanApp.handleAuthClick = function(event) {
	$('#loginDiv').hide();
	gapi.auth.authorize({"client_id": CTPS.scanApp.client_id, 
						 "scope": CTPS.scanApp.scope, 
						 "immediate": false}, 
						CTPS.scanApp.handleAuthResult);
	return false;
}

CTPS.scanApp.handleBigQueryAPILoad = function() {
	$('#loadingDiv').hide();
	$('#loginDiv').hide();
	$('#theQuery').val(CTPS.scanApp.sampleQuery);
	$('#querySubmit').click(CTPS.scanApp.initiateQuery);
	CTPS.scanApp.initializeQueryUI();
}
CTPS.scanApp.initializeQueryUI = function() {
	$('#queryRoute').autocomplete({ "source": CTPS.scanApp.arrRouteList,
								    "minLength": 0,
									"autoFocus": true,
									"change": CTPS.scanApp.makeQueryString,
								    "select": function(e, ui) {
										CTPS.scanApp.makeQueryString();
										$('#queryRouteDir').val('');
										$('#queryRouteDir').autocomplete({"source": CTPS.scanApp[ui.item.dir],
																								 "autoFocus": true,
																								 "minLength": 0,
																								 "change": CTPS.scanApp.makeQueryString});
										$('#queryRouteDir').focus(function() { $('#queryRouteDir').autocomplete("search", ""); });
										}});
	$('#queryRoute').focus(function() { $('#queryRoute').autocomplete("search", ""); });
	$('#queryIsConfidenceFilter').change(CTPS.scanApp.makeQueryString);
	$('#queryHourSpec').focus(function() { $('#queryHour').prop("checked","checked"); });
	$('#queryHourSpec').change(function() { if(!$('#queryHour').prop("checked")) $('#queryHourSpec').val(""); CTPS.scanApp.makeQueryString() });
	$('#queryPeakAM').change(CTPS.scanApp.makeQueryString);
	$('#queryPeakPM').change(CTPS.scanApp.makeQueryString);
	$('#queryHourSpec').spinner({ "minValue": 1,
								"maxValue": 24,
								"change": function(e) {
									if (!parseInt(e.target.value)) e.target.value = 1;
									CTPS.scanApp.makeQueryString();
								}
								});
	$('#queryDate').datepicker({ "dateFormat": "mm/dd/yy", 
							   "constrainInput": true, 
							   "minDate": "01/01/12",
							   "maxDate": "12/31/12",
							   "defaultDate": "01/01/12",
							   "changeMonth": true,
							   "numberOfMonths": 1 });
	$('#queryDate').change(function(e) {
									var dateField = new Date(e.target.value), dateMin = new Date("01/01/12"), dateMax = new Date("12/31/12");
									if (dateField > dateMax) e.target.value = "12/31/2012"
									else if (dateField < dateMin) e.target.value = "01/01/2012";
									CTPS.scanApp.makeQueryString();
									});
	$('#queryDiv').show();
	$('#resultTabsDiv').tabs();
}

CTPS.scanApp.makeQueryString = function() {
	var szQuery = "SELECT " + CTPS.scanApp.query.szFieldList + " \n\nFROM ", szWhereClause = "";
	var oDate, iQuarter = 0, szHourRangeOption = $(":checked[name=queryPeriod]")[0].id;
	
	// add FROM tables
	if ($('#queryDate').val()) {
		oDate = new Date($('#queryDate').val());
		iQuarter = Math.floor(oDate.getMonth() / 3) + 1;
		szQuery += CTPS.scanApp.query.arrTables[iQuarter] + " AS data JOIN ";
	}
	szQuery += CTPS.scanApp.query.arrTables[0] + " AS geo " + (iQuarter ? " ON data.tmc = geo.TMC ": "");
	
	// construct WHERE clause, if specified
	szWhereClause += (oDate ? ("[month] = " + (oDate.getMonth() + 1) + " AND [day] = " + oDate.getDate()): "");
	// hour range specification depends on radio option selected
	if (szHourRangeOption == "queryHour") {
		szWhereClause += ($('#queryHourSpec').val() ? (szWhereClause ? " AND " : "") + "[hour] = " + $('#queryHourSpec').val(): "");
	} else if (szHourRangeOption == "queryPeakAM") {
		szWhereClause += (szWhereClause ? " AND " : "") + "[hour] BETWEEN 6 AND 9";
	} else {
		szWhereClause += (szWhereClause ? " AND " : "") + "[hour] BETWEEN 16 AND 19";
	}
	szWhereClause += ($('#queryRoute').val() ? (szWhereClause ? " AND " : "") + "Route_Number = '" + $('#queryRoute').val() + "'": "");
	szWhereClause += ($('#queryRouteDir').val() ? (szWhereClause ? " AND " : "") + "Direction = '" + $('#queryRouteDir').val() + "'": "");
	szWhereClause += ($('#queryIsConfidenceFilter').prop("checked") ? (szWhereClause ? " AND " : "") + CTPS.scanApp.query.szWhereQualityClause: "");
	szQuery += (szWhereClause ? "\n\nWHERE " + szWhereClause : "");
	
	// add fixed SORT BY clause
	szQuery += " \n\nORDER BY [from], [month], [day], [hour], [minute]"
	$('#theQuery').val(szQuery)
}

CTPS.scanApp.isQueryLimited = function() {
	return $('#theQuery').val().toUpperCase().indexOf("WHERE ") != -1
}

CTPS.scanApp.initiateQuery = function() {
	if (CTPS.scanApp.isQueryLimited()) {
		$('#resultHeadingDiv').html('');
		$('#querySubmit').prop('disabled', true);
		var request = gapi.client.bigquery.jobs.query({
			"projectId": CTPS.scanApp.project_id,
			"kind": "bigquery#queryRequest",
			"query": $('#theQuery').val(),
			"maxResults": 10000,
			"timeoutMs": 10000,
			"dryRun": false,
			"useQueryCache": true
		});
		request.then(
			CTPS.scanApp.handleQueryResults, // function that executes if the request succeeds in some way
			function(resp) {				 // function that executes if the request fails altogether
				console.log(resp);
				$('#resultTabsDiv').hide();
				$('#resultHeadingDiv').html('<h1>The query attempt failed.</h1><h2>Returned error message</h2>' + resp.result.error.message);
				$('#querySubmit').prop('disabled', false);
				CTPS.scanApp.clearOnScreenTimer();
			});
		CTPS.scanApp.initOnScreenTimer();
	} else {
		$('#resultTabsDiv').hide();
		$('#resultHeadingDiv').html("<h1>The query was not attempted.</h1><h2>Too many results expected</h2>" + 
									"Your query's WHERE clause is not restrictive enough or is missing.<br>Make sure the location and temporal parameters are all specified.");
	}
	return false;
}

CTPS.scanApp.initOnScreenTimer = function() {
	$('#onScreenTimer').html('Timing response time...');
	window.setTimeout(CTPS.scanApp.continueOnScreenTimer, 1000);
}

CTPS.scanApp.continueOnScreenTimer = function() {
	if($('#onScreenTimer').html().length) {
		window.setTimeout(CTPS.scanApp.continueOnScreenTimer, 1000);
		if($('#timerElapsedSeconds').length == 0) {
			$('#onScreenTimer').html('Query sent <span id="timerElapsedSeconds">1</span> second ago.');
		} else {
			$('#onScreenTimer').html('Query sent <span id="timerElapsedSeconds">' + String(parseInt($('#timerElapsedSeconds').text(),10) + 1) + ' seconds ago.');
		}
	}
}

CTPS.scanApp.clearOnScreenTimer = function() {
	$('#onScreenTimer').html('');
}

CTPS.scanApp.handleQueryResults = function(resp) {
	CTPS.scanApp.clearOnScreenTimer();
	$('#querySubmit').prop('disabled', false);
	
	if (!resp.result.jobComplete) {
		$('#resultTabsDiv').hide();
		$('#resultHeadingDiv').html("<h1>The query is executing with job ID " + resp.result.jobReference.jobId + ", but is not yet complete.</h1>");
	} else {
		CTPS.scanApp.displayQueryResults(resp);
		$('#resultTabsDiv').show();
	}
}

CTPS.scanApp.displayQueryResults = function(resp) {
	// here's the most likely place to hook in Mark's D3 code.
	// For example, comment out the call the displays the plain-Jane table and insert a call to Mark's code
	function makeGettersFromSchema(schema) {
		var getters = {};
		var i;;
		var fields = schema.fields;
		for (i = 0; i < fields.length; i++) {
			getters[fields[i].name] = new Function("row", "{ return row.f[" + i + "].v; };");
		}
		return getters;
	}

	var getters = makeGettersFromSchema(resp.result.schema);
	createViz(resp.result.rows, getters);
	CTPS.scanApp.displayResultTable(resp);
}

function createViz(data, getters) {

		var metersMile = 1609.34;
			
		/* Axes */

		var xAxisStart = 0;
			
		var xAxisEnd = 60;			
		
		var axisXScale = d3.scale.linear()
            .domain([xAxisStart,xAxisEnd])
            .range([0,1200]);
			
		var xAxis = d3.svg.axis()
			.scale(axisXScale)
			.orient('bottom');
			
		var yAxisStart = (d3.min(data, function(d) { return(+getters.from(d)); })/metersMile);
			
		var yAxisEnd = (d3.max(data, function(d) { return(+getters.to(d)); })/metersMile);	
				
		var axisYScale = d3.scale.linear()
            .domain([yAxisStart,yAxisEnd])
            .range([0,-550]);
			
		var yAxis = d3.svg.axis()
			.scale(axisYScale)
			.orient("left");
		
		var routeBeginMarker = (d3.min(data, function(d) {return(+getters.from(d)); })/metersMile);		
		var routeEndMarker = (d3.max(data, function(d) { return(+getters.to(d)); })/metersMile);
		var routeLength = routeEndMarker - routeBeginMarker	

		var svgContainer = d3.select('#vizDiv').html('')
			.append('svg')
				.attr('width', 1270)
				.attr('height',620)
			.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(40,550)")
				.call(xAxis)				
			.append("g")
				.attr("class", "y axis")
				.call(yAxis);
				
		var xAxisText = "Minutes";	
		var yAxisText = "Miles";			
				
		svgContainer.append("text")
			.attr("class", "label")
			.attr("x", 600)
			.attr("y", 40)
			.style("text-anchor", "end")
			.text(xAxisText);

		svgContainer.append("text")
			.attr("transform", "rotate(-90)")
			.attr("x", 310) 
			.attr("y", -30)
			.style("text-anchor", "end")
			.text(yAxisText);
		
		/* var colorThreshold = d3.scale.threshold()
			.domain([24.99, 34.99, 45, 50, 55, 999])
			.range(["rgb(0,0,115)", "rgb(153,0,247)", "rgb(255,0,0)", "rgb(245,150,0)", "rgb(245,240,0)", "rgb(130,255,46)"]);	*/

		var colorThreshold = d3.scale.threshold()
			.domain([25, 45, 999])
			.range(["rgb(255,0,0)", "rgb(255,195,77)", "rgb(130,255,46)"]);			

		var rectangle = svgContainer.selectAll('rect')
			.data(data)
			.enter()
				.append('rect')
				.attr('x', function(d) {return 0+(+getters.minute(d)*20);})
				/* 	Find end of route segment location as percentage of total route length
						( segment "to" mile marker - route begin mile marker) / total route length 
					Then multiply by y axis height to find chart location of top of route segment band
						(negative offset from bottom of y axis) */
				.attr('y', function(d) {return -550*(((+getters.to(d)/metersMile) - routeBeginMarker)/routeLength);})
				.attr('width', 20)
				/* 	Find route segment length as percentage of total route length
						( segment "to" mile marker - segment "from" mile marker) / total route length 
					Then multiply by y axis height to the height of the route segment band
						(positive offset from the top of segment band on y axis) */				
				.attr('height', function(d) {return (((+getters.to(d)/metersMile) - (+getters.from(d)/metersMile))/routeLength)*550;})
				.style("fill", function(d) { return colorThreshold(+getters.speed(d)); });
}

CTPS.scanApp.displayResultTable = function(resp) {
	$('#resultHeadingDiv').html('<h1>Query results</h1>');
	$('#tableDiv').html('<table id="ResultTable"><thead><tr id="TableHeaderRow"></tr></thead><tbody id="TableBody"></tbody></table>');
	for (i=0; i<resp.result.schema.fields.length; i++) {
		$('#TableHeaderRow').append('<th>' + resp.result.schema.fields[i].name + '</th>');
	}
	for (j=0; j<resp.result.rows.length; j++) {
		szRowHTML = '';
		for (i=0; i<resp.result.rows[j].f.length; i++) {
			szRowHTML += '<td>' + resp.result.rows[j].f[i].v + '</td>';
		}
	$('#TableBody').append('<tr>' + szRowHTML + '</tr>');
	}
}
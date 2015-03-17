// JavaScript Document
var CTPS = {};
CTPS.scanApp = {};
CTPS.scanApp.googleAuthURL = "https://accounts.google.com/o/oauth2/auth";
CTPS.scanApp.client_id = "503300089620-qnibfgon758ndl97cocv321lgkdujbnc.apps.googleusercontent.com";
CTPS.scanApp.project_id = "ctps-traffic-1";
CTPS.scanApp.redirect_uri = encodeURIComponent("http://bostonmpo.org/apps/congestion_scan/congestion_scan.html");
CTPS.scanApp.scope = 'https://www.googleapis.com/auth/bigquery';
CTPS.scanApp.sampleQuery = "SELECT geo.TMC AS tmc, " +
							"[from], [to], " +
							"route_number, route_name, direction, segment_begin, segment_end, " +
							"[month], [day], [hour], [minute], speed, confidence_score, c_value " +
							"FROM INRIX_2012_Quarter2.INRIX_2012_Quarter2_All AS data JOIN I90_D3_Demo.CMP_Expressway_Segment_Data AS geo ON data.tmc = geo.TMC " +
							"WHERE [month] = 4 AND [day] = 3 AND [hour] = 8 AND [minute] < 10 AND Route_Number = 'I-90' AND Direction = 'Eastbound'";

CTPS.scanApp.handleClientLoad = function() {
	window.setTimeout(CTPS.scanApp.checkAuth,1);
};

CTPS.scanApp.checkAuth = function() {
	gapi.auth.authorize({"client_id": CTPS.scanApp.client_id,
						 "scope": CTPS.scanApp.scope, 
						 "immediate": true}, 
						 CTPS.scanApp.handleAuthResult);
}

CTPS.scanApp.handleAuthResult = function(authResult) {
	var authorizeButton = document.getElementById('authorize-button');
	if (authResult && !authResult.error) {
		authorizeButton.style.visibility = 'hidden';
		gapi.client.load('bigquery', 'v2', CTPS.scanApp.handleBigQueryAPILoad());
	} else {
		authorizeButton.style.visibility = '';
		authorizeButton.onclick = CTPS.scanApp.handleAuthClick;
	}
}

CTPS.scanApp.handleAuthClick = function(event) {
	gapi.auth.authorize({"client_id": CTPS.scanApp.client_id, 
						 "scope": CTPS.scanApp.scope, 
						 "immediate": false}, 
						CTPS.scanApp.handleAuthResult);
	return false;
}

CTPS.scanApp.handleBigQueryAPILoad = function() {
	$('#theQuery').val(CTPS.scanApp.sampleQuery);
	$('#querySubmit').click(CTPS.scanApp.initiateQuery);
	$('#queryDiv').show();
}

CTPS.scanApp.initiateQuery = function() {
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
			$('#resultDiv').html('<h1>The query attempt failed.</h1><h2>Returned error message</h2>' + resp.result.error.message);
			$('#querySubmit').prop('disabled', false);
			CTPS.scanApp.clearOnScreenTimer();
		});
	CTPS.scanApp.initOnScreenTimer();
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
	console.log(resp);
	
	CTPS.scanApp.clearOnScreenTimer();
	$('#querySubmit').prop('disabled', false);
	
	if (!resp.result.jobComplete) {
		$('#resultDiv').html("<h1>The query is executing with job ID " + resp.result.jobReference.jobId + ", but is not yet complete.</h1>");
	} else {
		CTPS.scanApp.displayQueryResults(resp);
	}
}

CTPS.scanApp.displayQueryResults = function(resp) {
	// here's the most likely place to hook in Mark's D3 code.
	// For example, comment out the call the displays the plain-Jane table and insert a call to Mark's code
	CTPS.scanApp.displayResultTable(resp);
}

CTPS.scanApp.displayResultTable = function(resp) {
	$('#resultDiv').html('<h1>Query results</h1><table id="ResultTable"><thead><tr id="TableHeaderRow"></tr></thead><tbody id="TableBody"></tbody></table>');
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
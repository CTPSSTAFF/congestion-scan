// JavaScript Document
var CTPS = {};
CTPS.scanApp = {};
CTPS.scanApp.googleAuthURL = "https://accounts.google.com/o/oauth2/auth";
CTPS.scanApp.client_id = "503300089620-qnibfgon758ndl97cocv321lgkdujbnc.apps.googleusercontent.com";
CTPS.scanApp.project_id = "ctps-traffic-1";
CTPS.scanApp.redirect_uri = encodeURIComponent("http://bostonmpo.org/apps/congestion_scan/congestion_scan.html");
CTPS.scanApp.scope = 'https://www.googleapis.com/auth/bigquery';

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
		CTPS.scanApp.initiateQuery();
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

CTPS.scanApp.initiateQuery = function() {
	szQuery = "SELECT segment_begin, segment_end, sort_key, [month], [day], [hour], [minute], speed, avg_speed, confidence_score " +
				"FROM INRIX_2012_Quarter2.INRIX_2012_Quarter2_All AS data JOIN INRIX_2012_General.INRIX_2012_TMC_Lookup AS geo ON data.tmc = geo.tmc " +
				"WHERE [month] = 4 AND [day] = 3 AND [hour] = 8 AND [minute] < 10 AND road_number = 'I-90' AND direction = 'Eastbound'";
	gapi.client.load('bigquery', 'v2', function() {
		var request = gapi.client.bigquery.jobs.query({
			"projectId": CTPS.scanApp.project_id,
			"kind": "bigquery#queryRequest",
			"query": szQuery,
			"maxResults": 10000,
			"timeoutMs": 10000,
			"dryRun": false,
			"useQueryCache": true
		});
		request.then(
			function(resp) {
				console.log(resp);
				if (!resp.result.jobComplete) {
					alert("The query is executing with job ID " + resp.result.jobReference.jobId + ", but is not yet complete.");
				} else {
					$('body').append('<table id="ResultTable"><thead><tr id="TableHeaderRow"></tr></thead><tbody id="TableBody"></tbody></table>');
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
			},
			function(resp) {
				alert("Unfortunately the query attempt did not succeed.");
			});
	});
}

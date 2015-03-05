// JavaScript Document
var CTPS = {};
CTPS.scanApp = {};
CTPS.scanApp.googleAuthURL = "https://accounts.google.com/o/oauth2/auth";
CTPS.scanApp.client_id = "503300089620-qnibfgon758ndl97cocv321lgkdujbnc.apps.googleusercontent.com";
CTPS.scanApp.redirect_uri = encodeURIComponent("http://bostonmpo.org/apps/congestion_scan/congestion_scan.html");
CTPS.scanApp.scope = encodeURIComponent("email profile");

CTPS.scanApp.init = function() {
	// First, parse the query string
	var params = {}, queryString = location.hash.substring(1),
		regex = /([^&=]+)=([^&]*)/g, m;
		
	if (!queryString) {	// if there's no hash fragment in the URL, then we haven't been redirected here from Google sign-in/authorization yet
						// so redirect there now
		$('body').append('<h1>Login required. Redirecting to Google...</h1>');
		window.location = CTPS.scanApp.googleAuthURL + 
							"?response_type=token" +
							"&client_id=" + CTPS.scanApp.client_id +
							"&scope=" + CTPS.scanApp.scope + 
							"&redirect_uri=" + CTPS.scanApp.redirect_uri;
		
	} else {			// if there's a hash fragment in the URL, then we've been redirected here from Google sign-in/authorization,
						// hopefully with a token that can be used with BigQuery API calls against our data
		$('body').append('<h1>Parameters returned in "fragment"</h1><table id="fragParms"></table>');
		while (m = regex.exec(queryString)) {
		  params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
		  $('#fragParms').append('<tr><td>' + decodeURIComponent(m[1]) + '</td><td>' + decodeURIComponent(m[2]) + '</td></tr>');
		}
	}
	
};

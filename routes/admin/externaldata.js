var express = require("express");
var router = express.Router();

////////////////////////
// Events by year
////////////////////////

router.get("/events", function(req, res) {
	if(!require('../checkauthentication')(req, res, 'admin'))
		return null;
	
	var thisFuncName = "externaldata.events[get]: ";
	console.log(thisFuncName + 'ENTER')
	
	var events = {};
	
    // Set our internal DB variable
    var db = req.db;

    // Get our query value(s)
    var year = req.query.year;
	if (!year)
	{
		year = (new Date()).getFullYear();
		console.log(thisFuncName + 'No year specified, defaulting to ' + year);
	}
	console.log(thisFuncName + 'Year: ' + year);

	// Read events from DB for specified year
	var eventCol = db.get("events");
	eventCol.find({"year": parseInt(year)},{sort: {"start_date": 1, "end_date": 1, "name": 1}}, function(e, docs){
		
		if(e){ //if error, log to console
			console.log(e);
		}
		events = docs;
		
		// Read unique list of years in DB
		var uniqueYears;
		eventCol.distinct("year", function(e, docs) {
			uniqueYears = docs.sort();
			console.log(thisFuncName + "uniqueYears=" + uniqueYears);
			
			res.render("./events", {
				title: "Events",
				"events": events,
				"years": uniqueYears,
				"selectedYear": year
			});
		});
	});
	
	// Send to Pug page to display
	//res.render("./events?year=" + year);
});

router.post("/events", function(req, res) {
	if(!require('../checkauthentication')(req, res, 'admin'))
		return null;
	
	var thisFuncName = "externaldata.events[post]: ";
	console.log(thisFuncName + 'ENTER')
	
    // Set our internal DB variable
    var db = req.db;
	var eventCol = db.get("events");

    // Get our form value(s)
    var year = req.body.year;

	console.log(thisFuncName + 'year=' + year);
	
	// nodeclient from earlier?
	var Client = require('node-rest-client').Client;
	var client = new Client();
	
//		path: { "year" : year },
	var args = {
		headers: { "accept": "application/json", "X-TBA-Auth-Key": "iSpbq2JH2g27Jx2CI5yujDsoKYeC8pGuMw94YeK3gXFU6lili7S2ByYZYZOYI3ew" }
	}
	var url = "https://www.thebluealliance.com/api/v3/events/" + year + "/simple";
	console.log(thisFuncName + "url=" + url);
	
	// Read unique list of years in DB
	var uniqueYears;
	eventCol.distinct("year", function(e, docs) {
		uniqueYears = docs.sort();
	
		client.get(url, args, function (data, response) {
			var array = JSON.parse(data);
			var arrayLength = array.length;
			if (arrayLength == null)
			{
				console.log(thisFuncName + "Whoops, there was an error!")
				console.log(thisFuncName + "data=" + data);
				year = (new Date()).getFullYear();
				
				res.render("./events", {
					title: "Events",
					"years": uniqueYears,
					"selectedYear": year
				});
			}
			else
			{
				console.log(thisFuncName + 'Found ' + arrayLength + ' data for year ' + year);
				//console.log(thisFuncName + 'Stringify array: ' + JSON.stringify(array));
				
				// First delete existing event data for the given year
				eventCol.remove({"year": parseInt(year)}, function(e, docs) {
					// Now, insert the new data
					eventCol.insert(array, function(e, docs) {
						// Then read it back in order
						eventCol.find({"year": parseInt(year)},{sort: {"start_date": 1, "end_date": 1, "name": 1}}, function(e, docs){
							var eventData = docs;
							
							// Re-read the unique years (in case we just added a new one)
							eventCol.distinct("year", function(e, docs) {
								uniqueYears = docs.sort();

								res.render("./events", {
									title: "Events",
									"events": eventData,
									"years": uniqueYears,
									"selectedYear": year
								});
							});
						});
					});
				});
			}
		});
	});
});

////////////////////////
// Matches by event
////////////////////////

router.get("/matches", function(req, res) {
	if(!require('../checkauthentication')(req, res, 'admin'))
		return null;
	
	var thisFuncName = "externaldata.matches[get]: ";
	console.log(thisFuncName + 'ENTER')
	
	var matches = {};
	
    // Set our internal DB variable
    var db = req.db;

    // Get our query value(s)
    var eventId = req.query.eventId;
	if (!eventId)
	{
		console.log(thisFuncName + 'No event specified');
		res.redirect("./events");
	}
	console.log(thisFuncName + 'eventId=' + eventId);

	// Read matches from DB for specified event
	var matchCol = db.get("matches");
	matchCol.find({"event_key": eventId},{sort: {"time": 1}}, function(e, docs){
		
		if(e){ //if error, log to console
			console.log(e);
		}
		matches = docs;
		
		res.render("./matches", {
			title: "Matches",
			"matches": matches
		});
	});
});

router.post("/matches", function(req, res) {
	if(!require('../checkauthentication')(req, res, 'admin'))
		return null;
	
	var thisFuncName = "externaldata.matches[post]: ";
	console.log(thisFuncName + 'ENTER')
	
    // Set our internal DB variable
    var db = req.db;
	var matchCol = db.get("matches");
	var eventCol = db.get("events");

    // Get our form value(s)
    var eventId = req.body.eventId;

	console.log(thisFuncName + 'eventId=' + eventId);
	
	// nodeclient from earlier?
	var Client = require('node-rest-client').Client;
	var client = new Client();
	
	var args = {
		headers: { "accept": "application/json", "X-TBA-Auth-Key": "iSpbq2JH2g27Jx2CI5yujDsoKYeC8pGuMw94YeK3gXFU6lili7S2ByYZYZOYI3ew" }
	}

	var url = "https://www.thebluealliance.com/api/v3/event/" + eventId + "/matches";
	console.log(thisFuncName + "url=" + url);
	
	// Read unique list of years in DB (for redirect)
	var uniqueYears;
	eventCol.distinct("year", function(e, docs) {
		uniqueYears = docs.sort();
	
		client.get(url, args, function (data, response) {
			var array = JSON.parse(data);
			var arrayLength = array.length;
			if (arrayLength == null)
			{
				console.log(thisFuncName + "Whoops, there was an error!")
				console.log(thisFuncName + "data=" + data);
				year = (new Date()).getFullYear();
				
				res.render("./events", {
					title: "Events",
					"years": uniqueYears,
					"selectedYear": year
				});
			}
			else
			{
				console.log(thisFuncName + 'Found ' + arrayLength + ' data for event ' + eventId);
				//console.log(thisFuncName + 'Stringify array: ' + JSON.stringify(array));
				
				// First delete existing match data for the given event
				matchCol.remove({"event_key": eventId}, function(e, docs) {
					// Now, insert the new data
					matchCol.insert(array, function(e, docs) {
						// Then read it back in order
						matchCol.find({"event_key": eventId},{sort: {"time": 1}}, function(e, docs){
							var matches = docs;
							
							res.render("./matches", {
								title: "Events",
								"matches": matches
							});
						});
					});
				});
			}
		});
	});
});

////////////////////////
// Teams by event
////////////////////////

router.get("/teams", function(req, res) {
	if(!require('../checkauthentication')(req, res, 'admin'))
		return null;
	
	var thisFuncName = "externaldata.teams[get]: ";
	console.log(thisFuncName + 'ENTER')
	
	var matches = {};
	
    // Set our internal DB variable
    var db = req.db;

	/*
    // Get our query value(s)
    var eventId = req.query.eventId;
	if (!eventId)
	{
		console.log(thisFuncName + 'No event specified');
		res.redirect("./events");
	}
	console.log(thisFuncName + 'eventId=' + eventId);
	*/
	
	// Read all teams from DB
	var teamCol = db.get("teams");
	teamCol.find({},{sort: {"key": 1}}, function(e, docs){
		
		if(e){ //if error, log to console
			console.log(e);
		}
		teams = docs;
		
		res.render("./teams", {
			title: "Teams",
			"teams": teams
		});
	});
});

router.post("/teams", function(req, res) {
	if(!require('../checkauthentication')(req, res, 'admin'))
		return null;
	
	var thisFuncName = "externaldata.teams[post]: ";
	console.log(thisFuncName + 'ENTER')
	
    // Set our internal DB variable
    var db = req.db;
	var eventCol = db.get("events");
	var teamCol = db.get("teams");

    // Get our form value(s)
    var eventId = req.body.eventId;

	console.log(thisFuncName + 'eventId=' + eventId);

	// nodeclient from earlier?
	var Client = require('node-rest-client').Client;
	var client = new Client();
	
	var args = {
		headers: { "accept": "application/json", "X-TBA-Auth-Key": "iSpbq2JH2g27Jx2CI5yujDsoKYeC8pGuMw94YeK3gXFU6lili7S2ByYZYZOYI3ew" }
	}

	// Read teams from TBA
	var url = "https://www.thebluealliance.com/api/v3/event/" + eventId + "/teams/simple";
	console.log(thisFuncName + "url=" + url);
	
	// Read unique list of years in DB (for redirect)
	var uniqueYears;
	eventCol.distinct("year", function(e, docs) {
		uniqueYears = docs.sort();
	
		client.get(url, args, function (data, response) {
			var array = JSON.parse(data);
			var arrayLength = array.length;
			if (arrayLength == null)
			{
				console.log(thisFuncName + "Whoops, there was an error!")
				console.log(thisFuncName + "data=" + data);
				year = (new Date()).getFullYear();
				
				res.render("./events", {
					title: "Events",
					"years": uniqueYears,
					"selectedYear": year
				});
			}
			else
			{
				var tbaTeams = array;
				//console.log(thisFuncName + "tbaTeamArray=" + JSON.stringify(tbaTeamArray));
				console.log(thisFuncName + 'Found ' + tbaTeams.length + ' teams from TBA for event ' + eventId);
				//for (let team of tbaTeams) { console.log(thisFuncName + 'tbaTeam.key=' + team.key); }
				
				// Read teams from DB
				teamCol.find({},{sort: {"key": 1}}, function(e, docs){
					
					if(e){ //if error, log to console
						console.log(e);
					}
					var dbTeams = docs;
					//console.log(thisFuncName + "dbTeams=" + JSON.stringify(dbTeams));
					console.log(thisFuncName + 'Found ' + dbTeams.length + ' teams in DB');
					//for (let team of dbTeams) { console.log(thisFuncName + 'dbTeam.key=' + team.key); }

					// collect which teams are already in DB
					var dbTeamLookup = {};
					for (var i = 0, len = dbTeams.length; i < len; i++) {
						dbTeamLookup[dbTeams[i].key] = dbTeams[i];
					}
					
					// If any TBA teams are not yet in DB, add them to a new collection for mass insert
					var tbaTeamsInsert = [];
					for (let team of tbaTeams)
					{
						//console.log(thisFuncName + 'tbaTeam.key=' + team.key + '; in dbTeamLookup?=' + dbTeamLookup[team.key]);
						if (!dbTeamLookup[team.key])
						{
							//console.log(thisFuncName + '...adding ' + team.key);
							tbaTeamsInsert.push(team);
						}
					}
					console.log(thisFuncName + 'Found ' + tbaTeamsInsert.length + ' teams to add to DB');
					/*
					for (let team of tbaTeamsInsert)
					{
						console.log(thisFuncName + 'tbaTeamsInsert contains ' + team.key);
					}
					*/

					// insert the new teams
					teamCol.insert(tbaTeamsInsert, function(e, docs) {
						// Re-read and return all teams to client
						teamCol.find({},{sort: {"key": 1}}, function(e, docs){
						
							res.render("./teams", {
								title: "Teams",
								"teams": docs
							});
						});
					});
				});
			}
		});
	});
});

module.exports = router;

var express = require("express");
var router = express.Router();

////////////////////////
// Events by year
////////////////////////

router.get("/events", function(req, res) {
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
			"matches": matches
		});
	});
});

router.post("/matches", function(req, res) {
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
								"matches": matches
							});
						});
					});
				});
			}
		});
	});
});

module.exports = router;

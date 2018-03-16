var express = require('express');
var router = express.Router();

router.get("/matches", function(req, res) {
	var thisFuncName = "current.matches[get]: ";
	console.log(thisFuncName + 'ENTER')
	
    // Set our internal DB variable
    var db = req.db;
	var currentCol = db.get("current");

	// get the 'current' event from DB
	currentCol.find({}, {}, function(e, docs) {
		var noEventFound = 'No event defined';
		var eventId = noEventFound;
		if (docs)
			if (docs.length > 0)
				eventId = docs[0].event;
		if (eventId === noEventFound)
		{
			res.render('./adminindex', { 
				title: 'Admin pages',
				current: eventId
			});
		}
		
		// Read matches from DB for specified event
		var matchCol = db.get("matches");
		matchCol.find({"event_key": eventId},{sort: {"time": 1}}, function(e, docs){
			
			if(e){ //if error, log to console
				console.log(e);
			}
			matches = docs;
			
			res.render("./currentmatches", {
				title: "Matches",
				"matches": matches
			});
		});
	});
});

router.post("/resetmatches", function(req, res) {
	var thisFuncName = "current.resetmatches[post]: ";
	console.log(thisFuncName + 'ENTER')
	
    // Set our internal DB variable
    var db = req.db;
	var currentCol = db.get("current");
	var matchCol = db.get("matches");

	// get the 'current' event from DB
	currentCol.find({}, {}, function(e, docs) {
		var noEventFound = 'No event defined';
		var eventId = noEventFound;
		if (docs)
			if (docs.length > 0)
				eventId = docs[0].event;
		if (eventId === noEventFound)
		{
			res.render('./adminindex', { 
				title: 'Admin pages',
				current: eventId
			});
		}
		
		// update all matches - set 'actualtime' to null/"", and team scores to -1
		matchCol.bulkWrite([{updateMany:{filter:{"event_key": eventId}, update:{ $set: { "actual_time" : "", "winning_alliance" : "", "alliances.blue.score": -1, "alliances.red.score": -1 } }}}], function(e, docs){
			// reread the data & render
			matchCol.find({"event_key": eventId},{sort: {"time": 1}}, function(e, docs){
			
				if(e){ //if error, log to console
					console.log(e);
				}
				matches = docs;
				
				res.render("./currentmatches", {
					title: "Matches",
					"matches": matches
				});
			});
		});
	});		
});

router.post("/updatematch", function(req, res) {
	var thisFuncName = "current.updatematch[post]: ";
	console.log(thisFuncName + 'ENTER')
	
    // Set our internal DB variable
    var db = req.db;
	var matchCol = db.get("matches");
	var currentCol = db.get("current");
	
	var matchId = req.body.matchId;

	// get the 'current' event from DB
	currentCol.find({}, {}, function(e, docs) {
		var noEventFound = 'No event defined';
		var eventId = noEventFound;
		if (docs)
			if (docs.length > 0)
				eventId = docs[0].event;
		if (eventId === noEventFound)
		{
			res.render('./adminindex', { 
				title: 'Admin pages',
				current: eventId
			});
		}
		
		// Delete the matching match record
		matchCol.remove({"key": matchId}, function(e, docs) {
			// Reload the match data from TBA
			var Client = require('node-rest-client').Client;
			var client = new Client();
			
			var args = {
				headers: { "accept": "application/json", "X-TBA-Auth-Key": "iSpbq2JH2g27Jx2CI5yujDsoKYeC8pGuMw94YeK3gXFU6lili7S2ByYZYZOYI3ew" }
			}

			var url = "https://www.thebluealliance.com/api/v3/match/" + matchId;
			console.log(thisFuncName + "url=" + url);
		
			client.get(url, args, function (data, response) {
				var match = JSON.parse(data);
				// stick it in an array so the insert will work later
				var array = [];
				array.push(match);
				
				// Now, insert the new object
				matchCol.insert(array, function(e, docs) {
					// Then read all the matches back in order & redirect
					matchCol.find({"event_key": eventId},{sort: {"time": 1}}, function(e, docs){
						var matches = docs;
						
						res.render("./currentmatches", {
							title: "Matches",
							"matches": matches
						});
					});
				});
			});
		});
	});
});

router.post("/updatematches", function(req, res) {
	var thisFuncName = "current.updatematches[post]: ";
	console.log(thisFuncName + 'ENTER')
	
    // Set our internal DB variable
    var db = req.db;
	var matchCol = db.get("matches");
	var currentCol = db.get("current");
	
	var matchId = req.body.matchId;

	// get the 'current' event from DB
	currentCol.find({}, {}, function(e, docs) {
		var noEventFound = 'No event defined';
		var eventId = noEventFound;
		if (docs)
			if (docs.length > 0)
				eventId = docs[0].event;
		if (eventId === noEventFound)
		{
			res.render('./adminindex', { 
				title: 'Admin pages',
				current: eventId
			});
		}
		
		// nodeclient
		var Client = require('node-rest-client').Client;
		var client = new Client();
		
		var args = {
			headers: { "accept": "application/json", "X-TBA-Auth-Key": "iSpbq2JH2g27Jx2CI5yujDsoKYeC8pGuMw94YeK3gXFU6lili7S2ByYZYZOYI3ew" }
		}
		var url = "https://www.thebluealliance.com/api/v3/event/" + eventId + "/matches";
		console.log(thisFuncName + "url=" + url);
		client.get(url, args, function (data, response) {
			var array = JSON.parse(data);
			var arrayLength = array.length;
			if (arrayLength == null)
			{
				console.log(thisFuncName + "Whoops, there was an error!")
				console.log(thisFuncName + "data=" + data);
				
				res.render('./adminindex', { 
					title: 'Admin pages',
					current: eventId
				});
			}
			else
			{
				console.log(thisFuncName + 'Found ' + arrayLength + ' data for event ' + eventId);
				
				// First delete existing match data for the given event
				matchCol.remove({"event_key": eventId}, function(e, docs) {
					// Now, insert the new data
					matchCol.insert(array, function(e, docs) {
						// Then read it back in order
						matchCol.find({"event_key": eventId},{sort: {"time": 1}}, function(e, docs){
							var matches = docs;
							
							res.render("./currentmatches", {
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

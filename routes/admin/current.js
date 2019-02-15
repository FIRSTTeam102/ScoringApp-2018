var express = require('express');
var router = express.Router();

router.get("/matches", function(req, res) {
	
	if( !require('../checkauthentication')(req, res, 'admin') ){
		return null;
	}

	var thisFuncName = "current.matches[get]: ";
	res.log(thisFuncName + 'ENTER')
	
    // Set our internal DB variable
    var db = req.db;
	var eventId = req.event.key;
		
	// Read matches from DB for specified event
	var matchCol = db.get("matches");
	matchCol.find({"event_key": eventId},{sort: {"time": 1}}, function(e, docs){
		
		if(e){ //if error, log to console
			res.log(e);
		}
		matches = docs;
		
		res.render("./currentmatches", {
			title: "Matches",
			"matches": matches
		});
	});
});

router.get("/getcurrentteams", function(req, res){
	if( !require('../checkauthentication')(req, res, 'admin') ){
		return null;
	}
	
	//set up db collections
	var db = req.db;
	var passwordsCol = db.get("passwords");
	var currentTeamsCol = db.get("currentteams");
	
	//get TBA key from db
	passwordsCol.find({ name:"thebluealliance-args" }, function(e, args){
		if(e || !args[0]){
			return res.status(500).send("couldn't find TBA args in db");
		}
		args = args[0];
		
		//set up tba call
		var Client = require('node-rest-client').Client;
		var client = new Client();
		var eventId = req.event.key;
		var teamsUrl = `https://www.thebluealliance.com/api/v3/event/${eventId}/teams`;
		
		//get teams from tba
		client.get(teamsUrl, args, function (data, response) {
			
			var currentTeams = JSON.parse(data);
			
			if(!currentTeams){
				return res.status(500).send("didn't get teams list");
			}
			
			//delete contents of currentteams
			currentTeamsCol.remove({},function(){
				
				//insert teams into currentteams
				currentTeamsCol.insert(currentTeams, function(){
					res.redirect('/admin?alert=Updated current teams successfully.');
				});
			})
		});
	});
})

router.post("/resetmatches", function(req, res) {
	if( !require('../checkauthentication')(req, res, 'admin') ){
		return null;
	}
	var thisFuncName = "current.resetmatches[post]: ";
	res.log(thisFuncName + 'ENTER');
	
    // Set our internal DB variable
    var db = req.db;
	var matchCol = db.get("matches");
	
	var eventId = req.event.key;
	
	// update all matches - set 'actualtime' to null/"", and team scores to -1
	matchCol.bulkWrite([{updateMany:{filter:{"event_key": eventId}, update:{ $set: { "actual_time" : "", "winning_alliance" : "", "alliances.blue.score": -1, "alliances.red.score": -1 } }}}], function(e, docs){
		// reread the data & render
		matchCol.find({"event_key": eventId},{sort: {"time": 1}}, function(e, docs){
		
			if(e){ //if error, log to console
				res.log(e);
			}
			matches = docs;
			
			res.render("./currentmatches", {
				title: "Matches",
				"matches": matches
			});
		});
	});		
});

router.post("/updatematch", function(req, res) {
	if( !require('../checkauthentication')(req, res, 'admin') ){
		return null;
	}
	var thisFuncName = "current.updatematch[post]: ";
	res.log(thisFuncName + 'ENTER')
	
	var matchId = req.body.matchId;

    // Set our internal DB variable
    var db = req.db;
	var matchCol = db.get("matches");
	var rankCol = db.get("currentrankings");

	// REST client for accessing TBA
	var Client = require('node-rest-client').Client;
	var client = new Client();
	var args = {
		headers: { "accept": "application/json", "X-TBA-Auth-Key": "iSpbq2JH2g27Jx2CI5yujDsoKYeC8pGuMw94YeK3gXFU6lili7S2ByYZYZOYI3ew" }
	}
	
	var eventId = req.event.key;
	
	// While we're here - Get the latest ranking (& OPR data...? maybe not?)
	// https://www.thebluealliance.com/api/v3/event/2018njfla/rankings
	// https://www.thebluealliance.com/api/v3/event/2018njfla/oprs (?)

	// Delete the current rankings
	rankCol.remove({}, function(e, docs) {
		// Reload the rankings from TBA
		var rankingUrl = "https://www.thebluealliance.com/api/v3/event/" + eventId + "/rankings";
		res.log(thisFuncName + "rankingUrl=" + rankingUrl);
	
		client.get(rankingUrl, args, function (data, response) {
			var rankinfo = JSON.parse(data);
			var rankArr = [];
			if (rankinfo)
				rankArr = rankinfo.rankings;
			//res.log(thisFuncName + 'rankArr=' + JSON.stringify(rankArr));

			// Insert into DB
			rankCol.insert(rankArr, function(e, docs) {
			
				// Delete the matching match record
				matchCol.remove({"key": matchId}, function(e, docs) {
					// Reload the match data from TBA
					var url = "https://www.thebluealliance.com/api/v3/match/" + matchId;
					res.log(thisFuncName + "url=" + url);
				
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
	});
});

router.post("/updatematches", function(req, res) {
	if( !require('../checkauthentication')(req, res, 'admin') ){
		return null;
	}
	var thisFuncName = "current.updatematches[post]: ";
	res.log(thisFuncName + 'ENTER')
	
    // Set our internal DB variable
    var db = req.db;
	var matchCol = db.get("matches");
	var rankCol = db.get("currentrankings");
	
	// nodeclient
	var Client = require('node-rest-client').Client;
	var client = new Client();
	var args = {
		headers: { "accept": "application/json", "X-TBA-Auth-Key": "iSpbq2JH2g27Jx2CI5yujDsoKYeC8pGuMw94YeK3gXFU6lili7S2ByYZYZOYI3ew" }
	}
	
	var matchId = req.body.matchId;
	var eventId = req.event.key;
	
	// While we're here - Get the latest ranking (& OPR data...? maybe not?)
	// https://www.thebluealliance.com/api/v3/event/2018njfla/rankings
	// https://www.thebluealliance.com/api/v3/event/2018njfla/oprs (?)

	// Delete the current rankings
	rankCol.remove({}, function(e, docs) {
		// Reload the rankings from TBA
		var rankingUrl = "https://www.thebluealliance.com/api/v3/event/" + eventId + "/rankings";
		res.log(thisFuncName + "rankingUrl=" + rankingUrl);
	
		client.get(rankingUrl, args, function (data, response) {
			var rankinfo = JSON.parse(data);
			var rankArr = [];
			if (rankinfo)
				rankArr = rankinfo.rankings;
			//res.log(thisFuncName + 'rankArr=' + JSON.stringify(rankArr));

			// Insert into DB
			rankCol.insert(rankArr, function(e, docs) {
				// Get matches data from TBA
				var url = "https://www.thebluealliance.com/api/v3/event/" + eventId + "/matches";
				res.log(thisFuncName + "url=" + url);
				client.get(url, args, function (data, response) {
					var array = JSON.parse(data);
					var arrayLength = array.length;
					if (arrayLength == null)
					{
						res.log(thisFuncName + "Whoops, there was an error!")
						res.log(thisFuncName + "data=" + data);
						
						res.render('./adminindex', { 
							title: 'Admin pages',
							current: eventId
						});
					}
					else
					{
						res.log(thisFuncName + 'Found ' + arrayLength + ' data for event ' + eventId);
						
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
	});
});

module.exports = router;

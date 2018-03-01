var express = require('express');
var router = express.Router();

router.get("/", function(req, res) {
	var thisFuncName = "scoutingpairs root: ";
	
	// Log message so we can see on the server side when we enter this
	console.log(thisFuncName + "ENTER");
	
	var db = req.db;
	
	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
	//Gets collection (aka a "table") from db
	var collection = db.get("teammembers");
	
	var progTeam;
	var mechTeam;
	var elecTeam;
	var assigned;

	//Searches for and sets variables for each subteam.
	//Each subteam var is an array with team member names inside.
	collection.find({"subteam":"prog","present":"true","assigned":"false"}, {sort: {"name": 1}}, function(e, docs){
		
		if(e){ //if error, log to console
			console.log(thisFuncName + e);
		}
		progTeam = docs;
		
		collection.find({"subteam":"mech","present":"true","assigned":"false"}, {sort: {"name": 1}}, function(e, docs){
			if(e){ //if error, log to console
				console.log(thisFuncName + e);
			}
			mechTeam = docs;
			
			collection.find({"subteam":"elec","present":"true","assigned":"false"}, {sort: {"name": 1}}, function(e, docs){
				if(e){ //if error, log to console
					console.log(thisFuncName + e);
				}
				elecTeam = docs;
				
				//Gets the current set of already-assigned pairs
				var collection2 = db.get("scoutingpairs");
				collection2.find({}, {}, function (e, docs) {;
					if(e){ //if error, log to console
						console.log(thisFuncName + e);
					}
					assigned = docs;
					
					//Renders page through Jade.
					console.log(thisFuncName + "RENDERING");
					
					res.render("./scoutingpairs", {
						title: "Scouting Pairs",
						prog: progTeam,
						mech: mechTeam,
						elec: elecTeam,
						assigned: assigned
					});
				});
			});
		});
	});
	
	console.log(thisFuncName + "DONE");
});

/* POST to Set scoutingPair Service */
router.post('/setscoutingpair', function(req, res) {
	var thisFuncName = "setscoutingpair: ";
	
	// Log message so we can see on the server side when we enter this
	console.log(thisFuncName + "ENTER");

    // Set our internal DB variable
    var db = req.db;

	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
    // Get our form values. These rely on the "name" attributes of form elements (e.g., named 'data' in the form)
    var data = req.body.data;
    //console.log(thisFuncName + data);
	
	// The javascript Object was JSON.stringify() on the client end; we need to re-hydrate it with JSON.parse()
	var selectedMembers = JSON.parse(data);
	console.log(selectedMembers);
	//var insertArray = [];
	//insertArray["pair"] = selectedMembers;

	////// Update selected teams to reflect the newly-picked team
	
    // Set collection to 'scoutingpairs'
    var collection = db.get('scoutingpairs');
	
	// Submit to the DB
	collection.insert(selectedMembers);
	
	////// Update members in 'teammembers' so that they're marked as "assigned" (and won't be available to choose afterwards)
	
    // Set collection to 'teammembers'
    var collection = db.get('teammembers');

    // Submit to the DB
	for (var member in selectedMembers)
	{
		console.log(selectedMembers[member]);
		collection.update(
			{ "name" : selectedMembers[member] },
			{ $set: { "assigned" : "true" } }
		)
	}
	
	console.log(thisFuncName + "REDIRECT");
	res.redirect("./");
	
	console.log(thisFuncName + "DONE");
});

router.post("/deletescoutingpair", function(req, res) {
	var thisFuncName = "deletescoutingpair: ";
	
	// Log message so we can see on the server side when we enter this
	console.log(thisFuncName + "ENTER");
	
	var db = req.db;
	
	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
	var data = req.body.data;
	
	var scoutCol = db.get("scoutingpairs");
	
	scoutCol.find({"_id": data}, {}, function(e, docs){
		
		if(e){ //if error, log to console
			console.log(thisFuncName + e);
		}
		thisPair = docs[0];
		console.log("thisPair=" + JSON.stringify(thisPair));

		var teamCol = db.get('teammembers');

		var nameList = [];
		if (thisPair.member1)
			nameList.push(thisPair.member1);
		if (thisPair.member2)
			nameList.push(thisPair.member2);
		if (thisPair.member3)
			nameList.push(thisPair.member3);
		console.log("nameList=" + JSON.stringify(nameList));

		teamCol.bulkWrite([{updateMany:{filter:{ "name": {$in: nameList }}, update:{ $set: { "assigned" : "false" } }}}], function(e, docs){
			scoutCol.remove({"_id": data});
		
			console.log(thisFuncName + "REDIRECT");
			res.redirect("./");	
		});
	});
	
	console.log(thisFuncName + "DONE");
});

router.post("/updateteamallocations", function(req, res) {
	var thisFuncName = "scoutingpairs.updateteamallocations[post]: ";
	
	// Log message so we can see on the server side when we enter this
	console.log(thisFuncName + "ENTER");
	
	var db = req.db;
	var currentCol = db.get("current");
	var scoutPairCol = db.get("scoutingpairs");
	var memberCol = db.get("teammembers");
	var scoutAssignCol = db.get("scoutingassignments");

	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}

	// nodeclient
	var Client = require('node-rest-client').Client;
	var client = new Client();
	var args = {
		headers: { "accept": "application/json", "X-TBA-Auth-Key": "iSpbq2JH2g27Jx2CI5yujDsoKYeC8pGuMw94YeK3gXFU6lili7S2ByYZYZOYI3ew" }
	}
		
	//
	// Get the 'current' event from DB
	//
	currentCol.find({}, {}, function(e, docs) {
		var noEventFound = 'No event defined';
		var eventId = noEventFound;
		if (docs)
			if (docs.length > 0)
				eventId = docs[0].event;
		if (eventId === noEventFound) {
			res.render('./adminindex', { 
				title: 'Admin pages',
				current: eventId
			});
		}
		
		//
		// Get the current set of already-assigned pairs; make a map of {"id": {"prim", "seco", "tert"}}
		//
		scoutPairCol.find({}, {}, function (e, docs) {
			if(e){ //if error, log to console
				console.log(thisFuncName + e);
			}
			var scoutingpairs = docs;

			// Iterate through scoutingpairs; create {1st: 2nd: 3rd:} and add to 'dict' keying off 1st <1, or 1/2 2/1, or 1/2/3 2/3/1 3/1/2>
			var primaryAndBackupMap = {};
			var scoutingAssignedArray = [];
			
			var pairsLen = scoutingpairs.length;
			for (var i = 0; i < pairsLen; i++) {
				var thisPair = scoutingpairs[i];
				if (thisPair.member3) {
					var set1 = {}; set1.primary = thisPair.member1; set1.secondary = thisPair.member2; set1.tertiary = thisPair.member3; primaryAndBackupMap[set1.primary] = set1;
					scoutingAssignedArray.push(set1.primary);
					var set2 = {}; set2.primary = thisPair.member2; set2.secondary = thisPair.member3; set2.tertiary = thisPair.member1; primaryAndBackupMap[set2.primary] = set2;
					scoutingAssignedArray.push(set2.primary);
					var set3 = {}; set3.primary = thisPair.member3; set3.secondary = thisPair.member1; set3.tertiary = thisPair.member2; primaryAndBackupMap[set3.primary] = set3;
					scoutingAssignedArray.push(set3.primary);
				} else if (thisPair.member2) {
					var set1 = {}; set1.primary = thisPair.member1; set1.secondary = thisPair.member2; primaryAndBackupMap[set1.primary] = set1;
					scoutingAssignedArray.push(set1.primary);
					var set2 = {}; set2.primary = thisPair.member2; set2.secondary = thisPair.member1; primaryAndBackupMap[set2.primary] = set2;
					scoutingAssignedArray.push(set2.primary);
				} else {
					var set1 = {}; set1.primary = thisPair.member1; primaryAndBackupMap[set1.primary] = set1;
					scoutingAssignedArray.push(set1.primary);
				}
			}
			//console.log(thisFuncName + "primaryAndBackupMap=" + JSON.stringify(primaryAndBackupMap));

			//
			// Read all present members, ordered by 'seniority' ~ have an array ordered by seniority
			//
			memberCol.find({ "name": {$in: scoutingAssignedArray }}, { sort: {"seniority": 1, "subteam": 1, "name": 1} }, function(e, docs) {
				console.log(thisFuncName + "inside memberCol.find()");
				if(e){ //if error, log to console
					console.log(thisFuncName + e);
				}
				var teammembers = docs;
				var teammembersLen = teammembers.length;
				/*
				for (var i = 0; i < teammembersLen; i++)
					console.log(thisFuncName + "member["+i+"=" + JSON.stringify(teammembers[i]));
				*/

				//
				// Get all the teams for the 'current' event
				//
				var url = "https://www.thebluealliance.com/api/v3/event/" + eventId + "/teams/simple";
				console.log(thisFuncName + "url=" + url);
				client.get(url, args, function (data, response) {
					var tbaTeamArray = JSON.parse(data);
					var tbaTeamArrayLen = tbaTeamArray.length;
					if (tbaTeamArrayLen == null)
					{
						console.log(thisFuncName + "Whoops, there was an error!")
						console.log(thisFuncName + "data=" + data);
						year = (new Date()).getFullYear();
						
						res.render('./adminindex', { 
							title: 'Admin pages',
							current: eventId
						});
						return;
					}

					// Cycle through teams, adding 1st 2nd 3rd to each based on array of 1st2nd3rds
					var teamassignments = [];
					var assigneePointer = 0;
					for (var i = 0; i < tbaTeamArrayLen; i++) {
						var thisTbaTeam = tbaTeamArray[i];
						var thisTeammemberName = teammembers[assigneePointer].name;
						var thisPrimaryAndBackup = primaryAndBackupMap[thisTeammemberName];
						/*
						console.log(thisFuncName + "i=" + i + "; assigneePointer=" + assigneePointer);
						console.log(thisFuncName + "thisTbaTeam=" + JSON.stringify(thisTbaTeam));
						console.log(thisFuncName + "thisTeammemberName=" + thisTeammemberName);
						console.log(thisFuncName + "thisPrimaryAndBackup=" + JSON.stringify(thisPrimaryAndBackup));
						*/
						
						var thisAssignment = {};
						thisAssignment["team"] = thisTbaTeam.key;
						thisAssignment["primary"] = thisPrimaryAndBackup.primary;
						if (thisPrimaryAndBackup.secondary)
							thisAssignment["secondary"] = thisPrimaryAndBackup.secondary;
						if (thisPrimaryAndBackup.tertiary)
							thisAssignment["tertiary"] = thisPrimaryAndBackup.tertiary;
						
						teamassignments.push(thisAssignment);
						
						assigneePointer += 1;
						if (assigneePointer >= teammembersLen)
							assigneePointer = 0;
					}
					console.log(thisFuncName + "****** New teamassignments:");
					for (var i = 0; i < tbaTeamArrayLen; i++)
						console.log(thisFuncName + "teamassignment["+i+"]=" + JSON.stringify(teamassignments[i]));
					
					//
					// Delete old team allocations, write new ones
					//
					scoutAssignCol.remove({}, function(e, docs) {
						// Insert the new data
						scoutAssignCol.insert(teamassignments, function(e, docs) {
							//
							// Match assignments: 
							// { year, event_key, match_key, match_number, alliance, 'match_team_key', assigned_scorer, actual_scorer, scoring_data: {} }
							//
							var year = (new Date()).getFullYear();
							var event_key = eventId;
							

							
							res.redirect("./");	
						});
					});
				});
			});
		});
	});
});	

/*			
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
*/		

module.exports = router;
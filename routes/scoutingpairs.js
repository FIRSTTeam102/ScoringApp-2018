var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

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

	// TODO: Redo as... teamCol.bulkWrite([{updateMany:{filter:{ "name": {$in: nameList }}, update:{ $set: { "assigned" : "true" } }}}], function(e, docs){
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
			scoutCol.remove({"_id": data}, function(e, docs) {
				console.log(thisFuncName + "REDIRECT");
				res.redirect("./");	
			});
		});
	});
	
	console.log(thisFuncName + "DONE");
});

router.post("/generateteamallocations", function(req, res) {
	// HARDCODED
	var activeTeamKey = 'frc102';
	
	var passCheckSuccess;
	
	if( !req.body.password || req.body.password == ""){
		return res.send({status: 401, alert: "No password entered."});
	}
	if( !require('./checkauthentication')(req, res, 'admin') )
		return console.log('admin not logged in on generateteamallocations');
	
	var teammembers = req.db.get('teammembers');
	
	teammembers.find( { name: req.user.name }, {}, function( e, user ){
		if(e)
			return console.error(e);
		if(!user[0]){
			res.send({status: 500, alert:"Passport error: no user found in db?"});
			return console.error("no user found? generateteamallocations");
		}
		
		bcrypt.compare( req.body.password, user[0].password, function(e, out){
			if(e)
				return console.error(e);
			if(out == true)
				passCheckSuccess = true;
			else
				return res.send({status: 401, alert: "Password incorrect."});
			
			if(passCheckSuccess){
/* Begin regular code ----------------------------------------------------------- */				
		
	var thisFuncName = "scoutingpairs.generateTEAMallocations[post]: ";

	// used when writing data to DB, for later querying by year
	var year = (new Date()).getFullYear();
							
	// Log message so we can see on the server side when we enter this
	console.log(thisFuncName + "ENTER");
	
	var db = req.db;
	var currentCol = db.get("current");
	var scoutPairCol = db.get("scoutingpairs");
	var memberCol = db.get("teammembers");
	var scoutDataCol = db.get("scoutingdata");
	var scoreDataCol = db.get("scoringdata");

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
		// used when writing data to DB, for later querying by event_key
		var event_key = eventId;
		
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
					if (tbaTeamArrayLen == null) {
						console.log(thisFuncName + "Whoops, there was an error!")
						console.log(thisFuncName + "data=" + data);
						year = (new Date()).getFullYear();
						
						res.render('./adminindex', { 
							title: 'Admin pages',
							current: eventId
						});
						return;
					}

					//
					// Cycle through teams, adding 1st 2nd 3rd to each based on array of 1st2nd3rds
					//
					var teamassignments = [];
					var teamassignmentsByTeam = {};
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
						
						// { year, event_key, team_key, primary, secondary, tertiary, actual, scouting_data: {} }
						var thisAssignment = {};
						// general info
						thisAssignment["year"] = year;
						thisAssignment["event_key"] = event_key;
						// unique per team
						thisAssignment["team_key"] = thisTbaTeam.key;
						
						// 2018-03-15, M.O'C: Skip assigning if this teams is the "active" team (currently hardcoding to 'frc102')
						if (activeTeamKey != thisTbaTeam.key) {						
							thisAssignment["primary"] = thisPrimaryAndBackup.primary;
							if (thisPrimaryAndBackup.secondary)
								thisAssignment["secondary"] = thisPrimaryAndBackup.secondary;
							if (thisPrimaryAndBackup.tertiary)
								thisAssignment["tertiary"] = thisPrimaryAndBackup.tertiary;
							
							assigneePointer += 1;
							if (assigneePointer >= teammembersLen)
								assigneePointer = 0;
						} else {
							console.log(thisFuncName + "Skipping team " + thisTbaTeam.key);
						}
							
						
						// Array for mass insert
						teamassignments.push(thisAssignment);
						// Map of assignments by team so we can lookup by team later during match assigning
						teamassignmentsByTeam[thisTbaTeam.key] = thisAssignment;
					}
					console.log(thisFuncName + "****** New/updated teamassignments:");
					for (var i = 0; i < tbaTeamArrayLen; i++)
						console.log(thisFuncName + "team,primary,secondary,tertiary=" + teamassignments[i].team_key + " ~> " + teamassignments[i].primary + "," + teamassignments[i].secondary + ","  + teamassignments[i].tertiary);
					
					// Delete ALL the old elements first for the 'current' event
					scoutDataCol.remove({"event_key": event_key}, function(e, docs) {
						// Insert the new data
						scoutDataCol.insert(teamassignments, function(e, docs) {
							//res.redirect("./");	
							return res.send({status: 200, alert: "Generated team allocations successfully."});
						});
					});
				});
			});
		});
	});

/* End regular code ----------------------------------------------------------- */
			}
		});
	});

});	

router.post("/generatematchallocations", function(req, res) {
	// HARDCODED
	var activeTeamKey = 'frc102';
	
	var passCheckSuccess;
	
	if( !req.body.password || req.body.password == ""){
		return res.send({status: 401, alert: "No password entered."});
	}
	if( !require('./checkauthentication')(req, res, 'admin') )
		return console.log('admin not logged in on generateteamallocations');
	
	var teammembers = req.db.get('teammembers');
	
	teammembers.find( { name: req.user.name }, {}, function( e, user ){
		if(e)
			return console.error(e);
		if(!user[0]){
			res.send({status: 500, alert:"Passport error: no user found in db?"});
			return console.error("no user found? generateteamallocations");
		}
		
		bcrypt.compare( req.body.password, user[0].password, function(e, out){
			if(e)
				return console.error(e);
			if(out == true)
				passCheckSuccess = true;
			else
				return res.send({status: 401, alert: "Password incorrect."});
			
			if(passCheckSuccess){
/* Begin regular code ----------------------------------------------------------- */
	
	var thisFuncName = "scoutingpairs.generateMATCHallocations[post]: ";

	// used when writing data to DB, for later querying by year
	var year = (new Date()).getFullYear();
							
	// Log message so we can see on the server side when we enter this
	console.log(thisFuncName + "ENTER");
	
	var db = req.db;
	var currentCol = db.get("current");
	var scoutPairCol = db.get("scoutingpairs");
	var memberCol = db.get("teammembers");
	var scoutDataCol = db.get("scoutingdata");
	var scoreDataCol = db.get("scoringdata");

	if(db._state == 'closed'){ //If database does not exist, send error
		return res.render('./error',{
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
			return res.render('./adminindex', { 
				title: 'Admin pages',
				current: eventId
			});
		}
		// used when writing data to DB, for later querying by event_key
		var event_key = eventId;

		// { year, event_key, match_key, match_number, alliance, 'match_team_key', assigned_scorer, actual_scorer, scoring_data: {} }

		// Need: Map, teamID->primary/secondar/tertiary
		// Read all matches
		// For each match:
		// Go through the teams, build data elements without assignees
		// Try to allocate primaries (track assigned members in a map - can't assign someone twice!)
		// Repeat again if blanks left over with secondaries
		// Repeat again if blanks left over with tertiaries
		// Add batch to collecting array for eventual DB mass insert

		// Need map of team IDs to scouts (scoutingdata)
		scoutDataCol.find({"event_key": event_key}, function(e, docs) {
			if(e){ //if error, log to console
				console.log(thisFuncName + e);
			}
			var scoutDataArray = docs;
			
			// Build teamID->primary/secondar/tertiary lookup
			var scoutDataByTeam = {};
			var scoutDataLen = scoutDataArray.length;
			for (var i = 0; i < scoutDataLen; i++)
				scoutDataByTeam[scoutDataArray[i].team_key] = scoutDataArray[i];
			
			// Read all matches
			var url = "https://www.thebluealliance.com/api/v3/event/" + eventId + "/matches/simple";
			console.log(thisFuncName + "url=" + url);
			client.get(url, args, function (data, response) {
				var matchArray = JSON.parse(data);
				var matchLen = matchArray.length;
				if (matchLen == null)
				{
					console.log(thisFuncName + "Whoops, there was an error!");
					console.log(thisFuncName + "matchArray=" + matchArray);
					
					res.render('./adminindex', { 
						title: 'Admin pages',
						current: eventId
					});
					return;
				}
				console.log(thisFuncName + 'Found ' + matchLen + ' matches for event ' + eventId);

				// Build up the scoringdata array
				var scoringDataArray = [];
				// Loop through each match
				for (var matchIdx = 0; matchIdx < matchLen; matchIdx++) {
					var thisMatch = matchArray[matchIdx];
					//console.log(thisFuncName + "*** thisMatch=" + thisMatch.key);
					
					// Build unassigned match-team data elements
					var thisMatchDataArray = [];
					
					// { year, event_key, match_key, match_number, alliance, team_key, 'match_team_key', assigned_scorer, actual_scorer, scoring_data: {} }
					var allianceArray = [ "red", "blue" ];
					for (var allianceIdx = 0; allianceIdx < allianceArray.length; allianceIdx++) {
						// teams are indexed 0, 1, 2
						for (var teamIdx = 0; teamIdx < 3; teamIdx++)
						{
							var thisScoreData = {};
							
							thisScoreData["year"] = year;
							thisScoreData["event_key"] = event_key;
							thisScoreData["match_key"] = thisMatch.key;
							thisScoreData["match_number"] = thisMatch.match_number;
							// time is the best 'chronological order' sort field
							thisScoreData["time"] = thisMatch.time;
							
							thisScoreData["alliance"] = allianceArray[allianceIdx];
							thisScoreData["team_key"] = thisMatch.alliances[allianceArray[allianceIdx]].team_keys[teamIdx];
							thisScoreData["match_team_key"] = thisMatch.key + "_" + thisScoreData["team_key"];

							//console.log(thisFuncName + "thisScoreData=" + JSON.stringify(thisScoreData));
							
							thisMatchDataArray.push(thisScoreData);
						}
					}
					var thisMatchLen = thisMatchDataArray.length;
					//console.log(thisFuncName + "thisMatchDataArray=" + JSON.stringify(thisMatchDataArray));
					
					// Keep track of who we've assigned - can't assign someone twice!
					var assignedMembers = {};
					// Go through assigning primaries first, then secondaries, then tertiaries
					var roleArray = [ "primary", "secondary", "tertiary" ];
					for (var roleIdx = 0; roleIdx < roleArray.length; roleIdx++) {
						// Which role (primary? secondary? tertiary?) are we checking
						var thisRole = roleArray[roleIdx];
						// Cycle through the scoring data, looking for blank assignees
						for (var thisMatchIdx = 0; thisMatchIdx < thisMatchLen; thisMatchIdx++) {
							var thisScoreData = thisMatchDataArray[thisMatchIdx];
							//console.log(thisFuncName + "thisScoreData=" + thisScoreData);
							// Not yet assigned?
							if (!(thisScoreData.assigned_scorer)) {
								// Which team is this?
								var thisTeamKey = thisScoreData.team_key;
								//console.log(thisFuncName + 'thisTeamKey=' + thisTeamKey);
								
								// 2018-03-15, M.O'C: Skip assigning if this teams is the "active" team (currently hardcoding to 'frc102')
								if (activeTeamKey != thisTeamKey)
								{					
									// Who is assigned to this team?
									var thisScoutData = scoutDataByTeam[thisTeamKey];
									var thisPossibleAssignee = thisScoutData[thisRole];
									// Only check if this role is defined for this team
									if (thisPossibleAssignee) {
										// Only proceed if this person is not yet assigned elsewhere
										if (!assignedMembers[thisPossibleAssignee]) {
											// Good to assign!
											thisMatchDataArray[thisMatchIdx].assigned_scorer = thisPossibleAssignee;
											// Mark them as assigned to a team
											assignedMembers[thisPossibleAssignee] = thisPossibleAssignee;
										}
									}
								}
							}
						}
					}
					
					console.log(thisFuncName + "*** thisMatch=" + thisMatch.key);
					for (var thisMatchDataIdx = 0; thisMatchDataIdx < thisMatchLen; thisMatchDataIdx++) {
						console.log(thisFuncName + "team,assigned=" + thisMatchDataArray[thisMatchDataIdx].team_key + " ~> " + thisMatchDataArray[thisMatchDataIdx].assigned_scorer);
						// add to the overall array of match assignments
						scoringDataArray.push(thisMatchDataArray[thisMatchDataIdx]);
					}
				}

				// Delete ALL the old elements first for the 'current' event
				scoreDataCol.remove({"event_key": event_key}, function(e, docs) {
					// Insert the new data - w00t!
					scoreDataCol.insert(scoringDataArray, function(e, docs) {
						//res.redirect("./");	
						return res.send({status: 200, alert: "Generated team allocations successfully."});
					});
				});
			});
		});
	});
/* End regular code ----------------------------------------------------------- */
			}
		});
	});

});

router.get("/swapmembers", function(req, res) {
	var thisFuncName = "scoutingpairs.swapmembers[get]: ";
	
	// Log message so we can see on the server side when we enter this
	console.log(thisFuncName + "ENTER");

	var db = req.db;
	var currentCol = db.get("current");
	var scoreDataCol = db.get("scoringdata");
	var matchCol = db.get("matches");
	var teammembers = req.db.get("teammembers");

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
			res.render('/adminindex', { 
				title: 'Admin pages',
				current: eventId
			});
		}
		// for later querying by event_key
		var event_key = eventId;
	
		// Get the *min* time of the as-yet-unresolved matches [where alliance scores are still -1]
		matchCol.find({ event_key: eventId, "alliances.red.score": -1 },{sort: {"time": 1}}, function(e, docs){

			// 2018-03-13, M.O'C - Fixing the bug where dashboard crashes the server if all matches at an event are done
			var earliestTimestamp = 9999999999;
			if (docs && docs[0])
			{
				var earliestMatch = docs[0];
				earliestTimestamp = earliestMatch.time;
			}
				
			// Get the distinct list of scorers from the unresolved matches
			scoreDataCol.distinct("assigned_scorer", {"event_key": eventId, "time": { $gte: earliestTimestamp }}, function (e, docs) {
				var scorers = docs;
				console.log(thisFuncName + 'distinct assigned_scorers: ' + JSON.stringify(scorers));
		
				// Get list of all users
				teammembers.find( {}, {sort:{ "name": 1 }}, function(e, docs){
					var users = docs;

					// Go to a Pug to show two lists & a button to do the swap - form with button
					res.render("./admin/swapmembers", {
						title: "Swap Match Scouts",
						scorers: scorers,
						users: users
					});
				});
			});
		});
	});
});

router.post("/swapmembers", function(req, res) {
	var thisFuncName = "scoutingpairs.swapmembers[post]: ";
	
	// Log message so we can see on the server side when we enter this
	console.log(thisFuncName + "ENTER");
	
	// Extract 'from' & 'to' from req
	var swapout = req.body.swapout;
	var swapin = req.body.swapin;
	console.log(thisFuncName + 'swap out ' + swapin + ', swap in ' + swapout);

	var db = req.db;
	var currentCol = db.get("current");
	var scoreDataCol = db.get("scoringdata");
	var matchCol = db.get("matches");
	
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
			res.render('/adminindex', { 
				title: 'Admin pages',
				current: eventId
			});
		}
		// for later querying by event_key
		var event_key = eventId;

		// Get the *min* time of the as-yet-unresolved matches [where alliance scores are still -1]
		matchCol.find({ event_key: eventId, "alliances.red.score": -1 },{sort: {"time": 1}}, function(e, docs){

			// 2018-03-13, M.O'C - Fixing the bug where dashboard crashes the server if all matches at an event are done
			var earliestTimestamp = 9999999999;
			if (docs && docs[0])
			{
				var earliestMatch = docs[0];
				earliestTimestamp = earliestMatch.time;
			}
				
			// Do the updateMany - change instances of swapout to swapin
			scoreDataCol.bulkWrite([{updateMany:{filter: { assigned_scorer: swapout, event_key: eventId, "time": { $gte: earliestTimestamp } }, 
				update:{ $set: { assigned_scorer: swapin } }}}], function(e, docs){

				res.redirect("/dashboard/matches");
			});
		});
	});
});

module.exports = router;
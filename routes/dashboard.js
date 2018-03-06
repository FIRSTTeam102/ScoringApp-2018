var express = require('express');
var router = express.Router();

/* GET index page. */
router.get('/', function(req, res) {
	var thisFuncName = "dashboard.{root}[get]: ";
	console.log(thisFuncName + 'ENTER');
	
	
	if( !require('./checkauthentication')(req, res, 'scouting') ){
		return console.log(thisFuncName + 'returning null');
	}
	
	var thisUser = req.user;
	var thisUserName = thisUser.name;

	var db = req.db;
	var currentCol = db.get("current");
	var scoutDataCol = db.get("scoutingdata");
	var pairsDataCol = db.get("scoutingpairs");
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

		//
		// Check to see if the logged in user is one of the scouting/scoring assignees
		//
		scoutDataCol.find({"event_key": eventId, "primary": thisUserName}, { sort: {"team_key": 1} }, function (e, docs) {
			var assignedTeams = docs;
			
			// if no assignments, send off to unassigned
			if (assignedTeams.length == 0) {
				console.log(thisFuncName + "User '" + thisUserName + "' has no assigned teams");
				res.redirect('./dashboard/unassigned');
				return;
			}
			for (var assignedIdx = 0; assignedIdx < assignedTeams.length; assignedIdx++)
				console.log(thisFuncName + "assignedTeam[" + assignedIdx + "]=" + assignedTeams[assignedIdx].team_key + "; data=" + assignedTeams[assignedIdx].data);

			// Get their scouting team
			pairsDataCol.find({$or: [{"member1": thisUserName}, {"member2": thisUserName}, {"member3": thisUserName}]}, {}, function (e, docs) {
				// we assume they're in a pair!
				var thisPair = docs[0];
				var thisPairLabel = thisPair.member1;
				if (thisPair.member2)
					thisPairLabel = thisPairLabel + ", " + thisPair.member2;
				if (thisPair.member3)
					thisPairLabel = thisPairLabel + ", " + thisPair.member3;
				console.log(thisFuncName + "thisPairLabel= " + thisPairLabel);
			
				// Get teams where they're backup (if any)
				scoutDataCol.find({"event_key": eventId, $or: [{"secondary": thisUserName}, {"tertiary": thisUserName}]}, { sort: {"team_key": 1} }, function (e, docs) {
					var backupTeams = docs;
					for (var backupIdx = 0; backupIdx < backupTeams.length; backupIdx++)
						console.log(thisFuncName + "backupTeam[" + backupIdx + "]=" + backupTeams[backupIdx].team_key);
				
					// Get the *min* time of the as-yet-unresolved matches [where alliance scores are still -1]
					matchCol.find({ event_key: eventId, "alliances.red.score": -1 },{sort: {"time": 1}}, function(e, docs){
						var earliestMatch = docs[0];
						var earliestTimestamp = earliestMatch.time;
				
						// Get all the UNRESOLVED matches where they're set to score
						scoreDataCol.find({"event_key": eventId, "assigned_scorer": thisUserName, "time": { $gte: earliestTimestamp }}, { sort: {"time": 1} }, function (e, docs) {
							var scoringMatches = docs;
							for (var matchesIdx = 0; matchesIdx < scoringMatches.length; matchesIdx++)
								console.log(thisFuncName + "scoringMatch[" + matchesIdx + "]: num,team=" + scoringMatches[matchesIdx].match_number + "," + scoringMatches[matchesIdx].team_key);
							
							res.render('./dashboard/dashboard-index',{
								"thisPair": thisPairLabel,
								"assignedTeams": assignedTeams,
								"backupTeams": backupTeams,
								"scoringMatches": scoringMatches
							});
						});
					});
				});
			});
		});
	});
});

router.get('/unassigned', function(req, res) {
	var thisFuncName = "dashboard.unassigned[get]: ";
	console.log(thisFuncName + 'ENTER');
	
	res.render('./dashboard/unassigned',{
		title: 'Ad-Hoc Scouting/Scoring'
	});	
});

router.get('/pits', function(req, res) {
	var thisFuncName = "dashboard.puts[get]: ";
	console.log(thisFuncName + 'ENTER');

	var db = req.db;
	var currentCol = db.get("current");
	var scoutDataCol = db.get("scoutingdata");

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
		
		scoutDataCol.find({"event_key": eventId}, { sort: {"team_key": 1} }, function (e, docs) {
			var teams = docs;
			
			res.render('./dashboard/pits', {
				"teams": teams
			});	
		});
	});
});

router.get('/matches', function(req, res) {
	var thisFuncName = "dashboard.matches[get]: ";
	console.log(thisFuncName + 'ENTER');

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
			var earliestMatch = docs[0];
			var earliestTimestamp = earliestMatch.time;
	
			// Get all the UNRESOLVED matches
			scoreDataCol.find({"event_key": eventId, "time": { $gte: earliestTimestamp }}, { sort: {"time": 1, "alliance": 1, "team_key": 1} }, function (e, docs) {
				var matches = docs;
				
				res.render('./dashboard/matches',{
					"matches": matches
				});
			});
		});
	});
});

module.exports = router;

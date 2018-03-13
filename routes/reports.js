var express = require("express");
var router = express.Router();

router.get("/", function(req, res){
	
	res.redirect('/?alert=No index page for /reports/');
	
});

router.get("/upcoming", function(req, res){
	
	if(!req.query || !req.query.team)
		var teamKey = 'all';
	else
		var teamKey = req.query.team;
	
	var matches = req.db.get("matches");
	
	if(teamKey != 'all'){
		matches.find({
				$and: 
				[
					{event_key: req.event.key},
					{$or: 
						[
							{ "alliances.blue.team_keys": teamKey },
							{ "alliances.red.team_keys": teamKey },
						]
					}
				]
			}, {
				sort: {time: 1}
			}, function(e, matches){
			
			if(e)
				return console.log(e);
			//if no results, send empty array for pug to deal with
			if(!matches)
				return res.render('./reports/upcoming', { matches: [] });
			
			res.render('./reports/upcoming', {
				matches: matches,
				team: teamKey
			});
		});
	}
	//if teamKey is 'all'
	else{
		matches.find({event_key: req.event.key}, {sort: {time: 1}}, function(e, matches){
			if(e)
				return console.log(e);
			//if no results, send empty array for pug to deal with
			if(!matches)
				return res.render('./reports/upcoming', { matches: [] });
			
			res.render('./reports/upcoming', {
				matches: matches
			});
		});
	}
});

router.get("/teamintel*", function(req, res){
	var thisFuncName = "reports.teamintel*[get]: ";
	console.log(thisFuncName + 'ENTER');
	
	var teamKey = req.query.team;
	if (!teamKey) {
		res.redirect("/?alert=No team specified in Reports page.");
		return;
	}
	console.log(thisFuncName + 'teamKey=' + teamKey);
	
	var db = req.db;
	var teamsCol = req.db.get('teams');
	var pitCol = req.db.get('scoutingdata');
	var matchCol = req.db.get('matches');
	var currentCol = db.get("current");
	var scoutCol = db.get("scoutinglayout");
	
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
		console.log(thisFuncName + 'event_key=' + event_key);
		
		// Team details
		teamsCol.find({ "key" : teamKey }, {}, function(e, docs){
			var team = docs[0];
			console.log(thisFuncName + 'team=' + JSON.stringify(team));

			// Pit scouting info
			pitCol.find({ "event_key" : event_key, "team_key" : teamKey }, {}, function(e, docs){
				var pitData = null;
				if (docs && docs[0])
					pitData = docs[0].data;
				console.log(thisFuncName + 'pitData=' + JSON.stringify(pitData));
			
				// Pit data layout
				scoutCol.find({}, {sort: {"order": 1}}, function(e, docs){
					var layout = docs;
					console.log(thisFuncName + 'layout=' + JSON.stringify(layout));
					
					// Match history info
					matchCol.find({"alliances.red.score": { $ne: -1}, "event_key" : event_key, $or: [{"alliances.blue.team_keys": teamKey}, {"alliances.red.team_keys": teamKey}]}, {sort: {time: 1}}, function (e, docs) {
						var matches = docs;
						console.log(thisFuncName + 'matches=' + JSON.stringify(matches));
				
						res.render("./reports2/teamintel", {
							team: team,
							data: pitData,
							layout: layout,
							matches: matches
						});
					});
				});
			});
		});
	});
});

module.exports = router;
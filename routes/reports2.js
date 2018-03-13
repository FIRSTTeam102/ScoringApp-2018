var express = require("express");
var router = express.Router();

router.get("/teamintel*", function(req, res){
	var thisFuncName = "reports.teamintel*[get]: ";
	console.log(thisFuncName + 'ENTER');
	
	var teamKey = req.query.team;
	if (!teamKey) {
		res.redirect("/?alert=No team specified in Team Intel page.");
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
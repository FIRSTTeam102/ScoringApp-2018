var express = require("express");
var router = express.Router();

router.get("/", function(req, res){

	// TODO - we should probaby make an index for reports?
	res.redirect('/?alert=No index page for /reports/');
	
});

router.get("/finishedmatches", function(req, res){
	var thisFuncName = "reports.finishedmatches[get]: ";
	console.log(thisFuncName + 'ENTER');
	
	var db = req.db;
	var currentCol = db.get("current");
	var matchCol = req.db.get('matches');
	
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

		// Match history info
		matchCol.find({"alliances.red.score": { $ne: -1}, "event_key" : event_key}, {sort: {time: 1}}, function (e, docs) {
			var matches = docs;
			//console.log(thisFuncName + 'matches=' + JSON.stringify(matches));
			res.render("./reports/finishedmatches", {
				title: "Matches",
				matches: matches
			});
		});			
	});
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
					{"alliances.blue.score": -1},
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
				return res.render('./reports/upcoming', { title:"Upcoming", matches: [] });
			
			res.render('./reports/upcoming', {
				title: "Upcoming",
				matches: matches,
				team: teamKey
			});
		});
	}
	//if teamKey is 'all'
	else{
		matches.find({event_key: req.event.key, "alliances.blue.score": -1}, {sort: {time: 1}}, function(e, matches){
			if(e)
				return console.log(e);
			//if no results, send empty array for pug to deal with
			if(!matches)
				return res.render('./reports/upcoming', { 
					title: "Events",
					matches: [] 
				});
			
			res.render('./reports/upcoming', {
				title: "Upcoming",
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
	var aggCol = req.db.get('scoringdata');
	var matchCol = req.db.get('matches');
	var currentCol = db.get("current");
	var scoutCol = db.get("scoutinglayout");
	var scoreCol = db.get("scoringlayout");
	
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
			if(e)
				return console.error(e);
			if(!docs[0]){
				return res.render('./error', {
					title: "Intel: Team " + teamKey.substring(3),
					error: {
						status: "FRC Team "+teamKey.substring(3)+" does not exist or did not participate in this event."
					}
				});
			}
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
					//console.log(thisFuncName + 'layout=' + JSON.stringify(layout));
					
					// Match history info
					matchCol.find({"alliances.red.score": { $ne: -1}, "event_key" : event_key, $or: [{"alliances.blue.team_keys": teamKey}, {"alliances.red.team_keys": teamKey}]}, {sort: {time: 1}}, function (e, docs) {
						var matches = docs;
						//console.log(thisFuncName + 'matches=' + JSON.stringify(matches));
				
						// Match data layout - use to build dynamic Mongo aggregation query
						// db.scoringdata.aggregate( [ 
						// { $match : { "data":{$exists:true}, "event_key": "2018njfla", "team_key": "frc303" } }, 
						// { $group : { _id: "$team_key",
						// "teleScaleMIN": {$min: "$data.teleScale"},
						// "teleScaleAVG": {$avg: "$data.teleScale"},
						// "teleScaleMAX": {$max: "$data.teleScale"}
						//  } }
						// ] );						
						scoreCol.find({}, {sort: {"order": 1}}, function(e, docs){
							var scorelayout = docs;
							var aggQuery = [];
							aggQuery.push({ $match : { "data":{$exists:true}, "event_key": "2018njfla", "team_key": teamKey } });
							var groupClause = {};
							groupClause["_id"] = "$team_key";

							for (var scoreIdx = 0; scoreIdx < scorelayout.length; scoreIdx++) {
								var thisLayout = scorelayout[scoreIdx];
								if (thisLayout.type == 'checkbox' || thisLayout.type == 'counter' || thisLayout.type == 'badcounter') {
									console.log(thisFuncName + 'thisLayout.type=' + thisLayout.type + ', thisLayout.id=' + thisLayout.id);
									groupClause[thisLayout.id + "MIN"] = {$min: "$data." + thisLayout.id};
									groupClause[thisLayout.id + "AVG"] = {$avg: "$data." + thisLayout.id};
									groupClause[thisLayout.id + "MAX"] = {$max: "$data." + thisLayout.id};
								}
							}
							aggQuery.push({ $group: groupClause });
							console.log(thisFuncName + 'aggQuery=' + JSON.stringify(aggQuery));
							
							aggCol.aggregate(aggQuery, function(e, docs){
								var aggresult = {};
								if (docs && docs[0])
									aggresult = docs[0];
								console.log(thisFuncName + 'aggresult=' + JSON.stringify(aggresult));

								// Unspool single row of aggregate results into tabular form
								var aggTable = [];
								for (var scoreIdx = 0; scoreIdx < scorelayout.length; scoreIdx++) {
									var thisLayout = scorelayout[scoreIdx];
									if (thisLayout.type == 'checkbox' || thisLayout.type == 'counter' || thisLayout.type == 'badcounter') {
										var aggRow = {};
										aggRow['key'] = thisLayout.id;
										aggRow['min'] = (Math.round(aggresult[thisLayout.id + "MIN"] * 100)/100).toFixed(2);
										aggRow['avg'] = (Math.round(aggresult[thisLayout.id + "AVG"] * 100)/100).toFixed(2);
										aggRow['max'] = (Math.round(aggresult[thisLayout.id + "MAX"] * 100)/100).toFixed(2);
										aggTable.push(aggRow);
									}
								}
								console.log(thisFuncName + 'aggTable=' + JSON.stringify(aggTable));
								
								res.render("./reports/teamintel", {
									title: "Intel: Team " + teamKey.substring(3),
									team: team,
									data: pitData,
									layout: layout,
									aggdata: aggTable,
									matches: matches
								});
							});
						});
					});
				});
			});
		});
	});
});

router.get("/matchintel*", function(req, res){
	var thisFuncName = "reports.matchintel*[get]: ";
	console.log(thisFuncName + 'ENTER');
	
	var matchKey = req.query.key;
	if (!matchKey) {
		res.redirect("/?alert=No match key specified in Match Intel page.");
		return;
	}
	console.log(thisFuncName + 'matchKey=' + matchKey);
	
	var db = req.db;
	var matchCol = req.db.get('matches');
	//var teamsCol = req.db.get('teams');
	//var pitCol = req.db.get('scoutingdata');
	//var currentCol = db.get("current");
	//var scoutCol = db.get("scoutinglayout");
	
	matchCol.find({"key": matchKey}, {}, function (e, docs) {
		var match = {};
		if (docs && docs[0])
			match = docs[0];
		
		console.log(thisFuncName + 'match=' + JSON.stringify(match));
		res.render("./reports/matchintel", {
			title: "Intel: Match "+matchKey.substring(matchKey.indexOf('qm')+2),
			match: match
		});
	});
});

router.get("/teammatchintel*", function(req, res){
	var thisFuncName = "reports.teammatchintel*[get]: ";
	console.log(thisFuncName + 'ENTER');
	
	var teamMatchKey = req.query.key;
	if (!teamMatchKey) {
		res.redirect("/?alert=No team-match key specified in Team Match Intel page.");
		return;
	}
	console.log(thisFuncName + 'teamMatchKey=' + teamMatchKey);
	
	var db = req.db;
	var scoreCol = req.db.get('scoringdata');
	//var teamsCol = req.db.get('teams');
	//var pitCol = req.db.get('scoutingdata');
	//var currentCol = db.get("current");
	var scoutCol = db.get("scoringlayout");
	
	// Match data layout
	scoutCol.find({}, {sort: {"order": 1}}, function(e, docs){
		var layout = docs;
		
		scoreCol.find({"match_team_key": teamMatchKey}, {}, function (e, docs) {
			var data = null;
			var teammatch = null;
			if (docs && docs[0]) {
				teammatch = docs[0];
				data = teammatch.data;
			}
			
			console.log(thisFuncName + 'teammatch=' + JSON.stringify(teammatch));
			res.render("./reports/teammatchintel", {
				layout: layout,
				data: data,
				teammatch: teammatch
			});
		});
	});
});

module.exports = router;
var express = require("express");
var router = express.Router();

router.get("/", function(req, res){

	// TODO - we should probaby make an index for reports?
	res.redirect('/?alert=No index page for /reports/');
	
});

router.get("/rankings", function(req, res){
	var thisFuncName = "reports.rankings[get]: ";
	console.log(thisFuncName + 'ENTER');
	
	var db = req.db;
	var rankCol = db.get("currentrankings");
	
	rankCol.find({}, {sort: {rank: 1}}, function(e, docs) {
		var rankings = null;
		if (docs && docs.length > 0)
			rankings = docs;

		//console.log(thisFuncName + 'rankings=' + JSON.stringify(rankings));
		
		res.render("./reports/rankings", {
			title: "Rankings",
			rankings: rankings
		});
	});
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
			//console.log(thisFuncName + 'team=' + JSON.stringify(team));

			// Pit scouting info
			pitCol.find({ "event_key" : event_key, "team_key" : teamKey }, {}, function(e, docs){
				var pitData = null;
				var pitData1 = null;
				if (docs && docs[0]) {
					if (docs[0].data)
						pitData = docs[0].data;
					if (docs[0].data1)
						pitData1 = docs[0].data1;
				}
				//console.log(thisFuncName + 'pitData=' + JSON.stringify(pitData));
			
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
							aggQuery.push({ $match : { "data":{$exists:true}, "event_key": event_key, "team_key": teamKey } });
							var groupClause = {};
							groupClause["_id"] = "$team_key";

							for (var scoreIdx = 0; scoreIdx < scorelayout.length; scoreIdx++) {
								var thisLayout = scorelayout[scoreIdx];
								if (thisLayout.type == 'checkbox' || thisLayout.type == 'counter' || thisLayout.type == 'badcounter') {
									//console.log(thisFuncName + 'thisLayout.type=' + thisLayout.type + ', thisLayout.id=' + thisLayout.id);
									groupClause[thisLayout.id + "MIN"] = {$min: "$data." + thisLayout.id};
									groupClause[thisLayout.id + "AVG"] = {$avg: "$data." + thisLayout.id};
									groupClause[thisLayout.id + "VAR"] = {$stdDevPop: "$data." + thisLayout.id};
									groupClause[thisLayout.id + "MAX"] = {$max: "$data." + thisLayout.id};
								}
							}
							aggQuery.push({ $group: groupClause });
							//console.log(thisFuncName + 'aggQuery=' + JSON.stringify(aggQuery));
							
							aggCol.aggregate(aggQuery, function(e, docs){
								var aggresult = {};
								if (docs && docs[0])
									aggresult = docs[0];
								//console.log(thisFuncName + 'aggresult=' + JSON.stringify(aggresult));

								// Unspool single row of aggregate results into tabular form
								var aggTable = [];
								for (var scoreIdx = 0; scoreIdx < scorelayout.length; scoreIdx++) {
									var thisLayout = scorelayout[scoreIdx];
									if (thisLayout.type == 'checkbox' || thisLayout.type == 'counter' || thisLayout.type == 'badcounter') {
										var aggRow = {};
										aggRow['key'] = thisLayout.id;
										
										// Recompute VAR first = StdDev/Mean
										aggRow['var'] = aggRow['var'] / (aggRow['avg'] + 0.001);
						
										aggRow['min'] = (Math.round(aggresult[thisLayout.id + "MIN"] * 10)/10).toFixed(1);
										aggRow['avg'] = (Math.round(aggresult[thisLayout.id + "AVG"] * 10)/10).toFixed(1);
										aggRow['var'] = (Math.round(aggresult[thisLayout.id + "VAR"] * 10)/10).toFixed(1);
										aggRow['max'] = (Math.round(aggresult[thisLayout.id + "MAX"] * 10)/10).toFixed(1);
										aggTable.push(aggRow);
									}
								}
								//console.log(thisFuncName + 'aggTable=' + JSON.stringify(aggTable));

								console.log(thisFuncName + 'pitData=' + JSON.stringify(pitData));
								console.log(thisFuncName + 'pitData1=' + JSON.stringify(pitData1));
								
								res.render("./reports/teamintel", {
									title: "Intel: Team " + teamKey.substring(3),
									team: team,
									data: pitData,
									data1: pitData1,
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
		
		//console.log(thisFuncName + 'match=' + JSON.stringify(match));
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
			
			//console.log(thisFuncName + 'teammatch=' + JSON.stringify(teammatch));
			res.render("./reports/teammatchintel", {
				layout: layout,
				data: data,
				teammatch: teammatch
			});
		});
	});
});

router.get("/metrics", function(req, res){
	var thisFuncName = "reports.metrics[get]: ";
	console.log(thisFuncName + 'ENTER');
	
	var db = req.db;
	var aggCol = req.db.get('scoringdata');
	var scoreCol = db.get("scoringlayout");
	var currentCol = db.get("current");
	
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
	
		// Match data layout - use to build dynamic Mongo aggregation query  --- No team key specified! Will combo ALL teams
		// db.scoringdata.aggregate( [ 
		// { $match : { "data":{$exists:true}, "event_key": "2018njfla" } }, 
		// { $group : { _id: "$team_key",
		// "teleScaleMIN": {$min: "$data.teleScale"},
		// "teleScaleAVG": {$avg: "$data.teleScale"},
		// "teleScaleMAX": {$max: "$data.teleScale"}
		//  } }
		// ] );						
		scoreCol.find({}, {sort: {"order": 1}}, function(e, docs){
			var scorelayout = docs;
			var aggQuery = [];
			aggQuery.push({ $match : { "data":{$exists:true}, "event_key": event_key } });
			var groupClause = {};
			// group on event for single row
			groupClause["_id"] = "$event_key";

			for (var scoreIdx = 0; scoreIdx < scorelayout.length; scoreIdx++) {
				var thisLayout = scorelayout[scoreIdx];
				if (thisLayout.type == 'checkbox' || thisLayout.type == 'counter' || thisLayout.type == 'badcounter') {
					//console.log(thisFuncName + 'thisLayout.type=' + thisLayout.type + ', thisLayout.id=' + thisLayout.id);
					groupClause[thisLayout.id + "MIN"] = {$min: "$data." + thisLayout.id};
					groupClause[thisLayout.id + "AVG"] = {$avg: "$data." + thisLayout.id};
					groupClause[thisLayout.id + "VAR"] = {$stdDevPop: "$data." + thisLayout.id};
					groupClause[thisLayout.id + "MAX"] = {$max: "$data." + thisLayout.id};
				}
			}
			aggQuery.push({ $group: groupClause });
			//console.log(thisFuncName + 'aggQuery=' + JSON.stringify(aggQuery));
			
			aggCol.aggregate(aggQuery, function(e, docs){
				var aggresult = {};
				if (docs && docs[0])
					aggresult = docs[0];
				//console.log(thisFuncName + 'aggresult=' + JSON.stringify(aggresult));

				// Unspool single row of aggregate results into tabular form
				var aggTable = [];
				for (var scoreIdx = 0; scoreIdx < scorelayout.length; scoreIdx++) {
					var thisLayout = scorelayout[scoreIdx];
					if (thisLayout.type == 'checkbox' || thisLayout.type == 'counter' || thisLayout.type == 'badcounter') {
						var aggRow = {};
						aggRow['key'] = thisLayout.id;
						
						// Recompute VAR first = StdDev/Mean
						aggRow['var'] = aggRow['var'] / (aggRow['avg'] + 0.001);
					
						aggRow['min'] = (Math.round(aggresult[thisLayout.id + "MIN"] * 10)/10).toFixed(1);
						aggRow['avg'] = (Math.round(aggresult[thisLayout.id + "AVG"] * 10)/10).toFixed(1);
						aggRow['var'] = (Math.round(aggresult[thisLayout.id + "VAR"] * 10)/10).toFixed(1);
						aggRow['max'] = (Math.round(aggresult[thisLayout.id + "MAX"] * 10)/10).toFixed(1);
						aggTable.push(aggRow);
					}
				}
				//console.log(thisFuncName + 'aggTable=' + JSON.stringify(aggTable));
				
				res.render("./reports/metrics", {
					title: "Metrics For All Teams",
					aggdata: aggTable
				});
			});
		});
	});	
});

router.get("/metricintel*", function(req, res){
	var thisFuncName = "reports.metric*[get]: ";
	console.log(thisFuncName + 'ENTER');
	
	var metricKey = req.query.key;
	if (!metricKey) {
		res.redirect("/?alert=No metric key specified in Metric Intel page.");
		return;
	}
	console.log(thisFuncName + 'metricKey=' + metricKey);
	
	var db = req.db;
	var aggCol = req.db.get('scoringdata');
	var currentCol = db.get("current");
	
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
	
		// Match data layout - use to build dynamic Mongo aggregation query  --- No team key specified! Will output ALL teams
		// db.scoringdata.aggregate( [ 
		// { $match : { "data":{$exists:true}, "event_key": "2018njfla" } }, 
		// { $group : { _id: "$team_key",
		// "teleScaleMIN": {$min: "$data.teleScale"},
		// "teleScaleAVG": {$avg: "$data.teleScale"},
		// "teleScaleMAX": {$max: "$data.teleScale"}
		//  } }
		// ] );						
		var aggQuery = [];
		aggQuery.push({ $match : { "data":{$exists:true}, "event_key": event_key } });
		var groupClause = {};
		// group on team for multiple rows
		groupClause["_id"] = "$team_key";

		groupClause[metricKey + "MIN"] = {$min: "$data." + metricKey};
		groupClause[metricKey + "AVG"] = {$avg: "$data." + metricKey};
		groupClause[metricKey + "VAR"] = {$stdDevPop: "$data." + metricKey};
		groupClause[metricKey + "MAX"] = {$max: "$data." + metricKey};
	
		var sortKey = metricKey + "AVG";
		var sortClause = {};
		sortClause[sortKey] = -1;
	
		aggQuery.push({ $group: groupClause }, { $sort: sortClause });
		//console.log(thisFuncName + 'aggQuery=' + JSON.stringify(aggQuery));
		
		aggCol.aggregate(aggQuery, function(e, docs){
			aggdata = docs;

			if (aggdata) {
				for (var aggIdx in aggdata) {
					var thisAgg = aggdata[aggIdx];
					// Recompute VAR first = StdDev/Mean
					thisAgg[metricKey + "VAR"] = thisAgg[metricKey + "VAR"] / (thisAgg[metricKey + "AVG"] + 0.001);
					
					thisAgg[metricKey + "MIN"] = (Math.round(thisAgg[metricKey + "MIN"] * 10)/10).toFixed(1);
					thisAgg[metricKey + "AVG"] = (Math.round(thisAgg[metricKey + "AVG"] * 10)/10).toFixed(1);
					thisAgg[metricKey + "VAR"] = (Math.round(thisAgg[metricKey + "VAR"] * 10)/10).toFixed(1);
					thisAgg[metricKey + "MAX"] = (Math.round(thisAgg[metricKey + "MAX"] * 10)/10).toFixed(1);
				}
			}
			
			//console.log(thisFuncName + 'aggdata=' + JSON.stringify(aggdata));
			
			res.render("./reports/metricintel", {
				title: "Intel: " + metricKey,
				aggdata: aggdata,
				key: metricKey
			});
		});
	});	
});

module.exports = router;
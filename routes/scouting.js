var express = require('express');
var router = express.Router();

router.get('/match*', function(req, res) {
	var thisFuncName = "scouting.match*[get]: ";
	console.log(thisFuncName + 'ENTER');
	
	var thisUser = req.user;
	var thisUserName = thisUser.name;

	var matchKey = req.query.key;
	if (!matchKey) {
		res.redirect("/dashboard");
		return;
	}
	console.log(thisFuncName + 'matchKey=' + matchKey + ' ~ thisUserName=' + thisUserName);
	
	var db = req.db;
	var collection = db.get("scoringlayout");
	collection.find({}, {sort: {"order": 1}}, function(e, docs){
		var layout = docs;
		console.log(layout);
		res.render("./scouting/match", {
			layout: layout,
			key: matchKey
		});
	});
});

router.post('/submitmatch', function(req, res) {
	var thisFuncName = "scouting.submitmatch[post]: ";
	console.log(thisFuncName + 'ENTER');
	
	var thisUser = req.user;
	var thisUserName = thisUser.name;
	
	//console.log(thisFuncName + 'req.body=' + JSON.stringify(req.body));
	
	var matchData = req.body;
	
	var matchKey = matchData.matchkey;
	delete matchData.matchkey;
	console.log(thisFuncName + 'matchKey=' + matchKey + ' ~ thisUserName=' + thisUserName);
	console.log(thisFuncName + 'matchData=' + JSON.stringify(matchData));

	var db = req.db;
    var matchCol = db.get('scoringdata');

	matchCol.update( { "match_team_key" : matchKey }, { $set: { "data" : matchData, "actual_scorer": thisUserName } }, function(e, docs){
		res.redirect("/dashboard");
	});
});

router.get('/pit*', function(req, res) {
	var thisFuncName = "scouting.pit*[get]: ";
	console.log(thisFuncName + 'ENTER');
	
	var thisUser = req.user;
	var thisUserName = thisUser.name;

	var teamKey = req.query.team;
	if (!teamKey) {
		res.redirect("/dashboard");
		return;
	}
	console.log(thisFuncName + 'teamKey=' + teamKey + ' ~ thisUserName=' + thisUserName);
	
	var db = req.db;
	var scoutCol = db.get("scoutinglayout");
	
	scoutCol.find({}, {sort: {"order": 1}}, function(e, docs){
		var layout = docs;
		
		//console.log(layout);
		res.render("./scouting/pit", {
			layout: layout,
			key: teamKey
		});
	});
});

router.post('/submitpit', function(req, res) {
	var thisFuncName = "scouting.submitpit[post]: ";
	console.log(thisFuncName + 'ENTER');
	
	var thisUser = req.user;
	var thisUserName = thisUser.name;
	
	//console.log(thisFuncName + 'req.body=' + JSON.stringify(req.body));
	
	var pitData = req.body;
	
	var teamKey = pitData.teamkey;
	delete pitData.teamkey;
	console.log(thisFuncName + 'teamKey=' + teamKey + ' ~ thisUserName=' + thisUserName);
	console.log(thisFuncName + 'pitData=' + JSON.stringify(pitData));

	var db = req.db;
    var pitCol = db.get('scoutingdata');
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
		var event_key = eventId;

		//res.redirect("/dashboard");
		
		pitCol.update( { "event_key" : event_key, "team_key" : teamKey }, { $set: { "data" : pitData, "actual_scouter": thisUserName } }, function(e, docs){
			res.redirect("/dashboard");
		});
	});
});

///////// PREVIOUS LEGACY CODE

router.get('/', function(req, res){
	
	//redirect to pits dashboard
	res.redirect('/dashboard/pits');
});

/*
router.get('/', function(req, res){
	
	var teams = req.db.get('teams');
	var scoutingresults = req.db.get('scoutingresults');
	
	teams.find({},{ sort: {team_number: 1} },function(e,teams){
		
		scoutingresults.find({},{},function(e,teamResults){
			
			//sets all thingies as empty
			for(var i = 0; i < teams.length; i++){
				
				teams[i].complete = false;
				teams[i].assigned = null;
				teams[i].answers = {};
				
			}
			
			for(var i = 0; i < teamResults.length; i++){
				
				var teamNum = teamResults[i].team_number;
				var complete = teamResults[i].complete;
				var assigned = teamResults[i].assigned;
				var answers = teamResults[i].answers;
				
				for(var j = 0; j < teams.length; j++){
					
					if(teams[j].team_number == teamNum){
						var team = teams[j];
						
						team.complete = complete;
						team.assigned = assigned;
						team.answers = answers;
						
					}
				}
			}
			
			res.render('./scouting/scouting-index',{
				title: "Teams to be Scouted",
				teams: teams,
				teamResults: teamResults
			});	
		});		
	});
	
	
});
*/
module.exports = router;
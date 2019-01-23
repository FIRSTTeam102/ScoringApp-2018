var express = require('express');
var router = express.Router();

router.get('/match*', function(req, res) {
	
	//auth
	if(!require('./checkauthentication')(req, res))
		return null;
	
	var thisFuncName = "scouting.match*[get]: ";
	console.log(thisFuncName + 'ENTER');
	
	var thisUser = req.user;
	var thisUserName = thisUser.name;

	var matchKey = req.query.key;
	var alliance = req.query.alliance;
	if (!matchKey) {
		res.redirect("/dashboard");
		return;
	}
	console.log(thisFuncName + 'matchKey=' + matchKey + ' ~ thisUserName=' + thisUserName);
	
	var db = req.db;
	var collection = db.get("scoringlayout");
	collection.find({}, {sort: {"order": 1}}, function(e, docs){
		var layout = docs;
		//console.log(layout);
		res.render("./scouting/match", {
			title: "Match Scouting",
			layout: layout,
			key: matchKey,
			alliance: alliance
		});
	});
});

router.post('/match/submit', function(req, res){
	
	/** We need to do this eventually for security. Commented out of fear that scouters may be logged out while scouting (by accident)
	//auth
	if(!require('./checkauthentication')(req, res))
		return null;
	*/
	var thisFuncName = "scouting.match[post]: ";
	console.log(thisFuncName + 'ENTER');
	
	if(req.user && req.user.name){
		var thisUser = req.user;
		var thisUserName = thisUser.name;
	}else{
		var thisUser = { name: "Mr. Unknown" };
		var thisUserName = "Mr. Unknown";
	}
	var matchData = req.body;
	if(!matchData)
		return res.send({status: 500, message: "No data was sent to /scouting/match/submit."});
	
	var matchKey = matchData.matchkey;
	console.log(thisFuncName + "matchKey=" + matchKey + " ~ thisUserName=" + thisUserName);
	delete matchData.matchkey;
	console.log(thisFuncName + "matchData(pre-modified)=" + JSON.stringify(matchData));
	//console.log(thisFuncName + 'matchKey=' + matchKey + ' ~ thisUserName=' + thisUserName);
	//console.log(thisFuncName + 'matchData=' + JSON.stringify(matchData));

	// Get the 'layout' so we know types of data elements
	var scoreCol = req.db.get("scoringlayout");
	scoreCol.find({}, {sort: {"order": 1}}, function(e, docs){
		var layout = docs;
		var layoutTypeById = {};
		//console.log(thisFuncName + "layout=" + JSON.stringify(layout));
		for (var property in layout) {
			if (layout.hasOwnProperty(property)) {
				//console.log(thisFuncName + layout[property].id + " is a " + layout[property].type);
				layoutTypeById[layout[property].id] = layout[property].type;
			}
		}
	
		// Process input data, convert to numeric values
		for (var property in matchData) {
			var thisType = layoutTypeById[property];
			//console.log(thisFuncName + property + " :: " + matchData[property] + " ~ is a " + thisType);
			if ('counter' == thisType || 'badcounter' == thisType) {
				//console.log(thisFuncName + "...converting " + matchData[property] + " to a number");
				var newVal = -1;
				if (matchData[property]) {
					var parseVal = parseInt(matchData[property]);
					if (!isNaN(parseVal))
						newVal = parseVal;
				}
				matchData[property] = newVal;
			}
			if ('checkbox' == thisType) {
				//console.log(thisFuncName + "...converting " + matchData[property] + " to a boolean 1/0 number");
				var newVal = (matchData[property] == "true" || matchData[property] == true) ? 1 : 0;
				matchData[property] = newVal;
			}
		}
		console.log(thisFuncName + "matchData(UPDATED)=" + JSON.stringify(matchData));
	
		// Post modified data to DB
		var matchCol = req.db.get('scoringdata');

		matchCol.update( { "match_team_key" : matchKey }, { $set: { "data" : matchData, "actual_scorer": thisUserName, useragent: req.shortagent } }, function(e, docs){
			if(e)
				return res.send({status: 500, message: e});
			return res.send({message: "Submitted data successfully.", status: 200});
		});
	});
});

router.post('/submitmatch', function(req, res) {
	//LEGACY CODE
	
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
	//auth
	if(!require('./checkauthentication')(req, res))
		return null;

	//Add event key and pit data to get pit function
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
	var pitCol = req.db.get('scoutingdata'); //for pitcol.find()
	
	scoutCol.find({}, {sort: {"order": 1}}, function(e, docs){
		var layout = docs;

		//pasted code
		pitCol.find({ "event_key" : event_key, "team_key" : teamKey }, {}, function(e, docs){
			var pitData = null;
			if (docs && docs[0])
				if (docs[0].data)
					pitData = docs[0].data;

			//console.log(layout);
			res.render("./scouting/pit", {
				title: "Pit Scouting",
				layout: layout,
				pitData: pitData, 
				key: teamKey
			});
		});
	});
});

router.post('/pit/submit', function(req, res){
	/** We need to do this eventually for security. Commented out of fear that scouters may be logged out while scouting (by accident)
	//auth
	if(!require('./checkauthentication')(req, res))
		return null;
	*/
	var thisFuncName = "scouting.submitpit[post]: ";
	console.log(thisFuncName + 'ENTER');
	
	var thisUser = req.user;
	var thisUserName = thisUser.name;
	
	//console.log(thisFuncName + 'req.body=' + JSON.stringify(req.body));
	
	var pitData = req.body;
	console.log(req.body);
	var teamKey = pitData.teamkey;
	delete pitData.teamkey;
	console.log(thisFuncName + 'teamKey=' + teamKey + ' ~ thisUserName=' + thisUserName);
	console.log(thisFuncName + 'pitData=' + JSON.stringify(pitData));

	var db = req.db;
    var pitCol = db.get('scoutingdata');

	var event_key = req.event.key;

	//res.redirect("/dashboard");
	
	pitCol.update( { "event_key" : event_key, "team_key" : teamKey }, { $set: { "data" : pitData, "actual_scouter": thisUserName, useragent: req.shortagent } }, function(e, docs){
		if(e)
			return res.send({status: 500, message: e});
		return res.send({message: "Submitted data successfully.", status: 200});
	});
});

router.post('/submitpit', function(req, res) {
	//LEGACY CODE
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
	var event_key = req.event.key;
	
	pitCol.update( { "event_key" : event_key, "team_key" : teamKey }, { $set: { "data" : pitData, "actual_scouter": thisUserName } }, function(e, docs){
		res.redirect("/dashboard");
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
var express = require('express');
var router = express.Router();

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

router.get('/survey', function(req, res){
	
	if(!req.query.team)
		return res.redirect('/scouting');
	else
		var team = req.query.team;
	
	var questions = req.db.get('scoutingquestions');
	var scoutingresults = req.db.get('scoutingresults');
	
	
	questions.find({},{ sort: {id: 1}},function(e,surveyList){

		scoutingresults.find({ team_number: team },{},function(e,teamResults){
			
			if( !teamResults[0] )
				var answers = {};
			else
				var answers = teamResults[0].answers;
			
			res.render('./scouting/survey',{
				title: "Scouting Survey",
				surveyList: surveyList,
				team: team,
				answers: answers
			});
		});
	});
});

router.post('/survey', function(req, res){
	
	var toUpdate = req.body;
	var teamNum = toUpdate.team_number;
	delete toUpdate.team_number;
	/*
	console.log(req.body);
	for( result in req.body ){
		console.log(result);
		console.log(req.body[result]);
		toUpdate
	}*/
	console.log(toUpdate);
	
	var scoutingresults = req.db.get('scoutingresults');
	
	scoutingresults.find( { team_number: teamNum }, {}, function(e, teamResults){
		
		if(!teamResults[0]){
			
			scoutingresults.insert( { team_number: teamNum, complete: true, answers: toUpdate }, {}, function(e, result){
				console.log(result);
			});
		}
		
	});
	
	scoutingresults.update({ team_number: teamNum }, { answer: toUpdate }, {}, function(e, result){
		console.log(result);
	});
	
	
	res.redirect('/scouting/survey');
	
});

module.exports = router;
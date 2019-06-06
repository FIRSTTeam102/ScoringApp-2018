var express = require('express');
var router = express.Router();
var utilities = require('../../utilities');

/**
 * Admin page to manually input/edit list of teams at an event (w/o TBA).
 * @url /admin/manualinput/teams
 * @views manualinput/teams
 */
router.get('/teams', async function(req, res){
	if( !require('../checkauthentication')(req, res, 'admin') ){
		return null;
	}
	
	//Get list of currentteams
	var teamsArray = await utilities.find("currentteams", {}, {sort: {"team_number": 1}});
	
	res.render('./manualinput/teams', {
		title: "Manually Input Teams",
		teams: teamsArray
	});
});

/**
 * POST method to retrieve manually updated list of teams.
 * @url /admin/manualinput/teams
 * @redirect /admin
 */
router.post('/teams', async function(req, res){
	if( !require('../checkauthentication')(req, res, 'admin') ){
		return null;
	}
	
	res.log(req.body);
	
	var teamNumbersArray = [];
	var teamInfoArray = [];
	var tbaPromiseArray = [];
	
	for(var teamNumberInputName in req.body){
		//grab team number
		var teamNumberInput = req.body[teamNumberInputName];
		var teamNumber = parseInt(teamNumberInput);
		
		//if number is valid, proceed
		if(!isNaN(teamNumber)){
			teamNumbersArray.push(teamNumber);
		}
	}
	
	var startTime = Date.now();
	
	//Fill an array of Promises for TBA info on each team.
	for(var i = 0; i < teamNumbersArray.length; i++){
		//request info from TBA
		tbaPromiseArray[i] =  utilities.requestTheBlueAlliance(`team/frc${teamNumbersArray[i]}`);
	}
	
	//Await all TBA Promises.
	for(var i = 0; i < tbaPromiseArray.length; i++){
		//await all requests
		teamInfoArray[i] = await tbaPromiseArray[i];
	}
	
	res.log(`Done with TBA call in ${Date.now() - startTime} ms`);
	
	//Go through teamInfoArray and splice out any item that contains errors
	for(var i = 0; i < teamInfoArray.length; i++){
		var thisTeamInfo = teamInfoArray[i];
		//if obj contains error, remove it
		if(thisTeamInfo.Errors){
			res.log("Going to remove: " + JSON.stringify(thisTeamInfo));
			teamInfoArray.splice(i, 1);
			i--;
		}
	}
	
	var teamInfoNoDuplicates = [];
	
	//Rebuild array without duplicates.
	for(var i = 0; i < teamInfoArray.length; i++){
		
		//grab team info to check for dupes
		var thisTeamInfo = teamInfoArray[i];
		var thisTeamNum = thisTeamInfo.team_number;
		
		let didFindDuplicate = false;
		
		res.log("================");
		res.log("CHECKING TEAM " + thisTeamNum);
		
		for(var j = 0; j < teamInfoNoDuplicates.length; j++){
			
			//grab team info to compare
			var thatTeamInfo = teamInfoArray[j];
			var thatTeamNum = thatTeamInfo.team_number;
			
			res.log("CMP: " + thatTeamNum);
			
			//if duplicat exists, set true
			if(thisTeamNum == thatTeamNum){
				didFindDuplicate = true;
				res.log("MATCH: Removing duplicate " + thisTeamNum + " from team list", true);
			}
		}
		//Add to new array if no duplicates exist.
		if(!didFindDuplicate){
			teamInfoNoDuplicates.push(thisTeamInfo);
			res.log("PUSHING " + thisTeamNum);
		}
	}
	
	//Now, we have a list of all teams attending the event.
	//Empty currentteams.
	await utilities.remove("currentteams");
	
	//Now, insert into currentteams.
	await utilities.insert("currentteams", teamInfoNoDuplicates);
	
	//Redirect with success message.
	res.redirect('/admin?alert=Input teams successfully.');
});

/**
 * POST Method that fetches info on a team from TheBlueAlliance.
 * @param team_number Team number to fetch
 * @return [Object] Team info from TBA. If the team is invalid, object contains only an array named "Errors".
 */
router.post('/api/team', async function(req, res){
	
	if(!req.body.team_number){
		res.log("admin/manualinput/api/team error: No team number specified.", true);
		return res.status(400).send("No team number specified.");
	}
	
	//get team number
	var team_number = parseInt(req.body.team_number);
	
	//if not a number, return with error 400
	if(isNaN(team_number)){
		res.log("admin/manualinput/api/team error: No team number specified.", true);
		return res.status(400).send("Team number was not parseable.");
	}
	
	//create team key
	var team_key = "frc" + team_number;
	
	var teamInfoResponse = await utilities.requestTheBlueAlliance(`team/${team_key}`);
	
	res.status(200).send(teamInfoResponse);
	
	res.log(teamInfoResponse);
});

/**
 * Manual input for correcting each match, if TBA is not accessible.
 * @url /manualinput/matches
 * @views manualinput/matches
 */
router.get('/matches', function(req, res) {
	if( !require('../checkauthentication')(req, res, 'admin') ){
		return null;
	}
	
	var thisFuncName = "manualinputs.matches[get]: ";
	res.log(thisFuncName + 'ENTER');
	
	var matchCol = req.db.get('matches');
	
	var event_key = req.event.key;
	res.log(thisFuncName + 'event_key=' + event_key);

	// Match history info
	//matchCol.find({"alliances.red.score": { $ne: -1}, "event_key" : event_key}, {sort: {time: -1}}, function (e, docs) {
	matchCol.find({"event_key" : event_key}, {sort: {time: 1}}, function (e, docs) {
		var matches = docs;
		
		res.render("./manualinput/matches", {
			title: "Matches",
			matches: matches
		});
	});	
	
//res.send('Hello World')
});

/** POST method for 
 * 
 */
router.post('/matches', function(req, res){
	if( !require('../checkauthentication')(req, res, 'admin') ){
		return null;
	}
	
	res.send(req.body);
});
module.exports = router;
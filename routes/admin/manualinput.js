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
		title: "Edit List of Teams",
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
 * Manual input for inputtnig match schedule, if TBA is not accessible.
 * @url /manualinput/matchschedule
 * @views manualinput/matchschedule
 */
router.get('/matchschedule', async function(req, res){
	if( !require('../checkauthentication')(req, res, 'admin') ){
		return null;
	}
	
	var thisFuncName = "[GET] /admin/manualinput/matchschedule => ";
	
	var event_key = req.event.key;
	
	res.log(`${thisFuncName} Getting matches`);
	
	var matches = await utilities.find("matches", {"event_key": event_key});
	
	res.render('./manualinput/matchschedule', {
		title: "Enter Match Schedule",
		matches: matches
	});
});

router.post('/matchschedule', async function(req, res){
	/*
		"actual_time": "",
		"alliances": {
			"blue": {
				"score": -1,
				"team_keys": [
					"frc5684",
					"frc4454",
					"frc5401"
				]
			},
			"red": {
				"score": -1,
				"team_keys": [
					"frc1807",
					"frc2539",
					"frc2559"
				]
			}
		},
		"comp_level": "f",
		"event_key": "2019pahat",
		"key": "2019pahat_f1m1",
		"match_number": 1,
		"post_result_time": 1551646484,
		"predicted_time": 1551646323,
		"set_number": 1,
		"time": 1551644760,
		"winning_alliance": ""
	*/
	
	var event_key = req.event.key;
	
	//Cycle through body and assemble an array of matches.
	//Array of matches
	var matchArray = [];
	//Current match row (*_1, *_2, *_3 etc; the number is idx + 1)
	var idx = 0;
	
	for(var elementName in req.body){
		//if this input elem. name is a match row (Names are split by Name_#)
		if(elementName.split("_")[1]){
			//update idx to the # in element name minus 1
			idx = parseInt(elementName.split("_")[1]) - 1;
			//if no match obj has been created in matchArray, create one
			if(!matchArray[idx]){
				matchArray[idx] = {};
			}
			//grab this match obj
			var thisMatch = matchArray[idx];
			//add this element to match obj
			var nameMinusNumber = elementName.split("_")[0]
			thisMatch[nameMinusNumber] = req.body[elementName];
		}
	}
	
	res.log(matchArray);
	
	//We now have an array, comprised of every user match input, separated by each match.
	//We need to rearrange the data to fit our database needs.
	
	//First, filter matchArray to trash any matches that don't have complete data.
	var matchArrayFiltered = [];
	
	for(var i = 0; i < matchArray.length; i++){
		var match = matchArray[i];
		
		if(match.BlueTeam1 && match.BlueTeam2 && match.BlueTeam3 &&
			match.RedTeam1 && match.RedTeam2 && match.RedTeam3 && match.SchedTime != -1){
				//If all elements exist and are populated, and time is not -1
				matchArrayFiltered.push(match);
		}
	}
	
	res.log(matchArrayFiltered);
	
	//Now, we can rearrange our data.
	var matchArrayFormatted = [];
	
	for(var i = 0; i < matchArrayFiltered.length; i++){
		
		var match = matchArrayFiltered[i];
		//Time is in seconds, not ms: divide by 1000
		match.SchedTime = parseInt( match.SchedTime / 1000 );
		//Create formatted match thing
		matchArrayFormatted[i] = {
			"actual_time": "",
			"alliances": {
				"blue": {
					"score": -1,
					"team_keys": [
						"frc" + match.BlueTeam1,
						"frc" + match.BlueTeam2,
						"frc" + match.BlueTeam3
					]
				},
				"red": {
					"score": -1,
					"team_keys": [
						"frc" + match.RedTeam1,
						"frc" + match.RedTeam2,
						"frc" + match.RedTeam3
					]
				}
			},
			"comp_level": "qm", //only support qualifying matches
			"event_key": event_key,
			"key": `${event_key}_qm${i + 1}`, //2019pahat_qm1 (# is i+1) 
			"match_number": i + 1,
			"post_result_time": match.SchedTime, //idk what all this time stuff is, just gonna set it to sched time
			"predicted_time": match.SchedTime,
			"set_number": 1,
			"time": match.SchedTime,
			"winning_alliance": ""
		}
	}
	
	res.log(matchArrayFormatted);
	
	//Remove matches from db
	await utilities.remove("matches", {"event_key": event_key});
	
	//now insert matches into db
	await utilities.insert("matches", matchArrayFormatted);
	
	res.redirect('./matchschedule');
})

/**
 * Manual input for correcting each match, if TBA is not accessible.
 * @url /manualinput/matches
 * @views manualinput/matches
 */
router.get('/matches', async function(req, res) {
	if( !require('../checkauthentication')(req, res, 'admin') ){
		return null;
	}
	
	var event_key = req.event.key;
	
	var matches = await utilities.find("matches", {"event_key": event_key}, {sort: {time: 1}});
	
	res.render("./manualinput/matches", {
		title: "Input Match Outcomes",
		matches: matches
	});
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
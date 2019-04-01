var express = require('express');
var router = express.Router();

/**
 * Admin index page. Provides links to all admin functionality.
 * @url /admin/
 * @views /adminindex
 */
router.get('/', function(req, res) {
	if( !require('../checkauthentication')(req, res, 'admin') ){
		return null;
	}
	
	//Prepare an alert. (Used w/ url /?alert=(alert))
	if(req.query)
		var alert = req.query.alert || null;
	
	res.render('./admin/admin', { 
		title: 'Admin pages',
		current: req.event.key,
		alert: alert
	});
});

/** POST method to set current event id.
 * @url /admin/setcurrent
 * @redirect /admin
 */
router.post('/setcurrent', function(req, res) {
	if( !require('../checkauthentication')(req, res, 'admin') ){
		return null;
	}
	
	var thisFuncName = "adminindex.setcurrent[post]: ";
	var eventId = req.body.eventId;
	res.log(thisFuncName + 'ENTER eventId=' + eventId);
	
	//Set our collection to change current event key
	var currentCol = req.db.get("current");
	var currentTeamsCol = req.db.get("currentteams");
	var rankCol = req.db.get("currentrankings");
	
	//set up tba calls
	var client = req.client;
	var args = req.tbaRequestArgs;
	var teamsUrl = `https://www.thebluealliance.com/api/v3/event/${eventId}/teams`;
	var rankingsUrl = `https://www.thebluealliance.com/api/v3/event/${eventId}/rankings`;
	
	// Remove the previous 'current' data
	currentCol.remove({}, function(e, docs) {
		
		// Now, insert the new data
		currentCol.insert({"event": eventId}, function(e, docs) {
			
			//Now attempt to get list of teams at event from TheBlueAlliance
				
			//get teams from tba
			client.get(teamsUrl, args, function (teamsData, response) {
				
				var currentTeams = JSON.parse(teamsData);
				
				//delete contents of currentteams
				currentTeamsCol.remove({},function(){
					
					//2019-4-01 JL: Moved !currentTeams check to AFTER currentTeamsCol was emptied.
					
					if(!currentTeams){
						return res.redirect(`/admin?alert=Set current event ${eventId} successfully but NO TEAMS WERE ADDED TO THE SYSTEM`);
					}
					
					//insert teams into currentteams
					currentTeamsCol.insert(currentTeams, function(){
						
						//Now attempt to get rankings at event from TheBlueAlliance
						
						client.get(rankingsUrl, args, function(rankData, response){
							
							//clear currentrankings
							rankCol.remove({}, function () {
								
								//2019-04-1 JL: page now checks if rankings exist so server doesn't crash
								//if rankdata exists, insert, otherwise don't
								if (rankData && rankData != "null" && rankData[0]) {
									
									//get rankings
									var currentRankings = JSON.parse(rankData).rankings;
									
									//now, insert rankings whether it's empty or not
									rankCol.insert(currentRankings, function () {
										
										res.redirect(`/admin?alert=Set current event ${eventId} successfuly and got list of teams/rankings for event ${eventId} successfully.`);
									});
								}
								//if rankings don't exist, redirect w/o rankings info
								else{
									res.redirect(`/admin?alert=Set current event ${eventId} successfully and got list of teams for event ${eventId} successfully. NO RANKINGS HAVE BEEN RETRIEVED.`)
								}
							});
						});
					});
				})
			});
		});
	});
});

/** Page to generate sample data. Might not be necessary anymore?
 * @url /admin/generatedata
 * @redirect /
 */
router.get('/generatedata', function(req, res) {
	if( !require('../checkauthentication')(req, res, 'admin') ){
		return null;
	}
	var thisFuncName = "adminindex.generatedata[get]: ";
	res.log(thisFuncName + 'ENTER');
	
    // Set our internal DB variable
    var db = req.db;
	var scoreDataCol = db.get("scoringdata");
	var matchCol = db.get("matches");
	
	// for later querying by event_key
	var eventId = req.event.key;
	
	// Get the *min* time of the as-yet-unresolved matches [where alliance scores are still -1]
	matchCol.find({ event_key: eventId, "alliances.red.score": -1 },{sort: {"time": 1}}, function(e, docs){

		var earliestTimestamp = 9999999999;
		if (docs && docs[0])
		{
			var earliestMatch = docs[0];
			earliestTimestamp = earliestMatch.time;
		}
			
		// Get all the scoring data for RESOLVED matches
		scoreDataCol.find({"event_key": eventId, "time": { $lt: earliestTimestamp }}, { sort: {"time": 1} }, function (e, docs) {
			var scoringMatches = docs;
			if (scoringMatches)
			{
				res.log(thisFuncName + 'scoringMatches.length=' + scoringMatches.length);
				
				for (var scoreIdx = 0; scoreIdx < scoringMatches.length; scoreIdx++) {
					var thisTeamNum = parseInt(scoringMatches[scoreIdx].team_key.substring(3));
					var thisV1 = Math.floor(thisTeamNum / 1000);
					var thisV2 = Math.floor((thisTeamNum-(thisV1*1000)) / 100);
					var thisV3 = Math.floor((thisTeamNum-(thisV1*1000)-(thisV2*100)) / 10);
					var thisV4 = thisTeamNum-(thisV1*1000)-(thisV2*100)-(thisV3*10);
					
					var kFac = 4;
					thisV1 = Math.pow(kFac, (9 - thisV1)/9)/(kFac-1) - (1/(kFac-1)); thisV1 = Math.round(thisV1*1000)/1000;
					thisV2 = Math.pow(kFac, (9 - thisV2)/9)/(kFac-1) - (1/(kFac-1)); thisV2 = Math.round(thisV2*1000)/1000;
					thisV3 = Math.pow(kFac, (9 - thisV3)/9)/(kFac-1) - (1/(kFac-1)); thisV3 = Math.round(thisV3*1000)/1000;
					thisV4 = Math.pow(kFac, (9 - thisV4)/9)/(kFac-1) - (1/(kFac-1)); thisV4 = Math.round(thisV4*1000)/1000;
					res.log(thisFuncName + 'score[' + scoreIdx + ']: teamMatchKey=' + scoringMatches[scoreIdx].match_team_key + '... teamKey=' + scoringMatches[scoreIdx].team_key
						+ ": v1,v2,v3,v4 = " + thisV1 + ", " + thisV2 + ", " + thisV3 + ", " + thisV4);

					// object to be populated
					var data = {};

					//
					// 2019 SPECIFIC CODE
					//
// "data" : {  "sandstormStartLevel2" : 1, "sandstormCrossHabLine" : 0,
// 			"sandstormCargoShipPanel" : 1, "sandstormCargoShipCargo" : 2, "sandstormRocketPanel" : 3, "sandstormRocketCargo" : 6,
// 			"teleopCargoShipPanel" : 2, "teleopCargoShipCargo" : 0, "teleopRocketPanel" : 3, "teleopRocketCargo" : 1,
// 			"endgameAttemptedClimbLevel" : 3, "endgameActualScoredClimbLevel" : 1,
// 			"playedDefense" : 1, "playedCounterDefense" : 0,
// 			"diedDuringMatch" : 1, "recoveredFromFreeze" : 1,
// 			"otherNotes" : "These are some notes"

					// V1 ~ sandstorm, V2 ~ teleop
					// V3 ~ cargo ship, V4 ~ rocket
					var thisV5 = (thisV2 + thisV3) / 2;
					var thisV6 = (thisV1 + thisV4) / 2;
					// V5 ~ cargo, V6 ~ panels
					data.sandstormCargoShipPanel = Math.floor(Math.random() * (1-(thisV1+thisV3+thisV6)/3) * 4);
					data.sandstormCargoShipCargo = Math.floor(Math.random() * (1-(thisV1+thisV3+thisV5)/3) * 4);
					data.sandstormRocketPanel = Math.floor(Math.random() * (1-(thisV1+thisV4+thisV6)/3) * 4);
					data.sandstormRocketCargo = Math.floor(Math.random() * (1-(thisV1+thisV4+thisV5)/3) * 4);
					data.teleopCargoShipPanel = Math.floor(Math.random() * (1-(thisV2+thisV3+thisV6)/3) * 8);
					data.teleopCargoShipCargo = Math.floor(Math.random() * (1-(thisV2+thisV3+thisV5)/3) * 12);
					data.teleopRocketPanel = Math.floor(Math.random() * (1-(thisV2+thisV4+thisV6)/3) * 8);
					data.teleopRocketCargo = Math.floor(Math.random() * (1-(thisV2+thisV4+thisV5)/3) * 8);

					// V1 ~ sandstorm
					var sandstormFac = Math.random() * thisV1;
					data.sandstormStartLevel2 = 0; if (sandstormFac > .4) data.sandstormStartLevel2 = 1;
					data.sandstormCrossHabLine = 0; if (sandstormFac > .1) data.sandstormCrossHabLine = 1;

					// V2, V3 ~ climb
					var attemptedClimb = Math.random() * thisV2 * 3;
					var actualClimb = attemptedClimb * thisV3;
					data.endgameAttemptedClimbLevel = Math.floor(attemptedClimb);
					data.endgameActualScoredClimbLevel = Math.floor(actualClimb);

					// V4 ~ strategy
					var strategyFac = Math.random() * thisV4;
					data.playedDefense = 0; if (strategyFac < .1) data.playedDefense = 1;
					data.playedCounterDefense = 0; if (strategyFac > .6) data.playedCounterDefense = 1;

					// !(min of others) ~ issues
					var minV = Math.min(thisV1, thisV2, thisV3, thisV4);
					var maxV = Math.max(thisV1, thisV2, thisV3, thisV4);
					data.diedDuringMatch = 0; if (Math.random() * minV > .6) data.diedDuringMatch = 1;
					data.recoveredFromFreeze = 0; if (Math.random() * maxV > .2 && data.diedDuringMatch == 1) data.recoveredFromFreeze = 1;

					/*
					//
					// 2018 SPECIFIC CODE
					//
// "data" : { "autoTriedMove" : "true", "autoCrossedLine" : "true", "autoTriedSwitch" : "true", "autoScoredSwitch" : "false", "autoTriedScale" : "false", "autoScoredScale" : "false", 
//            "teleVault" : "4", "teleFouls" : "0", "teleBrokeDown" : "false",
//            "teleSwitch" : "2", "teleSwitchTipped" : "1", "teleScale" : "5", "teleScaleTipped" : "4", "teleOppSwitch" : "0", "teleOppSwitchTipped" : "0"
//            "endParked" : "true", "endClimbed" : "false", "endAssisted" : "false", "otherNotes" : "" }

					// V1 ~ strategy/success overall [fouls, broke down, opp switch]
					data.teleFouls = Math.floor(Math.random() * (1-thisV1) / 2);
					data.teleBrokeDown = 0; if (Math.random() * (1-thisV1) > .7) data.teleBrokeDown = 1;
					var oppSwitchTried = Math.random() * thisV1 * 8;
					var oppSwitchTipped = thisV3 * oppSwitchTried;
					data.teleOppSwitch = Math.floor(oppSwitchTried);
					data.teleOppSwitchTipped = Math.floor(oppSwitchTipped);
					
					// V2 ~ auto
					var autoFac = Math.random() * thisV2;
					data.autoTriedMove = 0; if (autoFac > .1) data.autoTriedMove = 1;
					data.autoCrossedLine = 0; if (autoFac > .2) data.autoCrossedLine = 1;
					data.autoTriedSwitch = 0; if (autoFac > .4) data.autoTriedSwitch = 1;
					data.autoScoredSwitch = 0; if (autoFac > .6) data.autoScoredSwitch = 1;
					data.autoTriedScale = 0; if (autoFac > .8) data.autoTriedScale = 1;
					data.autoScoredScale = 0; if (autoFac > .9) data.autoScoredScale = 1;
					
					// V3 ~ switch/scale
					var scaleFac = .3;
					var thisV3b = thisV3 - scaleFac; if (thisV3b < 0) thisV3b = 0;
					var switchTried = Math.random() * thisV3 * 10;
					var switchTipped = thisV1 * switchTried;
					var scaleTried = Math.random() * thisV3b * 16;
					var scaleTipped = thisV1 * scaleTried;
					data.teleSwitch = Math.floor(switchTried);
					data.teleSwitchTipped = Math.floor(switchTipped);
					data.teleScale = Math.floor(scaleTried);
					data.teleScaleTipped = Math.floor(scaleTipped);
					
					// V4 ~ vault, climbing
					var vault = Math.random() * thisV4 * 8;
					data.teleVault = Math.floor(vault);
					data.endParked = 0; data.endClimbed = 0; data.endAssisted = 0;
					var endVal = Math.random() * thisV4;
					if (endVal > .1 && endVal <= .6) data.endParked = 1;
					if (endVal > .6) data.endClimbed = 1;
					if ((Math.random() * thisV4) > .8) data.endAssisted = 1;
					*/

					// Note
					var notes = 'Autogenerated ' + thisV1 + ', ' + thisV2 + ', ' + thisV3 + ', ' + thisV4;
					data.otherNotes = notes;
					
					res.log(thisFuncName + "data=" + JSON.stringify(data));
					
					// write to database
					scoreDataCol.update({"match_team_key": scoringMatches[scoreIdx].match_team_key}, {$set: {"data": data}});
				}
				res.redirect('/');
			}
			else
			{
				res.log(thisFuncName + 'ERROR scoringMatches is null!!');
				res.redirect('/');
			}
		});
	});
});

module.exports = router;

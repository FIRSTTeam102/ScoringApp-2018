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
	
	res.render('./adminindex', { 
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
	
	// Remove the previous 'current' data
	currentCol.remove({}, function(e, docs) {
		
		// Now, insert the new data
		currentCol.insert({"event": eventId}, function(e, docs) {
			res.redirect(`/admin?alert=Set current event ${eventId} successfully. IMPORTANT: You must now make sure currentTeams are correct.`);
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
	var event_key = req.event.key;
	
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
					
					//
					// YEAR SPECIFIC CODE
					//
// "data" : { "autoTriedMove" : "true", "autoCrossedLine" : "true", "autoTriedSwitch" : "true", "autoScoredSwitch" : "false", "autoTriedScale" : "false", "autoScoredScale" : "false", 
//            "teleVault" : "4", "teleFouls" : "0", "teleBrokeDown" : "false",
//            "teleSwitch" : "2", "teleSwitchTipped" : "1", "teleScale" : "5", "teleScaleTipped" : "4", "teleOppSwitch" : "0", "teleOppSwitchTipped" : "0"
//            "endParked" : "true", "endClimbed" : "false", "endAssisted" : "false", "otherNotes" : "" }
					var data = {};

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

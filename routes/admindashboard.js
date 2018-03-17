var express = require('express');
var router = express.Router();

router.get("/", function(req, res) {
	var thisFuncName = "admindashboard root: ";
	
	// Log message so we can see on the server side when we enter this
	console.log(thisFuncName + "ENTER");
	
	var db = req.db;
	
	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
	var currentCol = db.get("current");
	var scoreDataCol = db.get("scoringdata");
	var matchCol = db.get("matches");

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

		// Get the *min* time of the as-yet-unresolved matches [where alliance scores are still -1]
		matchCol.find({ event_key: eventId, "alliances.red.score": -1 },{sort: {"time": 1}}, function(e, matches){
			
			// 2018-03-13, M.O'C - Fixing the bug where dashboard crashes the server if all matches at an event are done
			var earliestTimestamp = 9999999999;
			if (matches && matches[0])
			{
				var earliestMatch = matches[0];
				earliestTimestamp = earliestMatch.time;
			}
	
			console.log(thisFuncName + 'earliestTimestamp=' + earliestTimestamp);
	
			// Get all the RESOLVED matches
			scoreDataCol.find({"event_key": eventId, "time": { $lt: earliestTimestamp }}, { sort: {"assigned_scorer": 1, "time": 1, "alliance": 1, "team_key": 1} }, function (e, scoreData) {
				if(!scoreData)
					return console.error("mongo error at dashboard/matches");
				
				// Build per-team-member array
				var memberArr = [];
				var lastMember = 'NOLASTMEMBER';
				var thisMemberArr = [];
				if (scoreData && scoreData.length > 0) {
					for (var scoreIdx = 0; scoreIdx < scoreData.length; scoreIdx++) {
						var thisMember = scoreData[scoreIdx].assigned_scorer;
						if (thisMember != lastMember) {
							var thisRow = {};
							thisRow['member'] = lastMember;
							thisRow['record'] = thisMemberArr;
							if ('NOLASTMEMBER' != lastMember)
								memberArr.push(thisRow);
							
							lastMember = thisMember;
							thisMemberArr = [];
						}
						if (scoreData[scoreIdx].data)
							thisMemberArr.push("Y");
						else
							thisMemberArr.push("N");
					}
					// Write in the last set of records
					var thisRow = {};
					thisRow['member'] = lastMember;
					thisRow['record'] = thisMemberArr;
					memberArr.push(thisRow);
				}
					
				//console.log(thisFuncName + 'memberArr=' + JSON.stringify(memberArr));
				
				res.render('./admin/dashboard',{
					title: "Admin Dashboard",
					audit: memberArr
				});
				
				/*
				res.render('./dashboard/matches',{
					title: "Match Scouting",
					matches: scoreData
				});
				*/
			});
		});
	});
});

module.exports = router;

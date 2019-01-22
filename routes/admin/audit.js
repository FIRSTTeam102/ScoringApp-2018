var express = require('express');
var router = express.Router();

/**
 * Scoring audit page.
 * @url /admin/scoringaudit
 * @view /admin/index, /admin/scoringaudit
 */
router.get("/", function(req, res) {
	if(!require('../checkauthentication')(req, res, 'admin')){
		return null;
	}
	
	res.log("Scoring audit: enter");
		
	var scoreDataCol = req.db.get("scoringdata");
	var matchCol = req.db.get("matches");
	
	var eventId = req.event.key;

	// Get the *min* time of the as-yet-unresolved matches [where alliance scores are still -1]
	matchCol.find({ event_key: eventId, "alliances.red.score": -1 },{sort: {"time": 1}}, function(e, matches){
		
		// 2018-03-13, M.O'C - Fixing the bug where dashboard crashes the server if all matches at an event are done
		var earliestTimestamp = 9999999999;
		if (matches && matches[0])
		{
			var earliestMatch = matches[0];
			earliestTimestamp = earliestMatch.time;
		}
		
		res.log("Scoring audit: earliestTimestamp=" + earliestTimestamp);
		
		// Get all the RESOLVED matches
		scoreDataCol.find({"event_key": eventId, "time": { $lt: earliestTimestamp }}, { sort: {"assigned_scorer": 1, "time": 1, "alliance": 1, "team_key": 1} }, function (e, scoreData) {
			if(!scoreData)
				throw new Error("mongo error at dashboard/matches");
			
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
						if (scoreData[scoreIdx].assigned_scorer == scoreData[scoreIdx].actual_scorer)
							thisMemberArr.push("Y");
						else
							// 2018-03-22, M.O'C: Adding parent option
							if (scoreData[scoreIdx].actual_scorer.toLowerCase().startsWith('mr') || 
								scoreData[scoreIdx].actual_scorer.toLowerCase().startsWith('mrs') || 
								scoreData[scoreIdx].actual_scorer.toLowerCase().startsWith('ms'))
								thisMemberArr.push("P");
							else
								thisMemberArr.push("C");
					else
						thisMemberArr.push("N");
				}
				// Write in the last set of records
				var thisRow = {};
				thisRow['member'] = lastMember;
				thisRow['record'] = thisMemberArr;
				memberArr.push(thisRow);
			}
			
			res.render('./admin/audit',{
				title: "Scoring Audit",
				audit: memberArr
			});
		});
	});
});

module.exports = router;

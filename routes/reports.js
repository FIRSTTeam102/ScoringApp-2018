var express = require("express");
var router = express.Router();

router.get("/upcoming", function(req, res){
	
	if(!req.query || !req.query.teamKey ||!req.query.eventKey){
		teamKey = 102;
		eventKey = 'current';
	}
	
	var matches = req.db.get("matches");
	
	matches.find({ event_key: req.event.key }, {sort: {time: 1}}, function(e, matches){
		
		res.render('./reports/upcoming', {
			matches: matches
		});
		
	});
});

module.exports = router;
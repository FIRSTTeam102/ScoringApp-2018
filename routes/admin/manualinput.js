var express = require('express');
var router = express.Router();
router.get('/matches', function(req, res) {
	
	var thisFuncName = "manualinputs.matches[get]: ";
	console.log(thisFuncName + 'ENTER');
	
	var db = req.db;
	var currentCol = db.get("current");
	var matchCol = req.db.get('matches');
	
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
		console.log(thisFuncName + 'event_key=' + event_key);

		// Match history info
		//matchCol.find({"alliances.red.score": { $ne: -1}, "event_key" : event_key}, {sort: {time: -1}}, function (e, docs) {
		matchCol.find({"event_key" : event_key}, {sort: {time: 1}}, function (e, docs) {
			var matches = docs;
			//console.log(thisFuncName + 'matches=' + JSON.stringify(matches));
			res.render("./manualinputs/matches", {
				title: "Matches",
				matches: matches
			});
		});			
	});
	
//res.send('Hello World')
});
router.post('/matches', function(req, res){
	res.send(req.body);
});
module.exports = router 
var express = require('express');
var router = express.Router();

// Solely for Admin index - any actual business logic functionality
// should be inside a separate JS file, for example 'scoutingpairs.js'

/* GET index page. */
router.get('/', function(req, res) {
	var thisFuncName = "adminindex.{root}[get]: ";
	console.log(thisFuncName + 'ENTER');
	
    // Set our internal DB variable & the 'current' collection
    var db = req.db;
	var currentCol = db.get("current");
	
	if( !require('./checkauthentication')(req, res, 'admin') ){
		console.log(thisFuncName + 'returning null');
		return null;
	}
	
	// get the 'current' event from DB
	currentCol.find({}, {}, function(e, docs) {
		var currentEvent = 'No event defined';
		if (docs)
		{
			console.log(thisFuncName + 'docs=' + JSON.stringify(docs));
			if (docs.length > 0)
			{
				console.log(thisFuncName + 'docs[0]=' + JSON.stringify(docs[0]));
				currentEvent = docs[0].event;
			}
		}
		console.log(thisFuncName + 'currentEvent=' + currentEvent);
		
		console.log(thisFuncName + 'rendering ./adminindex');
		res.render('./adminindex', { 
			title: 'Admin pages',
			current: currentEvent
		});
	});
});

router.post('/setcurrent', function(req, res) {
	var thisFuncName = "adminindex.setcurrent[post]: ";
	var eventId = req.body.eventId;
	console.log(thisFuncName + 'ENTER eventId=' + eventId);
	
    // Set our internal DB variable
    var db = req.db;

	var currentCol = db.get("current");
	
	// Remove the previous 'current' data
	currentCol.remove({}, function(e, docs) {
		// Now, insert the new data
		currentCol.insert({"event": eventId}, function(e, docs) {
			res.render('./adminindex', { 
				title: 'Admin pages' 
			});
		});
	});
});

module.exports = router;

var express = require('express');
var router = express.Router();

// Solely for Admin index - any actual business logic functionality
// should be inside a separate JS file, for example 'scoutingpairs.js'

/* GET index page. */
router.get('/', function(req, res) {
	
	if( !require('./checkauthentication')(req, res, 'admin') ){
		return null;
	}
	
	res.render('./adminindex', { 
		title: 'Admin pages' 
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

var express = require('express');
var router = express.Router();

//DON'T keep other pages inside index!!! When we have a working scoring app, I 
//don't want any of our pages inside index.js!!
//-Jordan

//P.S. Make sure to comment everything!
//And make sure to handle errors!

//GET index page.
router.get('/', function(req, res) {
	
	//If there's been a GET request, prepare an alert
	if(req.query)
		var alert = req.query.alert || null;
	
	res.render('./index', { 
		tournament: req.tournament.id, 
		title: 'Home',
		alert: alert
	});
  
});

router.get("/logout", function(req, res) {
	
	//Logs out user with message
	req.logout();
	
	res.redirect('/?alert=Logged out successfully.')
});

module.exports = router;
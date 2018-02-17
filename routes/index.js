var express = require('express');
var router = express.Router();

//DON'T keep other pages inside index!!! When we have a working scoring app, I 
//don't want any of our pages inside index.js!!
//-Jordan

//P.S. Make sure to comment everything!
//And make sure to handle errors!

//GET index page.
router.get('/', function(req, res) {
    
	res.render('./index', { 
		tournament: 'Sample Tournament Title', 
		title: 'Home'
	});
  
});

router.get("/logout", function(req, res) {
	req.logout();
	res.render('./index', {
		tournament: 'Sample Tournament Title',
		title: 'Home',
		message: "Logged out successfully."		
	});
});

module.exports = router;
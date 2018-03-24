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
	
	req.db.get('currentrankings').find({},{},function(e, rankings){
		var teamList = [];
		
		if(e || !rankings || !rankings[0]){
			console.error(e || "No current rankings");
			return res.render('./index', { 
				title: 'Home',
				alert: alert
			});
		}
		
		for(var i = 0; i < rankings.length; i++){
			teamList[i] = parseInt(rankings[i].team_key.substring(3));
		}
		teamList.sort(function(a,b){
			if(a < b)
				return -1;
			if(a > b)
				return 1;
			// a must be equal to b
			return 0;
		})
		
		res.render('./index', { 
				title: 'Home',
				teamList: teamList,
				alert: alert
		});
	});
	

	//console.log("Completed page in "+(Date.now()-req.requestTime)+" ms");
  
});

router.get("/logout", function(req, res) {
	
	//Logs out user with message
	req.logout();
	
	res.redirect('/')
});

module.exports = router;
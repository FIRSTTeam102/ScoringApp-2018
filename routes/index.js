var express = require('express');
var router = express.Router();

/**
 * Main homepage.
 * @url /
 * @view /index
 */
router.get('/', function(req, res) {
	
	//Prepare an alert. (Used w/ url /?alert=(alert))
	if(req.query)
		var alert = req.query.alert || null;
	
	//Searches through rankings to provide team num. dropdown
	req.db.get('currentrankings').find({},{},function(e, rankings){
		var teamList = [];
		
		//If error or no rankings, render home w/o list
		if(e || !rankings || !rankings[0]){
			res.log(e || "No current rankings");
			return res.render('./index', { 
				title: 'Home',
				alert: alert
			});
		}
		//Goes through rankings list and picks out team numbers from team_key
		for(var i = 0; i < rankings.length; i++){
			teamList[i] = parseInt(rankings[i].team_key.substring(3));
		}
		//Sorts team list by number (originally by rank)
		teamList.sort(function(a,b){
			if(a < b)
				return -1;
			if(a > b)
				return 1;
			// a must be equal to b
			return 0;
		})
		//Renders page w/ team list
		res.render('./index', { 
				title: 'Home',
				teamList: teamList,
				alert: alert
		});
	});
});

/**
 * Simple logout link. (if I put it in login, url would be /login/logout... and cmon that's silly)
 * @url /logout
 * @redirect /
 */
router.get("/logout", function(req, res) {
	
	//Logs out user with message
	req.logout();
	
	//Redirects user
	res.redirect('/')
});

module.exports = router;
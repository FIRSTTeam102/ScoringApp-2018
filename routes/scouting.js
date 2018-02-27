var express = require('express');
var router = express.Router();

router.get('/', function(req, res){
	
	res.redirect('/scouting/survey');
	
});

router.get('/survey', function(req, res){
	
	res.render('./scouting/survey',{
		title: "Scouting Survey",
		team: 102
	});
	
});

router.post('/survey', function(req, res){
	
	res.redirect('/scouting/survey');
	
});

module.exports = router;
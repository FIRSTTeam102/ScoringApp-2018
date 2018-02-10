var express = require('express');
var router = express.Router();

router.get('/scouter', function(req, res) {
	
  res.render('./login', { 
		tournament: 'Sample Tournament Title',
		title: "Scouter Login",
		submitLink: "scouter-submit"
	});
  
  
});

router.post('/scouter-submit', function(req, res) {
	
	var name = req.body.name;
	var pass = req.body.passwd;
	
	console.log(name);
	console.log(pass);
	
	res.redirect("/login/scouter");
	
});

router.get('/admin', function(req, res) {
	
  res.render('./login', { 
  
		tournament: 'Sample Tournament Title',
		title: "Admin Login",
		submitLink: "admin-submit"
	});
  
});

router.post('/admin-submit', function(req, res) {
	
	
	
});

module.exports = router;
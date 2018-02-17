var express = require('express');
var router = express.Router();

router.get('/scouter', function(req, res) {
	
  res.render('./login', { 
		tournament: 'Sample Tournament Title',
		title: "Scouter Login",
		submitLink: "scouter"
	});
  
  
});

router.post('/scouter', function(req, res) {
	
	var name = req.body.name;
	var pass = req.body.passwd;
	
	console.log(name);
	console.log(pass);
	
	res.redirect("/login/scouter");
	
});

router.get('/admin', function(req, res) {
	console.log("hi");
	
	res.render('./login', { 
		tournament: 'Sample Tournament Title',
		title: "Admin Login",
		submitLink: "admin", //no longer used
		error: "false"
	});
  
});

router.post('/admin', function(req, res) {
	
	if(req.body.username == "test" && req.body.password == "pass"){
		req.cookies.isLoggedIn = "true";
		console.log("logged in");
		res.redirect("/admin");
	}else{
		req.cookies.isLoggedIn = "false";
		console.log("not logged in");
		
		res.render('./login', {
			tournament: 'Sample Tournament Title',
			title: "Admin Login",
			submitLink: "admin",
			error: "true"
		});
	}
	res.end();
});

module.exports = router;
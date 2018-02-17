var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

router.get('/adduser', function(req, res){
	
	
	
	res.render('./login', { 
		tournament: 'sdlfkjdslk',
		title: "Create User"
	});
	
});
router.post('/adduser', function(req, res){
	
	var name = req.body.username;
	var pass = req.body.password;
	
	console.log(name);
	console.log(pass);
	
	const saltRounds = 10;
	const myPlaintextPassword = pass;
	const someOtherPlaintextPassword = 'not_bacon';
	
	bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
		// Store hash in your password DB.
		
		var db = req.db;
		var collection = db.get("adminusers");
		
		collection.insert({
			"username": name,
			"password": hash
		});
	});
	
	res.redirect('/login/adduser');
});

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
	
	var username = req.body.username;
	var password = req.body.password;
	
	var db = req.db;
	var collection = db.get("adminusers");
	
	collection.find({
		"username": username
	},{}, function(err, user){
		if(err){console.log(err);}
		
		if(user[0] != undefined){
			var hash = user[0].password;
			console.log(hash);
			
			bcrypt.compare( password, hash, function(err, output){
				if(err){console.log(err);}
				
				if(output == true){
					res.send("LOGGED IN");
				}else{
					res.send("NOT LOGGED IN");
				}
			});
			
		}else{
			res.send("USER DOES NOT EXIST");
		}
	});
	
	/*
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
	*/
});

module.exports = router;
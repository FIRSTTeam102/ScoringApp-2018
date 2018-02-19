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
	
	res.render('./login', { 
		tournament: req.tournament.id,
		title: "Admin Login"
	});
  
});

router.post('/admin', function(req, res) {
	
	//if form is empty, alert w/ plz login
	if(!req.body.password || !req.body.username){
		res.render('./login', {
			tournament: req.tournament.id,
			title: "Admin Login",
			alert: "Please enter a username and password."
		});
	}
	//Request auth for user.
	console.log("Requesting authentication for user: " + req.body.username || "error" );
	
	req.passport.authenticate("local", function(err, user, info) {
            
			// if any problems exist, error out
            if (err) {
				return err;
            }
			
			//If user isn't passed, render login with the error message.
            if (!user) {
				var alert = info.alert || null;
				
                return res.render('./login', {
					tournament: req.tournament.id,
					title: "Admin Login",
					alert: alert
				});
            }

            // log in the user
            req.logIn(user, function(err) {
                if (err) {
                    return err;
                }
                // once login succeeded, send user to admin page
                return res.redirect('/admin');
            });
        })(req, res);
	
});

router.get('/secret'), function(req, res){
	
	//checks auth
	if( !require('./checkauthentication')(req, res, 'admin') ){
		return null;
	}
	res.send("you got into the secret");
});

module.exports = router;

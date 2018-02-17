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
	
	if( !require('./checkAuthentication')(req, res) ){
		return null;
	}
	
	
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
	console.log(username + password);
	var db = req.db;
	var collection = db.get("adminusers");
	
	//console.log(req.passport);
	//console.log(req.passport.authenticate);
	console.log("requesting passport authenticate");
	
	req.passport.authenticate("local", function(err, user, info) {
            // if any problems exist, error out
            if (err) {
                return err;
            }
            if (!user) {
                return res.send(500, info.message);
            }

            // log in the user
            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }
                // once login succeeded, return the user and session created 201
                return res.send(201, user);
            });
        })(req, res);
	
	/*
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
	*/
});

router.get("/logout", function(req, res) {
        req.logout();
        res.send(200, {
            status: "OK"
        });
    });

module.exports = router;
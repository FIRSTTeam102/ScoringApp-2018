var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

router.get('/adduser', function(req, res){
	
	if( !require('./checkauthentication')(req, res, 'admin') ){
		return null;
	}
	
	res.render('./adduser', { 
		title: "Create Admin User"
	});
	
});

router.get('/scouter', function(req, res) {
	
	//If there's been a GET request, prepare an alert
	if(req.query)
		var alert = req.query.alert || null;
	
	var teammembers = req.db.get("teammembers");
	
	//gets all users and spits them on dropdown
	teammembers.find( {}, {sort:{ "password": -1, "name": 1}}, function(e, users){
		
		if(e){
			console.log(e);
			return res.send(500);
		}
		return res.render('./login', { 
			title: "Scouter Login",
			members: users,
			alert: alert
		});
	});
});

router.get('/admin', function(req, res) {

	//If there's been a GET request, prepare an alert
	if(req.query)
		var alert = req.query.alert || null;
	
	
	//Get a list of all admin/exec members
	var teammembers = req.db.get("teammembers");
	
	teammembers.find( {subteam: {$in: ["exec", "support"]} }, {sort: { password: -1, name: 1}}, function(e, users){
		
		if(e){
			console.log(e);
			return res.send(500);
		}
		
		return res.render('./login', { 
			title: "Admin Login",
			members: users,
			alert: alert
		});
	});  
});

router.post('/scouter', function(req, res) {
	
	//if form is empty, alert w/ plz login
	if(!req.body.password || !req.body.username){
		return res.redirect('./scouter?alert=Please select a name and enter a password.');
	}
	//Request auth for user.
	console.log("Requesting authentication for user: " + req.body.username || "error" );
	
	req.passport.authenticate("local", function(err, user, info) {
            
			// if any problems exist, error out
            if (err) {
				res.send(500);
				console.log(err);
				return err;
            }
			
			//If user isn't passed, render login with the error message.
            if (!user) {
				var alert = info != undefined ? info.alert || null : null;
				
                return res.redirect('./scouter?alert='+alert);
            }
			
            // log in the user
            req.logIn(user, function(err) {
                if (err) 
					return err;
				
				//if logged in, redirect to scoring app (CURRENTLY INDEX)
				return res.redirect('/');
				
            });
        })(req, res);
	
});

router.post('/admin', function(req, res) {
	
	//if form is empty, alert w/ plz login
	if(!req.body.password || !req.body.username){
		return res.redirect('./admin?alert=Please select a name and enter a password.');
	}
	//Request auth for user.
	console.log("Requesting authentication for user: " + req.body.username || "error" );
	
	req.passport.authenticate("local", function(err, user, info) {
            
			// if any problems exist, error out
            if (err) {
				res.send(500);
				console.log(err);
				return err;
            }
			
			//If user isn't passed, render login with the error message.
            if (!user) {
				var alert = info != undefined ? info.alert || null : null;
				
                return res.redirect('./admin?alert='+alert);
            }
			
            // log in the user
            req.logIn(user, function(err) {
                if (err) 
					return err;
                
				if( user.subteam == 'support' || 'exec'){
					
					//if user is admin (support) send to admin page
					return res.redirect('/admin');
				}
				else{
					//if subteam isn't support, redirect to home with message
					return res.redirect('/?alert=Scouters have to log in with the Scouter login page.');					
				}
            });
        })(req, res);
});

router.get('/secret', function(req, res){
	
	//checks auth
	if( !require('./checkauthentication')(req, res, 'admin') ){
		return null;
	}
	res.send("you got into the secret");
});

router.post('/adduser', function(req, res){
	
	//set all attributes that will go into the new user
	var name = req.body.username;
	var subteam = "support";
	var className = req.body.className;
	var years = req.body.years;
	var present = "true";
	var txtPassword = req.body.password;
	
	//if not all the forms are full, reload page
	if(name == null || className == null || years == null || txtPassword == null){
		
		return res.render('./adduser', { 
			title: "Create Admin User",
			alert: "You must fill all parameters"
		});
	}
	
	var teammembers = req.db.get("teammembers");
	
	teammembers.findOne( { "name": name }, {}, function( e, user ){
		
		//if user already exists, reload w/ warning thingy
		if( user != null ){
			return res.render('./adduser', { 
				title: "Create Admin User",
				alert: "Error: User already exists."
			});
		}
		const saltRounds = 10;
		
		bcrypt.hash(txtPassword, saltRounds, function(err, hash) {
			
			//if error, err out
			if(err){
				console.log(err);
				return res.send(500);
			}
						
			teammembers.insert({
				"name": name,
				"subteam": subteam,
				"className": className,
				"years": years,
				"present": present,
				"password": hash
			});
			
			return res.render('./adduser', { 
				title: "Create Admin User",
				alert: "User" + name + " created successfully."
			});
		});
	});
});

module.exports = router;

var passport = require('passport');
var bcrypt = require('bcrypt');					//bcrypt for password encryption
var LocalStrategy = require('passport-local').Strategy; //strategy for passport
var monk = require('monk');

const fs = require("fs");

//check if we have a db user file
var hasDBUserFile = fs.existsSync(".dbuser");
var db;

if(hasDBUserFile){
        var dbUser = JSON.parse(fs.readFileSync(".dbuser", {"encoding": "utf8"}));
        db = monk(`${dbUser.username}:${dbUser.password}@localhost:27017/app`);
}
else{
        db = monk("localhost:27017/app");                       //Local db on localhost without authentication
}

//Configure local strategy for use by Passport.
passport.use(new LocalStrategy(
	function(username, password, done) {
		
		var teammembers = db.get("teammembers");
		
		teammembers.findOne( { "name": username } ,{}, function(err, user){
			
			if(err) 
				return done(err);
									
			if(user == undefined){
				
				//if user doesn't exist in database
				return done(null, false, {
					alert: "Unknown user: " + username
				});
			}
			else{
				//if user exists:
				//initialize because we'll get hash from two different possible ways
				var hash;
				
				if( user.password == undefined ){
					
					//if db user doesn't have a pass, something must be wrong with the db collection
					return done("User in database has no password?");
				}			
				if( user.password == "default"){
					
					//if it's a scouter, get password from passwords database
					var passwords = db.get("passwords");
					
					passwords.findOne( { name: "default" }, {}, function(err, doc){
												
						if(err)
							return done(err);
						if(!doc)
							return done("Password document or collection does not exist");
						
						hash = doc.password;
						
						//Do bcrypt comparison. It will return done obj so we want to return the result.
						return compare( password, hash, user, done );
						
					});
				}
				else{
					//if user exists and password is not default, get the stored hash
					hash = user.password;
					
					//Do bcrypt comparison. It will return done obj so we want to return the result.
					return compare( password, hash, user, done );
				}
			}	
		});
	}));

function compare( password, hash, user, done ){
	
	//Compare hash to entered password
	bcrypt.compare( password, hash, function(err, output){
		
		if(err){
			
			//if there's been an error, then error out
			console.log(err);
			return done(err);
		}
		if(output == true){
			
			//if authentication passes, return user
			console.log(user);
			return done(null, user);
		}
		else{
			
			//if output is not true, then return alert w/ invalid password
			return done(null, false, {
				alert: "Invalid password."
			});
		}
	});
}
	
// Creates the data necessary to store in the session cookie
passport.serializeUser(function(user, done) {
	//if we switch to mongoose, change to done(null, user.id);
	console.log("serializeUser:"+user._id);
    done(null, user._id);
});

// Reads the session cookie to determine the user from a user ID
passport.deserializeUser(function(id, done) {
	
	/*if we switch to mongoose, change to 
	[schema name].findById(id, function (err, user) {
        done(err, user);
    });
	*/
	
	var mid = monk.id(id);
	var teammembers = db.get("teammembers");
	
	teammembers.findOne( { "_id": mid }, {}, function(err, user){
		
		if(!user || err)
			console.error( err || "User not found in db: deserializeUser " + id);
		else
			done(null, user);
	});
	//done(null, id);
});

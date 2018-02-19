var passport = require('passport');
var bcrypt = require('bcrypt');					//bcrypt for password encryption
var LocalStrategy = require('passport-local').Strategy; //strategy for passport
var monk = require('monk');
var db = monk("localhost:27017/local");


//Configure local strategy for use by Passport.
passport.use(new LocalStrategy(
	function(username, password, done) {
		console.log("AUTHENTICATE CALLED");
		
		var collection = db.get("teammembers");
		
		collection.find( { "name": username } ,{}, function(err, user){
			
			if(err) 
				console.log(err);
			console.log("user: " + username);
			console.log("pass: " + password);
			
			if(user[0] != undefined){
				
				if(!user.password){
					//it's a team member, do stuff
				}
				
				//if user exists and password exists, get the stored hash
				user = user[0];
				var hash = user.password;
				console.log("Comparing info for hash: " + hash);
				
				bcrypt.compare( password, hash, function(err, output){
					if(err){
						console.log(err);
						return done(err);
					}
					//if authentication passes,
					if(output == true){
						console.log(user);
						console.log(user._id);
						return done(null, user);
					}else{
						return done(null, false, {
							alert: "Invalid password."
						});
					}
				});
				
			}else{
				return done(null, false, {
					alert: "Unknown user: " + username
				});
			}
		});
}));

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
	var collection = db.get("teammembers");
	
	collection.find( { "_id": mid }, {}, function(err, user){
		
		if(!user[0] || err)
			console.log( err || "User not found in db: deserializeUser " + id);
		else
			done(null, user[0]);
	});
	//done(null, id);
});

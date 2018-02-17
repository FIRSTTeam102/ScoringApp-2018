var passport = require('passport');
var bcrypt = require('bcrypt');					//bcrypt for password encryption
var LocalStrategy = require('passport-local').Strategy; //strategy for passport
var db = require('monk')("localhost:27017/local");


//Configure local strategy for use by Passport.
passport.use(new LocalStrategy(
	function(username, password, done) {
		console.log("AUTHENTICATE CALLED");
		
		var collection = db.get("adminusers");
		
		collection.find({
			"username": username
		},{}, function(err, user){
			if(err){console.log(err);}
			
			if(user[0] != undefined){
				//if user exists, get the stored hash
				var hash = user[0].password;
				console.log("Comparing info for hash: " + hash);
				
				bcrypt.compare( password, hash, function(err, output){
					if(err){
						console.log(err);
						return done(err);
					}
					
					if(output == true){
						return done(null, username);
					}else{
						return done(null, false, {
							message: "Invalid password"
						});
					}
				});
				
			}else{
				return done(null, false, {
					message: "Unknown user: " + username
            }	);
			}
		});
}));

// Creates the data necessary to store in the session cookie
passport.serializeUser(function(username, done) {
	//if we switch to mongoose, change to done(null, user.id);
    done(null, username);
});

// Reads the session cookie to determine the user from a user ID
passport.deserializeUser(function(id, done) {
	
	/*if we switch to mongoose, change to 
	[schema name].findById(id, function (err, user) {
        done(err, user);
    });
	*/
	/*var collection = db.get("adminusers");
	collection.find({ "_id": id }, function(user){
		done(null, user);
	});*/
	done(null, id);
});

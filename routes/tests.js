var express = require('express');
var router = express.Router();

//DON'T keep other pages inside index!!! When we have a working scoring app, I 
//don't want any of our pages inside index.js!!
//-Jordan

//P.S. Make sure to comment everything!
//And make sure to handle errors!

/* GET index page. */
router.get('/', function(req, res) {
  res.render('./tests', { title: 'Tests page' });
});

router.get('/buttons', function(req, res) {
  res.render('./tests/buttons', { title: 'Buttons' });
});

router.get("/angular", function(req, res) {
	res.render("./tests/angular", {title: "Angular"});
});

router.get("/tables", function(req, res) {
	//res.render("./tests/table", {title: "Tables"});
	
	var db = req.db;
	
	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
	//Gets collection ("table") from db
	var collection = db.get("teammembers");
	var progTeam;
	var mechTeam;
	var elecTeam;
	
	//Searches for and sets variables for each subteam.
	//Each subteam var is an array with team member names inside.
	collection.find({"subteam":"prog"},{}, function(e, docs){
		
		if(e){ //if error, log to console
			console.log(e);
		}
		progTeam = docs;
		collection.find({"subteam":"mech"},{}, function(e, docs){
			mechTeam = docs;
			collection.find({"subteam":"elec"},{}, function(e, docs){
				elecTeam = docs;
				
				//Renders page through Jade.
				res.render("./tests/table", {
					title: "Tables",
					prog: progTeam,
					mech: mechTeam,
					elec: elecTeam
					});
			});
		});
	});
});

router.get('/mongo', function(req, res) {
    var db = req.db;
    var collection = db.get('test');
    collection.find({},{},function(e,data){
        res.render('./mongo/users', {
            "title": "Mongo Test", "userlist": data
        });
    });
});

router.get("/newuser", function(req, res) {
});

router.get("/newuser", function(req, res) {
	res.render("./mongo/newuser", { "title": "New User" });
});

router.post("/adduser", function(){});

module.exports = router;

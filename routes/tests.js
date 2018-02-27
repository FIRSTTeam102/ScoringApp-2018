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

router.get("/tables", function(req, res) {
	//res.render("./tests/table", {title: "Tables"});
	
	var db = req.db;
	
	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
	//Gets teammembers ("table") from db
	var teammembers = db.get("teammembers");
	var progTeam;
	var mechTeam;
	var elecTeam;
	
	//Searches for and sets variables for each subteam.
	//Each subteam var is an array with team member names inside.
	teammembers.find({"subteam":"prog","present":"true","assigned":"false"},{}, function(e, docs){
		
		if(e){ //if error, log to console
			console.log(e);
		}
		progTeam = docs;
		
		teammembers.find({"subteam":"mech","present":"true","assigned":"false"},{}, function(e, docs){
			mechTeam = docs;
			teammembers.find({"subteam":"elec","present":"true","assigned":"false"},{}, function(e, docs){
				elecTeam = docs;
				
				// Get assigned pairs
				var teammembers2 = db.get("assignedpairs");
				teammembers2.find({}, {}, function (e, docs) {;
					assigned = docs;
					
					//Renders page through Jade.
					res.render("./tests/table", {
						title: "Tables",
						prog: progTeam,
						mech: mechTeam,
						elec: elecTeam,
						assigned: assigned
					});
				});
			});
		});
	});
});

/* POST to Set MemberPair Service */
router.post('/setmemberpair', function(req, res) {
	// Log message so we can see on the server side when we enter this
	console.log("setmemberpair: ENTER");

    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes of form elements (e.g., named 'data' in the form)
	// We log the raw data
    var data = req.body.data;
    console.log(data);
	// The javascript Object was JSON.stringify() on the client end; we need to re-hydrate it with JSON.parse()
	var selectedMembers = JSON.parse(data);
	//var insertArray = [];
	//insertArray["pair"] = selectedMembers;

	////// Update selected teams to reflect the newly-picked team
	
    // Set teammembers to 'assignedpairs'
    var teammembers = db.get('assignedpairs');
	
	// Submit to the DB
	teammembers.insert(selectedMembers);
	
	////// Update members in 'teammembers' so that they're marked as "assigned" (and won't be available to choose afterwards)
	
    // Set teammembers to 'teammembers'
    var teammembers = db.get('teammembers');

    // Submit to the DB
	for (var member in selectedMembers)
	{
		teammembers.update(
			{ "name" : member },
			{ $set: { "assigned" : "true" } }
		)
	}
	
	console.log("setmemberpair: REDIRECTING");
	res.redirect("tables");
	console.log("setmemberpair: DONE");
});

router.post("/deletememberpair", function(req, res) {
	var db = req.db;
	
	var data = req.body.data;
	
	var teammembers = db.get("assignedpairs");
	
	teammembers.find({"_id": data}, {}, function(e, docs){
		
		if(e){ //if error, log to console
			console.log(e);
		}
		thisPair = docs;
		console.log("thisPair=" + thisPair);

		var teammembers2 = db.get('teammembers');
		
		for (var member in thisPair[0])
		{
//			console.log('member=' + member);
			
			if (member != "_id")
			{
				teammembers2.update(
					{ "name" : member },
					{ $set: { "assigned" : "false" } }
				)
			}
		}
		
		teammembers.remove({"_id": data});
	
		res.redirect("tables");		
	});
});

router.get('/mongo', function(req, res) {
    var db = req.db;
    var teammembers = db.get('test');
    teammembers.find({},{},function(e,data){
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

router.post("/updatemember", function(req, res){
	var db = req.db;
	
	if (db._state == "closed"){
		res.render("./error",{
			message: "database error: offline",
			error: {status: "if the database is running, try restarting the node server"}
		});
	}
	
	var teammembers = db.get("teammembers");
	
	var memberId = req.body.memberId;
	var name = req.body.name;
	var subteam = req.body.subteam;
	var className = req.body.className;
	var years = req.body.years;
	console.log({memberId, name, subteam, className, years});
	
	teammembers.update({"_id": memberId}, {$set: {"name": name, "subteam": subteam, "className": className, "years": years}});
	
	res.redirect("/tests/maintainmembers");
});

router.get("/maintainmembers", function(req, res) {
	var db = req.db;
	
	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
	//Gets teammembers ("table") from db
	var teammembers = db.get("teammembers");	
	
	teammembers.find({},{}, function(e, docs){
		
		if(e){ //if error, log to console
			console.log(e);
		}
		teamMembers = docs;
		
		res.render("./tests/members", { "members": teamMembers });
	});
});

router.post("/addmember", function(req, res){
	var db = req.db;
	
	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
	var teammembers = db.get("teammembers");
	
	var name = req.body.name;
	var subteam = req.body.subteam;
	var className = req.body.className;
	var years = req.body.years;
	
	teammembers.insert({"name": name, "subteam": subteam, "className": className, "years": years});
	
	res.redirect("/tests/maintainmembers");
});

router.get("/showpartnersformember", function(req, res) {
	var db = req.db;

	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
	var assignedMembers;
	
	var teammembers = db.get("teammembers");
	teammembers.find({"assigned":"true"}, {sort: {"name": 1}}, function(e, docs){
		if(e){ //if error, log to console
			console.log(e);
		}
		assignedMembers = docs;
		console.log(assignedMembers);
		//Renders page through Jade.
		res.render("./tests/showpartnersformember", {
			members: assignedMembers
		});
	});
});

router.post("/setmembertoseepartners", function(req, res) {
	var db = req.db;

	var assignedMembers;
	var scoutingTeam;

	var name = req.body.name;
	console.log("tests.setmembertoseepartners: name=" + name);
	
	var teammembers = db.get("teammembers");
	teammembers.find({"assigned":"true"}, {sort: {"name": 1}}, function(e, docs){
		if(e){ //if error, log to console
			console.log(e);
		}
		assignedMembers = docs;
		
		//Gets the current set of already-assigned pairs
		//Search them for a match
		var scoutingpairs = db.get("scoutingpairs");
		scoutingpairs.find({}, {}, function (e, docs) {
			if(e){ //if error, log to console
				console.log(e);
			}
			
			for (var pairNum in docs) {
				//console.log("tests.setmembertoseepartners: pair=" + pair);
				
				var pair = docs[pairNum];
				console.log(pair);
				var matched = false;
				var selectedArray = [];
				var pairId;
				
				for( var key in pair ){
					
					if (key == "_id"){
						pairId=pair[key];
					}
					else{
						selectedArray.push(" " + pair[key]);
						if (pair[key] == name) matched = true;
					}
				}				
				if (matched == true)
					scoutingTeam = selectedArray.toString();
			}
			
			//scoutingTeam = docs;
			console.log("tests.setmembertoseepartners: scoutingTeam = " + scoutingTeam);

			//Renders page through Jade.
			res.render("./tests/showpartnersformember", {
				members: assignedMembers,
				scouting: scoutingTeam
			});
		});
	});	
});

router.get("/testurlparams", function(req, res) {
	var db = req.db;

	var id = req.query.id;
	var foo = req.query.foo;
	console.log("tests.setmembertoseepartners: id=" + id + ",foo=" + foo);
	
    res.render('./tests', { title: foo	 });
});
	
module.exports = router;

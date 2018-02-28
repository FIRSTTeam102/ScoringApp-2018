var express = require('express');
var router = express.Router();

router.get("/", function(req, res) {
	var thisFuncName = "scoutingpairs root: ";
	
	// Log message so we can see on the server side when we enter this
	console.log(thisFuncName + "ENTER");
	
	var db = req.db;
	
	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
	//Gets collection (aka a "table") from db
	var collection = db.get("teammembers");
	
	var progTeam;
	var mechTeam;
	var elecTeam;
	var assigned;

	//Searches for and sets variables for each subteam.
	//Each subteam var is an array with team member names inside.
	collection.find({"subteam":"prog","present":"true","assigned":"false"}, {sort: {"name": 1}}, function(e, docs){
		
		if(e){ //if error, log to console
			console.log(thisFuncName + e);
		}
		progTeam = docs;
		
		collection.find({"subteam":"mech","present":"true","assigned":"false"}, {sort: {"name": 1}}, function(e, docs){
			if(e){ //if error, log to console
				console.log(thisFuncName + e);
			}
			mechTeam = docs;
			
			collection.find({"subteam":"elec","present":"true","assigned":"false"}, {sort: {"name": 1}}, function(e, docs){
				if(e){ //if error, log to console
					console.log(thisFuncName + e);
				}
				elecTeam = docs;
				
				//Gets the current set of already-assigned pairs
				var collection2 = db.get("scoutingpairs");
				collection2.find({}, {}, function (e, docs) {;
					if(e){ //if error, log to console
						console.log(thisFuncName + e);
					}
					assigned = docs;
					
					//Renders page through Jade.
					console.log(thisFuncName + "RENDERING");
					
					res.render("./scoutingpairs", {
						title: "Scouting Pairs",
						prog: progTeam,
						mech: mechTeam,
						elec: elecTeam,
						assigned: assigned
					});
				});
			});
		});
	});

/*
	//Searches for and sets variables for each subteam.
	//Each subteam var is an array with team member names inside.
	collection.find({"subteam":"prog","present":"true","assigned":"false"}, {sort: {"name": 1}}).then(function(e, docs){
		if(e){ //if error, log to console
			console.log(thisFuncName + e);
		}
		progTeam = docs;
	});
	collection.find({"subteam":"mech","present":"true","assigned":"false"}, {sort: {"name": 1}}).then(function(e, docs){
		if(e){ //if error, log to console
			console.log(thisFuncName + e);
		}
		mechTeam = docs;
	});
	collection.find({"subteam":"elec","present":"true","assigned":"false"}, {sort: {"name": 1}}).then(function(e, docs){
		if(e){ //if error, log to console
			console.log(thisFuncName + e);
		}
		elecTeam = docs;
	});

	//Gets the current set of already-assigned pairs
	var collection2 = db.get("scoutingpairs");
	collection2.find({}, {}).then( function (e, docs) {;
		if(e){ //if error, log to console
			console.log(thisFuncName + e);
		}
		assigned = docs;
	});

	//Renders page through Jade.
	console.log(thisFuncName + "RENDERING");
	
	res.render("./scoutingpairs", {
		title: "Scouting Pairs",
		prog: progTeam,
		mech: mechTeam,
		elec: elecTeam,
		assigned: assigned
	});
*/
	
	console.log(thisFuncName + "DONE");
});

/* POST to Set scoutingPair Service */
router.post('/setscoutingpair', function(req, res) {
	var thisFuncName = "setscoutingpair: ";
	
	// Log message so we can see on the server side when we enter this
	console.log(thisFuncName + "ENTER");

    // Set our internal DB variable
    var db = req.db;

	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
    // Get our form values. These rely on the "name" attributes of form elements (e.g., named 'data' in the form)
    var data = req.body.data;
    //console.log(thisFuncName + data);
	
	// The javascript Object was JSON.stringify() on the client end; we need to re-hydrate it with JSON.parse()
	var selectedMembers = JSON.parse(data);
	console.log(selectedMembers);
	//var insertArray = [];
	//insertArray["pair"] = selectedMembers;

	////// Update selected teams to reflect the newly-picked team
	
    // Set collection to 'scoutingpairs'
    var collection = db.get('scoutingpairs');
	
	// Submit to the DB
	collection.insert(selectedMembers);
	
	////// Update members in 'teammembers' so that they're marked as "assigned" (and won't be available to choose afterwards)
	
    // Set collection to 'teammembers'
    var collection = db.get('teammembers');

    // Submit to the DB
	for (var member in selectedMembers)
	{
		console.log(selectedMembers[member]);
		collection.update(
			{ 	"name" : selectedMembers[member] },
			{ $set: { "assigned" : "true" } }
		)
	}
	
	console.log(thisFuncName + "REDIRECT");
	res.redirect("./");
	
	console.log(thisFuncName + "DONE");
});

router.post("/deletescoutingpair", function(req, res) {
	var thisFuncName = "deletescoutingpair: ";
	
	// Log message so we can see on the server side when we enter this
	console.log(thisFuncName + "ENTER");
	
	var db = req.db;
	
	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
	var data = req.body.data;
	
	var scoutCol = db.get("scoutingpairs");
	
	scoutCol.find({"_id": data}, {}, function(e, docs){
		
		if(e){ //if error, log to console
			console.log(thisFuncName + e);
		}
		thisPair = docs[0];
		console.log("thisPair=" + JSON.stringify(thisPair));

		var teamCol = db.get('teammembers');

		var nameList = [];
		if (thisPair.member1)
			nameList.push(thisPair.member1);
		if (thisPair.member2)
			nameList.push(thisPair.member2);
		if (thisPair.member3)
			nameList.push(thisPair.member3);
		console.log("nameList=" + JSON.stringify(nameList));

		teamCol.bulkWrite([{updateMany:{filter:{ "name": {$in: nameList }}, update:{ $set: { "assigned" : "false" } }}}], function(e, docs){
			scoutCol.remove({"_id": data});
		
			console.log(thisFuncName + "REDIRECT");
			res.redirect("./");	
		});
	});
	
	console.log(thisFuncName + "DONE");
});

module.exports = router;
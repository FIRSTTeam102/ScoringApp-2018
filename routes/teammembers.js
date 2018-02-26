var express = require("express");
var router = express.Router();

router.get("/", function(req, res) {
	var db = req.db;
	
	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
	//Gets collection ("table") from db
	var collection = db.get("teammembers");	
	
	collection.find({},{sort: {"name": 1}}, function(e, docs){
		
		if(e){ //if error, log to console
			console.log(e);
		}
		teamMembers = docs;
		
		res.render("./members", { "members": teamMembers });
	});
});

router.get("/present", function(req, res) {
	var db = req.db;
	
	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
	var collection = db.get("teammembers");
	
	collection.find({}, {sort: {"name": 1}}, function(e, docs) {
		if(e)
			console.log(e);
		
		teammembers = docs;
		
		res.render("./present", {"members": teammembers});
	});
});

router.post("/updatepresent", function(req, res){
	var db = req.db;
	
	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
	var collection = db.get("teammembers");
	
	collection.bulkWrite([{updateMany:{filter:{}, update:{ $set: { "present" : "false" } }}}], function(e, docs){
		for(var i in req.body){
			console.log(i);
			collection.update({"_id": i}, {$set: {"present": "true"}});
		}
		
		res.redirect("./present");
	});
	
});

router.post("/addmember", function(req, res){
	var thisFuncName = "teammembers.addmember[post]: ";
	console.log(thisFuncName + 'ENTER')

	var db = req.db;
	
	if(db._state == 'closed'){ //If database does not exist, send error
		res.render('./error',{
			message: "Database error: Offline",
			error: {status: "If the database is running, try restarting the Node server."}
		});
	}
	
	var collection = db.get("teammembers");
	
	var name = req.body.name;
	var subteam = req.body.subteam;
	var className = req.body.className;
	var years = req.body.years;

	// calculate seniority
	var seniority = parseInt(years);
	// sanity-check!
	if (isNaN(seniority)) seniority = 0;
	
	// Get the first 3 characters, all lower case
	var classPre = className.toLowerCase().substring(0, 3);
	switch(classPre) {
		case "fre":
			seniority += .1;
			break;
		case "sop":
			seniority += .2;
			break;
		case "jun":
			seniority += .3;
			break;
		case "sen":
			seniority += .4;
			break;
	}
	console.log(thisFuncName + 'seniority=' + seniority);
	
	collection.insert({"name": name, "subteam": subteam, "className": className, "years": years, "seniority": seniority});
	
	res.redirect("./");
});

router.post("/updatemember", function(req, res){
	var thisFuncName = "teammembers.updatemember[post]: ";
	console.log(thisFuncName + 'ENTER')
	
	var db = req.db;
	
	if (db._state == "closed"){
		res.render("./error",{
			message: "database error: offline",
			error: {status: "if the database is running, try restarting the node server"}
		});
	}
	
	var collection = db.get("teammembers");
	
	var memberId = req.body.memberId;
	var name = req.body.name;
	var subteam = req.body.subteam;
	var className = req.body.className;
	var years = req.body.years;
	
	// recalculate seniority
	var seniority = parseInt(years);
	// sanity-check!
	if (isNaN(seniority)) seniority = 0;
	
	// Get the first 3 characters, all lower case
	var classPre = className.toLowerCase().substring(0, 3);
	switch(classPre) {
		case "fre":
			seniority += .1;
			break;
		case "sop":
			seniority += .2;
			break;
		case "jun":
			seniority += .3;
			break;
		case "sen":
			seniority += .4;
			break;
	}
	console.log(thisFuncName + 'seniority=' + seniority);
	
	console.log({memberId, name, subteam, className, years});
	
	collection.update({"_id": memberId}, {$set: {"name": name, "subteam": subteam, "className": className, "years": years, "seniority": seniority}});
	
	res.redirect("./");
});

module.exports = router;

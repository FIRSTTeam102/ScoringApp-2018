var express = require("express");
var router = express.Router();

router.get("/events", function(req, res) {
	var thisFuncName = "externaldata.events[get]: ";
	console.log(thisFuncName + 'ENTER')
	
    // Set our internal DB variable
    var db = req.db;

    // Get our query value(s)
    var year = req.query.year;
	if (!year)
	{
		year = (new Date()).getFullYear();
		console.log(thisFuncName + 'No year specified, defaulting to ' + year);
	}
	console.log(thisFuncName + 'Year: ' + year);

	// Read events from DB for current year
	
	// Read unique list of years in DB
	
	// Send to Pug page to display
	res.redirect("/");
});

router.post("/events", function(req, res) {
	var thisFuncName = "externaldata.events[post]: ";
	console.log(thisFuncName + 'ENTER')
	
    // Set our internal DB variable
    var db = req.db;

    // Get our form value(s)
    var year = req.body.year;

	console.log(thisFuncName + 'year=' + year)
	
	// nodeclient from earlier?
	//var Client = require('node-rest-client').Client;
	//var client = new Client();
	
	var args = {
//		path: { "event" : eventCode },
		headers: { "accept": "application/json", "X-TBA-Auth-Key": "iSpbq2JH2g27Jx2CI5yujDsoKYeC8pGuMw94YeK3gXFU6lili7S2ByYZYZOYI3ew" }
	}
	
	client.get("https://www.thebluealliance.com/api/v3/event/${year}/simple", args, function (data, response) {
        // parsed response body as js object 
		var array = JSON.parse(data);
		var arrayLength = array.length;
		console.log(thisFuncName + 'Found ' + arrayLength + ' data for year ' + year);
		for (var i = 0; i < arrayLength; i++) {
			//console.log(teamArray[i]);
			console.log('#' + i + ': key=' + array[i].key + ', name=' + array[i].name);
		}		
		//console.log("********************** DATA **********************");
        //console.log(teamArray);
        // raw response 
		//console.log("==================== RESPONSE ====================");
        //console.log(response);
    });
	
	res.redirect("/");
});

module.exports = router;

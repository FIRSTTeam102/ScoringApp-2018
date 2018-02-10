var express = require('express');
var router = express.Router();

//router.get is used for GET requests.
router.get('/', function(req, res){
	
	res.render("./ajax");
});

//router.post is used for POST requests.
router.post('/submit', function(req, res){
	
	//req.body contains data sent by AJAX call.
	var data_text = req.body.text;
	console.log("Data sent: " + data_text);
	
	//res.send can directly send objects.
	res.send({"success":"true", "data sent": data_text});
	
	//res.end must be used if we don't render a page with res.render or res.sendFile.
	res.end("yes");
});

module.exports = router;
var express = require('express');
var router = express.Router();

router.get('/', function(req, res){
	var db = req.db;
	var collection = db.get("scoringlayout");
	collection.find({}, {sort: {"order": 1}}, function(e, docs){
		var layout = docs;
		console.log(layout);
		res.render("./scoring", {layout: layout});
	});
});

router.post('/submit', function(req, res){
	console.log(req.body);
	res.redirect("/");
});

module.exports = router;
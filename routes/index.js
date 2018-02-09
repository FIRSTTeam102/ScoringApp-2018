var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('./index', { title: 'Index' });
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
	var collection = db.get("teammembers");
	var progTeam;
	var mechTeam;
	var elecTeam;
	collection.find({"subteam":"prog"},{}, function(e, docs){
		progTeam = docs;
		collection.find({"subteam":"mech"},{}, function(e, docs){
			mechTeam = docs;
			collection.find({"subteam":"elec"},{}, function(e, docs){
				elecTeam = docs;
				console.log("aoidp");
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

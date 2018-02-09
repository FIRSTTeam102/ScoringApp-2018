var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
	res.render("./tests/ajax", {title: "ajax"});
});

module.exports = router;

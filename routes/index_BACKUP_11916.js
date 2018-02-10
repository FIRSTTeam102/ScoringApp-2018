var express = require('express');
var router = express.Router();

//DON'T keep other pages inside index!!! When we have a working scoring app, I 
//don't want any of our pages inside index.js!!
//-Jordan

//P.S. Make sure to comment everything!
//And make sure to handle errors!

//GET index page.
<<<<<<< HEAD
=======
router.get('/', function(req, res) {
	
  res.render('./index', { tournament: 'Sample Tournament Title' });
  
});
>>>>>>> 02ebe5fecf02c2b198be540c0e7dcf4fe29b7bde

module.exports = router;
var express = require('express');
var router = express.Router();
//var image = require();
/*
 * Main homepage.
 * @url /test
 * @view test/test
 */
// router.get('/', function(req, res) {
//     res.render('./test', {
//       imageUrl: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
//         //Work on the test.pug file for image retrieval
//     });
//     //res.send(imageUrl)
//     //see https://stackoverflow.com/questions/15772394/how-to-upload-display-and-save-images-using-node-js-and-express
// });

// router.post("/upload", function(req, res) {
//     res.redirect('/test');
    
// });
//
//
//-------------------PROBLEMS-------------------
//
// //
// router.post('/test', function(req, res, next) {
//   console.log(req.body);
//   console.log(req.files);
// });

// // we need the fs module for moving the uploaded files
// var fs = require('fs');
// router.post('/test', function(req, res) {
//     // get the temporary location of the file
//     var tmp_path = req.files.thumbnail.path;
//     // set where the file should actually exists - in this case it is in the "images" directory
//     var target_path = '/test/upload' + req.files.thumbnail.name;
//     // move the file from the temporary location to the intended location
//     fs.rename(tmp_path, target_path, function(err) {
//         if (err) throw err;
//         // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
//         fs.unlink(tmp_path, function() {
//             if (err) throw err;
//             res.send('File uploaded to: ' + target_path + ' - ' + req.files.thumbnail.size + ' bytes');
//         });
//     });
// });


// module.exports = router;
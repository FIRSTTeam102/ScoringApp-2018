var express = require('express');
var router = express.Router();

/**
 * Image storage and retrieval page. Meant to help with image down- & up-loads to the main directory
 * @url /image
 * @view image/test
 */

// import multer and the AvatarStorage engine
var _ = require('lodash');
var path = require('path');
var multer = require('multer');
var AvatarStorage = require('../helpers/AvatarStorage');

var storage = AvatarStorage({
    square: false,
    responsive: true,
    output: "jpg",
    greyscale: false,
    quality: 60,
    threshold: 500
});

var limits = {
    files: 1, // allow only 1 file per request
    fileSize: 10 * 1024 * 1024, // 10 MB (max file size)
};

var fileFilter = function(req, file, cb) {
    // supported image file mimetypes
    var allowedMimes = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/gif'];

    if (_.includes(allowedMimes, file.mimetype)) {
        // allow supported image files
        cb(null, true);
    } else {
        // throw error for invalid files
        cb(new Error('Invalid file type. Only jpg, png and gif image files are allowed.'));
    }
};

//create basic multer function upload
var upload = multer({
    storage: storage,
    limits: limits,
    fileFilter: fileFilter
}).single("avatarfield");


router.get('/', function(req, res, next) {
    // res.render('index', { title: 'Upload Avatar', avatar_field: process.env.AVATAR_FIELD });
    //This stuff works
    res.render('./image/test',{
        title: "Image Testing Page",
        avatar_field: process.env.AVATAR_FIELD
    });

});

// ||\\  ||  //|||||\\  |||\\    ||||||||      ||||||||  /|||||||
// || \\ ||  ||     ||  ||  \\   ||               ||     ||
// ||  \\||  ||     ||  ||   \\  |||||            ||     \||||||\
// ||   \\|  ||     ||  ||   //  ||               ||           ||
// ||    ||  ||     ||  ||  //   ||               ||           ||
// ||    ||  \\|||||//  |||//    ||||||||  ||  ||||/     |||||||/
//...because why not


/* More pasted code... ... */////////////////////////////////////////

router.post('/upload*', function(req, res, next) {
    var team_key = req.query.team_key;
    res.log("going to upload");
    console.log("going to upload");
    
    var year = req.event.year;
    req.baseFilename = year + "_" + team_key;


    upload(req, res, function(e){
        console.log("hello");
        console.log("req.file="+JSON.stringify(req.file));
    });
    
    res.log("called upload");
});


module.exports = router;

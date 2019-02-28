var express = require('express');
var router = express.Router();

/**
 * Image storage and retrieval page. Meant to help with image down- & up-loads to the main directory
 * @url /image
 * @view image/test
 */

/* Pasted code... *////////////////////////////////////////

// import multer and the AvatarStorage engine
var _ = require('lodash');
var path = require('path');
var multer = require('multer');
var AvatarStorage = require('../helpers/AvatarStorage');

// setup a new instance of the AvatarStorage engine 
var storage = AvatarStorage({
square: true,
responsive: true,
greyscale: true,
quality: 90
});

var limits = {
files: 1, // allow only 1 file per request
fileSize: 1024 * 1024, // 1 MB (max file size)
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

// setup multer
var upload = multer({
storage: storage,
limits: limits,
fileFilter: fileFilter
});


router.get('/', function(req, res, next) {
    // res.render('index', { title: 'Upload Avatar', avatar_field: process.env.AVATAR_FIELD });
    //This stuff works
    res.render('./image/test',{
        title: "Image Testing Page",
        avatar_field: process.env.AVATAR_FIELD
    });

});

/* More pasted code... ... */////////////////////////////////////////

router.post('/upload', upload.single("avatarfield"), function(req, res, next) {
    console.log("process.env.AVATAR_FIELD =" + process.env.AVATAR_FIELD);
    var files;
    var file = req.file.filename;
    var matches = file.match(/^(.+?)_.+?\.(.+)$/i);
    
    if (matches) {
    files = _.map(['lg', 'md', 'sm'], function(size) {
    return matches[1] + '_' + size + '.' + matches[2];
    });
    } else {
    files = [file];
    }
    
    files = _.map(files, function(file) {
    var port = req.app.get('port');
    var base = req.protocol + '://' + req.hostname + (port ? ':' + port : '');
    var url = path.join(req.file.baseUrl, file).replace(/[\\\/]+/g, '/').replace(/^[\/]+/g, '');
    
    return (req.file.storage == 'local' ? base : '') + '/' + url;
    });
    
    res.json({
    images: files
    });
    
    });


module.exports = router;

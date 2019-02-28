var express = require('express');
var router = express.Router();

/**
 * Image storage and retrieval page. Meant to help with image down- & up-loads to the main directory
 * @url /image
 * @view image/test
 */

router.get('/', function(req, res, next) {
    // res.render('index', { title: 'Upload Avatar', avatar_field: process.env.AVATAR_FIELD });
    res.render('./image/test',{
        title: "Image Testing Page",
        avatar_field: process.env.AVATAR_FIELD
    });

});
module.exports = router;

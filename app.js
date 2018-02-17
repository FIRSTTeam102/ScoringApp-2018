var express = require('express');				//main express shiz
var path = require('path');						//for filesystem
var favicon = require('serve-favicon');			//serves favicon
var logger = require('morgan'); 				//logger
var cookieParser = require('cookie-parser');	//parser of cookies
var bodyParser = require('body-parser');		//parses http request information
var session = require('express-session');		//session middleware (uses cookies)
var passport = require('passport');				//for user sessions

//var mongo = require("mongodb");				//mongodb
var monk = require("monk");						//for connecting to mongo

var app = express();
var db = monk("localhost:27017/local");

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser()); don't believe this is necessary
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true
}));

require('./passport-config');
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req,res,next) {
	req.db = db;
	req.passport = passport;
	next();
});

//ADD ROUTES HERE
var index = require('./routes/index');
var adminindex = require('./routes/adminindex');
var tests = require('./routes/tests');
var login = require('./routes/login');
var ajax = require('./routes/ajax'); 			//Ajax example (was used for test originally)
var scoutingpairs = require('./routes/scoutingpairs');
var teammembers = require("./routes/teammembers");

//CONNECT URLS TO ROUTES
app.use('/', index);
app.use('/admin', adminindex);
app.use('/tests', tests);
app.use('/login', login);
app.use('/ajax-example', ajax);
app.use('/admin/scoutingpairs', scoutingpairs);
app.use("/admin/teammembers", teammembers);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

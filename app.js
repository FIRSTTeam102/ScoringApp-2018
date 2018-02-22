var express = require('express');				//main express shiz
var path = require('path');						//for filesystem
var favicon = require('serve-favicon');			//serves favicon
var logger = require('morgan'); 				//logger
var bodyParser = require('body-parser');		//parses http request information
var session = require('express-session');		//session middleware (uses cookies)
var passport = require('passport');				//for user sessions
var fs = require('fs');							//for reading whether this device is server or not

var monk = require("monk");		
var db = monk("localhost:27017/local");				//for connecting to mongo

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
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
	/*
	req.tournament = {
		id: "Sample Tournament Title!"
	}; //WILL CHANGE ONCE WE GET API CALLS UP AND RUNNING
	*/
	res.locals.tournament=  "Tournament Title";
	
	if(req.user)
		res.locals.user = req.user;
	else if(req.app.locals.isDev == true)
		res.locals.user = {name: '[Dev]', subteam: 'support'}
	
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

//reads if server is marked as dev or not
fs.readFile('./isDev', "binary", function(err, data){
	if(err)
		console.log(err);
		app.locals.isDev = false;
	if(data){
		console.log("isDev: " + data);
		//set isDev equal to data (true or false)
		app.locals.isDev = data;
	}
});

//reads if server is marked as SERVER or not (used for subdirectory thingamajiggies)
fs.readFile('./isServer', "binary", function(err, data){
	if(err)
		console.log(err);
		app.locals.isServer = false;
	if(data){
		console.log("isServer: " + data);
		//set isServer equal to data (true or false)
		app.locals.isServer = data;
	}
});

module.exports = app;

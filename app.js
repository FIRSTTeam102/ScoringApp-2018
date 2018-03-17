var express = require('express');				//main express shiz
var path = require('path');						//for filesystem
var favicon = require('serve-favicon');			//serves favicon
var logger = require('morgan'); 				//logger
var bodyParser = require('body-parser');		//parses http request information
var session = require('express-session');		//session middleware (uses cookies)
var passport = require('passport');				//for user sessions
var fs = require('fs');							//for reading whether this device is server or not
var Client = require('node-rest-client').Client;//for reading from REST APIs (e.g., TheBlueAlliance)
var client = new Client();

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
	req.event = {
		key: "undefined",
		name: "undefined"
	};
	/*
	req.tournament = {
		id: "Sample Tournament Title!"
	}; //WILL CHANGE ONCE WE GET API CALLS UP AND RUNNING
	*/
	res.locals.tournament=  "Tournament Title";
	
	if(req.user)
		res.locals.user = req.user;
	else if(req.app.locals.isDev == true){
		res.locals.user = {name: '[Dev]', subteam: 'support'};
		req.user = "Dev";
	}
	
	var current = db.get('current');
	var events = db.get('events');
	
	//finds current event
	current.find({}, {}, function(e, current) {
		//sets locals to no event defined just in case we don't find thing and we can just do next();
		var eventId = 'No event defined';
		res.locals.tournament = eventId;
		
		//if exist
		if (current && current[0]){
			eventId = current[0].event;
			//set event key
			req.event.key = eventId;
			
			//find data for current event
			events.find({ key: eventId }, {}, function(e, event){
				
				if(e){
					console.error(e);
					return next();
				}
				//set tournament thing to event name
				if(event && event[0]){
					res.locals.tournament = event[0].name;
					req.event.name = event[0].name;
					next();
				}else{
					next();
				}
			});
		}else{
			next();
		}
	});
});

//ADD ROUTES HERE
var index = require('./routes/index');
var adminindex = require('./routes/adminindex');
var login = require('./routes/login');
var scoutingpairs = require('./routes/scoutingpairs');
var teammembers = require("./routes/teammembers");
var externaldata = require("./routes/externaldata");
var dashboard = require("./routes/dashboard");
var admindashboard = require("./routes/admindashboard");
var scouting = require("./routes/scouting");
var current = require("./routes/current");
var reports = require('./routes/reports');
//var reports2 = require('./routes/reports2');

//CONNECT URLS TO ROUTES
app.use('/', index);
app.use('/admin', adminindex);
app.use('/login', login);
app.use('/admin/scoutingpairs', scoutingpairs);
app.use("/admin/teammembers", teammembers);
app.use('/admin/data', externaldata);
app.use('/admin/current', current);
app.use('/admin/dashboard', admindashboard);
app.use('/scouting', scouting);
app.use("/dashboard", dashboard);
app.use('/reports', reports);
//app.use('/reports2', reports2);

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
		app.locals.isDev = (data == 'true');
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
		app.locals.isServer = (data == 'true');
	}
});

module.exports = app;

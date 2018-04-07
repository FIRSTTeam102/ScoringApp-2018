// toggle on for local tracing
var ifDebug = false;
var thisFuncName = "app.js: ";
if (ifDebug) console.log(thisFuncName + 'ENTER');
	
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
var useragent = require('express-useragent');	//for info on connected users

var monk = require("monk");		
var db = monk("localhost:27017/local");				//for connecting to mongo

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true
}));
app.use(useragent.express());

require('./passport-config');
app.use(passport.initialize());
app.use(passport.session());

//sets view engine vars for user
app.use(function(req, res, next){
	var thisFuncName = "app.js ~ View engine: ";
	if (ifDebug) console.log(thisFuncName + 'ENTER');
	
	if(req.user)
		res.locals.user = req.user;
	else if(req.app.locals.isDev == true){
		res.locals.user = {name: '[Dev]', subteam: 'support'};
	}
	next();
	if (ifDebug) console.log(thisFuncName + 'DONE');
});

//Event stuff
app.use(function(req,res,next) {
	var thisFuncName = "app.js ~ Event stuff: ";
	if (ifDebug) console.log(thisFuncName + 'ENTER');
		
	//database
	req.db = db;
	req.passport = passport;
	req.event = {
		key: "undefined",
		name: "undefined"
	};
	
	//for finding current event
	var current = db.get('current');
	var events = db.get('events');
	
	//finds current event
	current.find({}, {}, function(e, current) {
		if (ifDebug) console.log(thisFuncName + 'Inside current.find');
		
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
				if (ifDebug) console.log(thisFuncName + 'Inside events.find');
				
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
	if (ifDebug) console.log(thisFuncName + 'DONE');
});

//Logging and timestamping
app.use(function(req, res, next){
	var thisFuncName = "app.js ~ Log and timestamp: ";
	if (ifDebug) console.log(thisFuncName + 'ENTER');
		
	//Sets variables accessible to any page from req (request) object
	req.requestTime = Date.now();
	
	//formatted request time for logging
	var d = new Date(req.requestTime),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear(),
		hours = d.getHours(),
		minutes = d.getMinutes(),
		seconds = d.getSeconds();
	month = month.length<2? '0'+month : month;
	day = day.length<2? '0'+day : day;
	var formattedReqTime = (
		[year, month, day, [hours, minutes, seconds].join(':')].join('-')
	)
	
	//user agent
	req.shortagent = {
		ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
		device: req.useragent.isMobile ? "mobile" : req.useragent.isDesktop ? "desktop" : (req.useragent.isiPad || req.useragent.isAndroidTablet) ? "tablet" : req.useragent.isBot ? "bot" : "other",
		os: req.useragent.os,
		browser: req.useragent.browser
	}
	//logs request
	console.log(req.method+" Request from "+req.shortagent.ip+" on "+req.shortagent.device+"|"+req.shortagent.os+"|"+req.shortagent.browser+" to "+req.url+" at "+formattedReqTime);
	
	next();
	if (ifDebug) console.log(thisFuncName + 'DONE');
});

//adds logging to res.render function
app.use(function(req, res, next){
	var thisFuncName = "app.js ~ Logging to res.render: ";
	if (ifDebug) console.log(thisFuncName + 'ENTER');
	
	res.render = (function(link, param){
		var cached_function = res.render;
		
		return function(link, param){
			
			var beforeRenderTime = Date.now() - req.requestTime;
			
			var result = cached_function.apply(this, arguments);
			
			var renderTime = Date.now() - req.requestTime - beforeRenderTime;
			console.log("Completed route in "+beforeRenderTime+" ms; Rendered page in "+renderTime+" ms");
			
			return result;
		}
	}());
	next();
	if (ifDebug) console.log(thisFuncName + 'DONE');
});

if (ifDebug) console.log(thisFuncName + 'Require routes');

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
var allianceselection = require('./routes/allianceselection');
//var reports2 = require('./routes/reports2');

if (ifDebug) console.log(thisFuncName + 'URLs to routes');

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
app.use('/allianceselection', allianceselection);
//app.use('/reports2', reports2);

if (ifDebug) console.log(thisFuncName + 'After URLs to routes');

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

//reads if server is marked as SERVER or not (currently not used, but we might wanna add something)
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

if (ifDebug) console.log(thisFuncName + 'DONE');

module.exports = app;
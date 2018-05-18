const express = require('express');					//main express shiz
const path = require('path');						//for filesystem
const favicon = require('serve-favicon');			//serves favicon
const bodyParser = require('body-parser');			//parses http request information
const session = require('express-session');			//session middleware (uses cookies)
const passport = require('passport');				//for user sessions
const Client = require('node-rest-client').Client;//for reading from REST APIs (e.g., TheBlueAlliance)
const useragent = require('express-useragent');	//for info on connected users
const colors = require('colors');					//for pretty debugging
const monk = require("monk");						//Monk for connecting to db
const useFunctions = require('./useFunctions');		//Functions inside separate module for app.use

var db = monk("localhost:27017/local");			//Local db on localhost
var client = new Client();						//Creates node-rest-client.

var app = express();							//Creates app.

/* Checks process arguments.
	If -dev or --dev, isDev = true.
	If -debug or --debug, debug = true.
	If -d or --d, both = true.
*/
app.isDev = false; //isDev is typically used as a locals var in view engine.
app.debug = false; //debug is used for logging.
for(var i in process.argv){
	switch(process.argv[i]){
		case "-dev":
		case "--dev":
			app.isDev = true;
			break;
		case "-d":
		case "--d":
			app.isDev = true;
		case "-debug":
		case "--debug":
			app.debug = true;
			break;
	}
}

//Boilerplate setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

//Session
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true
}));
//User agent for logging
app.use(useragent.express());

//Passport setup (user authentication)
require('./passport-config');
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next){
	req.db = db;
	req.passport = passport;
	next();
});
//sets view engine vars for user
app.use(useFunctions.userViewVars);
//Event stuff
app.use(useFunctions.getEventInfo);
//Logging and timestamping
app.use(useFunctions.logger);
//adds logging to res.render function
app.use(useFunctions.renderLogger);

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

// catch 404 and forward to error handler
app.use(useFunctions.notFoundHandler);
// error handler
app.use(useFunctions.errorHandler);

module.exports = app;
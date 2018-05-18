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
			console.log("Dev");
			app.isDev = true;
			break;
		case "-d":
		case "--d":
			console.log("Dev");
			app.isDev = true;
		case "-debug":
		case "--debug":
			console.log("Debug");
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

//USER ROUTES
var index = require('./routes/index');
var login = require('./routes/login');
var dashboard = require("./routes/dashboard");
var scouting = require("./routes/scouting");
var reports = require('./routes/reports');
var allianceselection = require('./routes/allianceselection');
//ADMIN ROUTES
var adminindex = require('./routes/admin/adminindex');
var scoutingaudit = require("./routes/admin/audit");
var current = require("./routes/admin/current");
var externaldata = require("./routes/admin/externaldata");
var scoutingpairs = require('./routes/admin/scoutingpairs');
var teammembers = require("./routes/admin/teammembers");

//CONNECT URLS TO ROUTES
app.use('/', index);
app.use('/login', login);
app.use('/scouting', scouting);
app.use("/dashboard", dashboard);
app.use('/reports', reports);
app.use('/allianceselection', allianceselection);
app.use('/admin', adminindex);
app.use('/admin/scoutingpairs', scoutingpairs);
app.use("/admin/teammembers", teammembers);
app.use('/admin/data', externaldata);
app.use('/admin/current', current);
app.use('/admin/audit', scoutingaudit);

// catch 404 and forward to error handler
app.use(useFunctions.notFoundHandler);
// error handler
app.use(useFunctions.errorHandler);

console.log("app.js:".red + " Ready")

module.exports = app;
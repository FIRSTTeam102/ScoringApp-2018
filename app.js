//load dependencies
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
const fs = require("fs");

//check if we have a db user file
var hasDBUserFile = fs.existsSync(".dbuser");
var db;

if(hasDBUserFile){
	var dbUser = JSON.parse(fs.readFileSync(".dbuser", {"encoding": "utf8"}));
	console.log(dbUser);
	console.log(`${dbUser.username}:${dbUser.password}@localhost:27017/app`);	
	db = monk(`${dbUser.username}:${dbUser.password}@localhost:27017/app`);	
}
else{
	db = monk("localhost:27017/app");			//Local db on localhost without authentication
}
var client = new Client();						//Creates node-rest-client.

//isDev is typically used as a locals var in view engine.
//debug is used for logging.
//production is used to cache pug views.
var isDev = false, debug = false, production = false;

/* Check process arguments.
	If -dev or --dev, isDev = true.
	If -debug or --debug, debug = true.
	If -d or --d, both = true.
*/
for(var i in process.argv){
	switch(process.argv[i]){
		case "-dev":
		case "--dev":
			console.log("Dev");
			isDev = true;
			break;
		case "-d":
		case "--d":
			console.log("Dev");
			isDev = true;
		case "-debug":
		case "--debug":
			console.log("Debug");
			debug = true;
			break;
		case "-production":
		case "--production":
			production = true;
	}
}

//PUG CACHING (if dev is NOT enabled or production IS enabled)
if(!isDev || production){
	console.log("Production");
	process.env.NODE_ENV = "production";
}

//Create app.
var app = express();

//set app's bools to these arguments
app.isDev = isDev; 
app.debug = debug; 

//Boilerplate setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

var mongoose = require('mongoose');

//check if we have a db user file
var hasDBUserFile = fs.existsSync(".dbuser");
var db;

//Connect to mongoose for session storage
if(hasDBUserFile){
	//if there is a .dbuser file, connect with the user inside that file
	var dbUser = JSON.parse(fs.readFileSync(".dbuser", {"encoding": "utf8"}));
	console.log(`mongodb://${dbUser.username}:${dbUser.password}@localhost/sessions`);
	mongoose.connect(`mongodb://localhost/sessions`, {useNewUrlParser: true, user: dbUser.username, pass: dbUser.password});
}
else{
	//if there is no .dbuser, then connect without username and password.
	mongoose.connect('mongodb://localhost/sessions', {useNewUrlParser: true}); //Local connection w/o authentication
}

//Session
app.use(session({
	secret: 'sfl44-dfjl-436gg-dsfdf',
	resave: true,
	saveUninitialized: true,
    cookie: { maxAge: 2628000000 },
    store: new (require('express-sessions'))({
        storage: 'mongodb',
        instance: mongoose, // optional
        host: 'localhost', // optional
        port: 27017, // optional
        db: 'sessions', // optional
        collection: 'sessions', // optional
        expire: 86400 // optional
    })
}))

//Session
/*
app.use(session({
	secret: 'marcus night',
	resave: true,
	saveUninitialized: true
}));
*/
//User agent for logging
app.use(useragent.express());

//Passport setup (user authentication)
require('./passport-config');
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next){
	//For logging
	req.requestTime = Date.now();
	//For database
	req.db = db;
	//For user login
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
//adds TBA API key to req
app.use(useFunctions.setupNodeRestClient);

//USER ROUTES
var index = require('./routes/index');
var login = require('./routes/login');
var dashboard = require("./routes/dashboard");
var scouting = require("./routes/scouting");
var reports = require('./routes/reports');
var allianceselection = require('./routes/allianceselection');
var image = require("./routes/image");
//ADMIN ROUTES
var adminindex = require('./routes/admin/adminindex');
var scoutingaudit = require("./routes/admin/audit");
var current = require("./routes/admin/current");
var externaldata = require("./routes/admin/externaldata");
var scoutingpairs = require('./routes/admin/scoutingpairs');
var teammembers = require("./routes/admin/teammembers");
var manualinput = require("./routes/admin/manualinput");

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
app.use('/admin/manualinput', manualinput);
app.use('/image', image);

// catch 404 and forward to error handler
app.use(useFunctions.notFoundHandler);
// error handler
app.use(useFunctions.errorHandler);

console.log("app.js:".red + " " +"Ready!".bgGreen)

module.exports = app;

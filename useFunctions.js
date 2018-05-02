var functions = module.exports = {};
//View engine locals variables
functions.userViewVars = function(req, res, next){
	var thisFuncName = "app.js ~ View engine: ";
	
	if(req.user)
		res.locals.user = req.user;
	else if(req.app.locals.isDev == true){
		res.locals.user = {name: '[Dev]', subteam: 'support'};
	}
	next();
}

//Gets event info from local db
functions.getEventInfo = function(req, res, next) {
	var thisFuncName = "app.js ~ Event stuff: ";
	
	//database
	var db = req.db;
	//req.passport = passport;
	req.event = {
		key: "undefined",
		name: "undefined"
	};
	
	//for finding current event
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
}

functions.logger = function(req, res, next){
	
	res.log = function(message, param2, param3){
		var color, override = false;
		if(typeof(param2) == "boolean")
			override = param2;
		if(typeof(param2) == "string")
			color = param2;
		if(typeof(param3) == "boolean")
			override = param3;
		if(typeof(param3) == "string")
			color = param3;
		
		//res.debug is set to app.debug inside app.js
		if(req.app.debug || override){
			if(typeof(message) == "string" && color != undefined)
				console.log(message[color]);
			else
				console.log(message);
		}
	}
		
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
	}

functions.renderLogger = function(req, res, next){
	var thisFuncName = "app.js ~ Logging to res.render: ";
	
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
}
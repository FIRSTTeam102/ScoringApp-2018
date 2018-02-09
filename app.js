var MAJOR_VERSION   =1;
var MINOR_VERSION   =0;
var BUILD_VERSION   =0;

var express = require("express");
var path = require("path");
var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var http = require("http");

var mongo = require("mongodb");
var monk = require("monk");

var index = require("./routes/index");
//var users = require("./routes/users");

var app = express();
var httpServer = http.createServer(app);
var socketio = require("socket.io").listen(httpServer);

var db = monk("localhost:27017/experiments");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.set("view options", { pretty: true });

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(function(req,res,next) {
	req.db = db;
	next();
});

app.use("/", index);
//app.use("/users", users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

var ClientConnection;

socketio.on("connection", function (socket) {
    console.log("Client socket connected!");

	ClientConnection =socket;
	
    socket.on("disconnect", function(){
        console.log("Client socket disconected!");
		ClientConnection =undefined;
    });
	
	socket.on("get-all-prog", function(){
		console.log("get-all-prog");
		
		var progMsg={
			msgId:0,
			to:"client",
			from:"server",
			data:[]
		};
		
		var db = req.db;
		var collection = db.get("teammembers");
		var progTeam;

		collection.find({"subteam":"prog"},{}, function(e, docs){
			docs.forEach (function(member){
				progMsg.data.push(member);
			});
					
			ClientConnection.emit("get-all-present-reply",progMsg);
		});
		
	});

	// Assuming msg.data = [{"id":<value>,"isPresent":<boolean>},...]
	socket.on("set-present", function(msg){
		console.log("set-present: " + JSON.stringify(msg));

		msg.data.forEach (function(presentMember){
			ghData.forEach (function(teamMember){
				if(teamMember.id === presentMember.id){
					teamMember.isPresent =presentMember.isPresent;
				}
			})		
		})
	});
		
	socket.on("get-assignments", function(){
		console.log("get-assignments");

	});
	
	socket.on("set-assignments", function(setAssignmentsMsg){
		console.log("set-assignments");

		setAssignmentsMsg.data.forEach(function(assignment){
			console.log(assignment.name.first + " " + assignment.name.last + " assigned to group " + assignment.groupAssignment);
			
			// We need to update our model and pass it to the db.  So find the item with this id, then update it...
			ghData.forEach (function(member){
				if(member.id === assignment.id ){
					member.groupAssignment =assignment.groupAssignment;
				}
			});
		});

		// We need to make sure that all clients get the updated info...
		
	});

	var ImAliveMsg={
		msgId:0,
		to:"client",
		from:"server",
		data:{
			"serverInfo":{
				"version":{
					"major":MAJOR_VERSION,
					"minor":MINOR_VERSION,
					"build":BUILD_VERSION
				}
			}
		}		
	};

	ClientConnection.emit("i-am-alive",ImAliveMsg);
});

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }))

app.set("port", process.env.PORT || 9000);

httpServer.listen(app.get("port"), function() {
	console.log("Server listening for clients on port " + httpServer.address().port );
});

process.on("SIGINT", function(code) {
    console.log("\nCtrl-C caught ...");
    process.exit(0);
});


module.exports = app;

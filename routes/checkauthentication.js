var passport = require('passport');

module.exports = function(req, res, type){
    
	//if dev server, always return true.
	if(req.app.locals.isDev){
		return true;
	}
	
	//Checks if user is logged in
	if(req.user){
		
		if( type == 'admin' ){
			//if page is admin and user is admin, return true
			if( req.user.subteam == 'support' || req.user.subteam == 'exec' )
				return true;
			else
				return res.redirect('/?alert=You do not have access to this page.');
			
		}
		else if( type == 'scouting' ){
			//if user is logged in, allow no matter what type user is
			return true;
		}
		else{
			console.log("checkauthentication.js: Type not specified or incorrect");
			return res.redirect('/?alert=An error occurred.');;
		}		
	}
	else{
		
        //isn't logged in; redirect to homepage    w/ message
        return res.redirect('/?alert=You must log in to access this page.');
	}
}
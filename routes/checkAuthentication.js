module.exports = function(req, res){
	
	if(req.session.passport != undefined){
		if(req.session.passport.user != undefined){
			//is logged in
			return true;
			
		}else{
			//isn't logged in; redirect to homepage
			console.log("Unauthenticated attempt to access page.");
			res.redirect('/');
			return false;
		}
	}else{
		//isn't logged in	
		console.log("Unauthenticated attempt to access page.");
		res.redirect('/');
		return false;
	}
}
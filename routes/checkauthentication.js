module.exports = function(req, res){
    
    //Checks if user is logged in
    if(req.session.passport != undefined){
        if(req.session.passport.user != undefined){
            //is logged in
            return true;
            
        }else{
            //isn't logged in; redirect to homepage w/ message
            console.log("Unauthenticated attempt to access page.");
            res.redirect('/?alert=Sorry, please log in again to access this page.');
            return false;
        }
    }else{
        //isn't logged in; redirect to homepage    w/ message
        console.log("Unauthenticated attempt to access page.");
        res.redirect('/?alert=You must log in to access this page.');
        return false;
    }
}
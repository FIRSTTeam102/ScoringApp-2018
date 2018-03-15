$(function(){
	
	$("#submit").on('click', function(){
		
		var formData = getFormData($("#matchform"));
		var formDataString = JSON.stringify(formData);
		
		//adds data to local storage
		localStorage.setItem("matchFormData", formDataString); 
		
		//data on item to submit
		var toSubmit = {
			url: "/scouting/match/submit",
			dataKey: "matchFormData",
			callback: function(){
				console.log("Callback called from match-client.js");
				window.location.href="/dashboard"
			}
		};
		/*
		//gets existing thingy from local storage
		var toSubmitAlready = getToSubmit();
		
		if(toSubmitAlready){
			console.log("toSubmitAlready");
			toSubmitAlready.push(toSubmit);
		}else{
			console.log("not tsa");
			toSubmitAlready = [toSubmit];
		}
		
		//sends to local storage
		setToSubmit(toSubmitAlready);
		*/
		submitData(toSubmit.url, toSubmit.dataKey, toSubmit.callback);
	});

});
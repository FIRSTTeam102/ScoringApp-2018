$(function(){
	
	$("#submit").on('click', function(){
		
		var formData = getFormData($("#matchform"));
		var formDataString = JSON.stringify(formData);
		
		//adds data to local storage
		localStorage.setItem("matchFormData", formDataString);
		
		console.log(formDataString);
		console.log(localStorage.matchFormData);
		
		//data on item to submit
		var toSubmit = {
			url: "/scouting/match/submit",
			dataKey: "matchFormData",
			callback: function(){
				console.log("Callback called from match-client.js");
				
				darkener = document.createElement("div");
				darkener.classList.add("canvas");
				darkener.classList.add("theme-darkener");
				document.body.appendChild(darkener);
				
				setTimeout(function(){
					window.location.href="/dashboard";
				}, 1000);
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
$(function(){
	
	$("#submit").on('click', function(){
		
		var formData = getFormData($("#scoutform"));
		var formDataString = JSON.stringify(formData);
		
		//adds data to local storage
		localStorage.setItem("matchFormData", formDataString); 
		
		//data on item to submit
		var toSubmit = {
			url: "/scouting/pit/submit",
			dataKey: "matchFormData",
			callback: function(){
				console.log("Callback called from match-client.js");
				window.location.href="/dashboard"
			}
		};
		
		submitData(toSubmit.url, toSubmit.dataKey, toSubmit.callback);
	});

});
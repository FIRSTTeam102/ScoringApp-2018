$(function(){
	
	$("#submit").on('click', function(){
		
		var data_text = $("#text").val();
		localStorage.setItem("ajaxsample-text", 
		
		submitData("/ajax-exampple/submit", {
			text: localStorage.getItem("ajaxsample-text"
		});
		
	});

});

function submitData(url, content){
	
	createNotificationCard( "Submitting data..." );
	
	
	$.post("/ajax-example/submit", {
		
		text: data_text
		
	}, function(res, status){
		
		if(status == "success"){
			
			createNotificationCard("Data successfully sent. Respone: " + res.data, "good");
		}
		else if(status == "timeout"){
			
			createNotificationCard("Request timed out. Retrying...", "warn");
			//retries
			submitData();
		}
		else{
			
			createNotificationCard("Error", "alert");
			console.error(data, status);
		}
	});
}
$(function(){
	
	$("#submit").on('click', function(){
		
		createNotificationCard( "Submitting data..." );
		
		var data_text = $("#text").val();
		
		$.post("/ajax-example/submit", {
			
			text: data_text
			
		}, function(res, status){
			
			if(status == "success")
				createNotificationCard("Data successfully sent. Respone: " + res.data, "good");
			else{
				createNotificationCard("Error", "alert");
				console.error(data, status);
			}
		});
	});
	

});
$(function(){
	
	$("#submit").on('click', function(){
		
		var formData = getFormData($("#matchform"));
		var formDataString = JSON.stringify(formData);
		
		localStorage.setItem("matchFormData", formDataString); 
		
		submitData("./match/submit", "matchFormData");
		
	});

});

function getFormData($form){
    var unindexed_array = $form.serializeArray();
    var indexed_array = {};

    $.map(unindexed_array, function(n, i){
        indexed_array[n['name']] = n['value'];
    });

    return indexed_array;
}

function submitData(url, dataKey){
	
	var dataString = localStorage.getItem(dataKey);
	if(!dataString)
		return console.error("Failed to get data from localStorage");
	console.log(dataString);
	var data = JSON.parse(dataString);
	console.log(data);
	
	$.post( url, data, function( res, status ){
		var cardType;
		
		switch( res.status ){
			case 200:
				cardType = "good"; break;
			case 500:
				cardType = "bad"; break;
		}
		console.log(res);
		
		createNotificationCard( res.message, cardType );
		
	}).fail(function(){
		console.warn("failed");
		createNotificationCard("Failed to send data. Attempting to re-submit...", "warn");
		setTimeout(function(){
			submitData(url, dataKey);
		}, 750);
	});
	
}
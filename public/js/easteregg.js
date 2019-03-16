$(function(){
	
	var rand = Math.random();
	if( rand < 0.05 ){
		var audio = document.createElement("audio");
		var source = document.createElement("source");
		$(audio).attr("id", "sandstormEgg");
		$(source).attr("src", "/darude_sandstorm.mp3");
		$(source).attr("type", "audio/mpeg");
		$(audio).append(source);
		$(document.body).append(audio);
		
		var didPlayEasterEgg = false;
		$(document.body).click(function(){
			$("#sandstormEgg")[0].play();
			didPlayEasterEgg = true;
		});
	}
	
})
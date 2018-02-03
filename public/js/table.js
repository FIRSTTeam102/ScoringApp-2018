var xhttp = new XMLHttpRequest();

xhttp.onreadystatechange = function(){
	if(this.readyState == 4 && this.status == 200){
		document.getElementById("js-text").innerHTML = this.responseText;
	}
};


xhttp.open("GET", "js/app.js", true);
xhttp.send();
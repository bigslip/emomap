function initialize() {
    var map = L.map('map').setView([48.209219, 16.370821], 16);
    L.tileLayer('../../tiles_vienna/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
	
			
	$("#start-menu-contribute").click(function(){
		//start contributing
		$("#start-menu").hide();
		$("#slider-comfort").show();
		$("#info").hide();
	});
	
	$("#start-menu-my").click(myEmoMap); //show the user' contributions
	$("#start-menu-all").click(allEmoMap); //show all contributions
	$("#start-menu-about").click(Info);//information about emomap
	
	$("#navbar-start").click(function(){
		//start the main page
		$("#start-menu").show();
		$("#slider-comfort").hide();
		$("#info").hide();
	});
	
	$("#navbar-my").click(myEmoMap);	
	$("#navbar-all").click(allEmoMap);	
	$("#navbar-about").click(Info);
	
	$("#next").click(Next);
	
	
	//get current location, we mock up a location
	var curLat = 48.209219;
	var curLng = 16.370821;
	var locationIcon = L.icon({
		iconUrl: 'css/lib/images/marker-icon.png'		
	});
	var marker = L.marker([curLat, curLng], {icon: locationIcon, draggable: true}).addTo(map);
	marker.bindPopup("Drag the marker to correct location").openPopup();	
	marker.on('dragend', function(event) {
		var latlng = event.target.getLatLng();  
		curLat= latlng.lat;
		curLng = latlng.lng;
	});
	
	
	
}


//show the user' contributions
function myEmoMap(){		
	$("#start-menu").hide();
	$("#slider-comfort").hide();
	$("#info").hide();
}

//show all contributions
function allEmoMap(){		
	$("#start-menu").hide();
	$("#slider-comfort").hide();
	$("#info").hide();
}

//information about emomap
function Info(){		
	$("#start-menu").hide();
	$("#slider-comfort").hide();
	$("#info").show();
}

//next
function Next() {
	alert("dd");
}

document.addEventListener('deviceready', initialize);

//
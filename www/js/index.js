function initialize() {
    var map = L.map('map').setView([48.209219, 16.370821], 16);
    L.tileLayer('../../tiles_vienna/{z}/{x}/{y}.png', {
        //attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
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
		$("#navbar-start").addClass("ui-btn-active");
		$("#navbar-my").removeClass("ui-btn-active");
		$("#navbar-all").removeClass("ui-btn-active");
		$("#navbar-about").removeClass("ui-btn-active");
	});
	
	$("#navbar-my").click(myEmoMap);	
	$("#navbar-all").click(allEmoMap);	
	$("#navbar-about").click(Info);
	
	$("#next").click(Next);
	
	//initial values
	var curLat = 48.209219;
	var curLng = 16.370821;
	var level_of_comfort=4;
	var adj="";
	var conx_with="alone";
	var conx_first="first_time";
	
	//get current location, we need to use Geolocation
	curLat = 48.209219;
	curLng = 16.370821;
	var locationIcon = L.icon({
		iconUrl: 'css/lib/images/marker-icon.png'		
	});
	var marker = L.marker([curLat, curLng], {icon: locationIcon, draggable: true}).addTo(map);
	marker.bindPopup("Drag the marker to correct location").openPopup();	
	marker.on('dragend', function(event) {
		var latlng = event.target.getLatLng();  
		console.log(latlng);
		curLat= latlng.lat;
		curLng = latlng.lng;
	});	
	
	//get level of comfort
	$("#slider1").bind("slidestop", function () {  			
		level_of_comfort = $("#slider1").val();
		console.log(level_of_comfort);
	});
	
	//get adjectives
	$("#adj").bind( "change", function() {
		adj = $(this).val();
		console.log(adj);
	});
	
	//get context (with whom)
	$(".checkbox-with").bind( "change", function() {
		var click_alone=$(this).prop("value").includes("alone");			
		if(click_alone){
			$("#checkbox-h-2a").attr("checked",true).checkboxradio("refresh");
			$("#checkbox-h-2b").attr("checked",false).checkboxradio("refresh");
			$("#checkbox-h-2c").attr("checked",false).checkboxradio("refresh");
			$("#checkbox-h-2d").attr("checked",false).checkboxradio("refresh");
		}
		else{
			$("#checkbox-h-2a").attr("checked",false).checkboxradio("refresh");
		}
		
		conx_with= $(".checkbox-with:checked").map(function () {return this.value;}).get().join(",");
		
		console.log(conx_with);
	});
	//get context (first time)
	$("input[type='radio']").bind( "change", function() {
        conx_first=$(this).val();
		console.log(conx_first);
	});

}


//show the user' contributions
function myEmoMap(){		
	$("#start-menu").hide();
	$("#slider-comfort").hide();
	$("#info").hide();
	$("#navbar-start").removeClass("ui-btn-active");
	$("#navbar-my").addClass("ui-btn-active");
	$("#navbar-all").removeClass("ui-btn-active");
	$("#navbar-about").removeClass("ui-btn-active");
}

//show all contributions
function allEmoMap(){		
	$("#start-menu").hide();
	$("#slider-comfort").hide();
	$("#info").hide();
	$("#navbar-start").removeClass("ui-btn-active");
	$("#navbar-my").removeClass("ui-btn-active");
	$("#navbar-all").addClass("ui-btn-active");
	$("#navbar-about").removeClass("ui-btn-active");
}

//information about emomap
function Info(){		
	$("#start-menu").hide();
	$("#slider-comfort").hide();
	$("#info").show();
	$("#navbar-start").removeClass("ui-btn-active");
	$("#navbar-my").removeClass("ui-btn-active");
	$("#navbar-all").removeClass("ui-btn-active");
	$("#navbar-about").addClass("ui-btn-active");
}

//next
function Next() {
	alert("dd");
}

document.addEventListener('deviceready', initialize);

//
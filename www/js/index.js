function initialize() {
    var map = L.map('map').setView([48.209219, 16.370821], 16);
    L.tileLayer('../../tiles_vienna/{z}/{x}/{y}.png', {
        //attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
	
	//initial values
	var curLat = 48.209219;
	var curLng = 16.370821;
	var level_of_comfort=4;
	var adj="";
	var conx_with="alone";
	var conx_first="first_time";
	var marker;
			
	$("#start-menu-contribute").click(function(){
		//enabling comfort slider to start contributing
		$("#start-menu,#checkbox-adj,#checkbox-conx,#info").hide();
		$("#slider-comfort").show();		
		$("#comfort_next").addClass("ui-disabled");//disable "next"
		$("#navbar-start,#navbar-my,#navbar-all,#navbar-about").addClass("ui-disabled");//disable all nav bars
		
		//set all forms to initial values
		$('#slider1').val(4).slider('refresh'); 
		$('#adj').val("").selectmenu('refresh'); 
		$("#checkbox-h-2a").prop("checked",true).checkboxradio("refresh");
		$("#checkbox-h-2b,#checkbox-h-2c,#checkbox-h-2d").prop("checked",false).checkboxradio("refresh");		
		$("#radio-choice-21").prop("checked",true).checkboxradio("refresh"); 
		$("#radio-choice-22").prop("checked",false).checkboxradio("refresh"); 
		
		//set all initial values		
		adj="";
		
	});
	
	$("#start-menu-my").click(myEmoMap); //show the user' contributions
	$("#start-menu-all").click(allEmoMap); //show all contributions
	$("#start-menu-about").click(Info);//information about emomap
	
	$("#navbar-start").click(function(){
		//start the main page
		$("#start-menu").show();
		$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();
		$("#navbar-start").addClass("ui-btn-active");
		$("#navbar-my,#navbar-all,#navbar-about").removeClass("ui-btn-active");
	});
	
	$("#navbar-my").click(myEmoMap);	
	$("#navbar-all").click(allEmoMap);	
	$("#navbar-about").click(Info);
	
	$("#comfort_cancel").click(function(){
		//go back to start page
		$("#start-menu").show();
		$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();
		$("#navbar-start,#navbar-my,#navbar-all,#navbar-about").removeClass("ui-disabled");//enable all nav bars
	});
	$("#comfort_next").click(function(){
		//go to adj page
		$("#start-menu,#slider-comfort,#checkbox-conx,#info").hide();
		$("#checkbox-adj").show();
		if(adj=="")
			$("#adj_next").addClass("ui-disabled");//disable "next"
	});
	
	$("#adj_back").click(function(){
		//go back to slider page
		$("#start-menu,#checkbox-adj,#checkbox-conx,#info").hide();
		$("#slider-comfort").show();			
		$("#comfort_next").removeClass("ui-disabled");//enable "next"
	});	
	$("#adj_next").click(function(){
		//go to conx page		
		$("#start-menu,#slider-comfort,#checkbox-adj,#info").hide();
		$("#checkbox-conx").show();
	});
	
	$("#conx_back").click(function(){
		//go back to slider page
		$("#start-menu,#slider-comfort,#checkbox-conx,#info").hide();
		$("#checkbox-adj").show();
		$("#adj_next").removeClass("ui-disabled");//enable "next"
	});	
	$("#conx_next").click(function(){
		//submit to pouchdb and couchdb 
		//add result to map	
		//set all variables to initial values
		$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();
		$("#navbar-start,#navbar-my,#navbar-all,#navbar-about").removeClass("ui-disabled");//enable all nav bars
		alert("Thank you!");
	});
	
	//get current location, we need to use Geolocation
	curLat = 48.209219;
	curLng = 16.370821;
	var locationIcon = L.icon({
		iconUrl: 'css/lib/images/marker-icon.png'		
	});
	marker = L.marker([curLat, curLng], {icon: locationIcon, draggable: true}).addTo(map);
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
		$("#comfort_next").removeClass("ui-disabled");//enable "next"
	});
	
	//get adjectives
	$("#adj").bind( "change", function() {
		adj = $(this).val();
		console.log(adj);		
		$("#adj_next").removeClass("ui-disabled");//enable "next"
	});
	
	//get context (with whom)
	$(".checkbox-with").bind( "change", function() {
		var click_alone=$(this).prop("value").includes("alone");			
		if(click_alone){
			$("#checkbox-h-2a").attr("checked",true).checkboxradio("refresh");
			$("#checkbox-h-2b,#checkbox-h-2c,#checkbox-h-2d").attr("checked",false).checkboxradio("refresh");
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
	$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();
	$("#navbar-start,#navbar-all,#navbar-about").removeClass("ui-btn-active");
	$("#navbar-my").addClass("ui-btn-active");
}

//show all contributions
function allEmoMap(){		
	$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();
	$("#navbar-start,#navbar-my,#navbar-about").removeClass("ui-btn-active");
	$("#navbar-all").addClass("ui-btn-active");
}

//information about emomap
function Info(){		
	$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx").hide();
	$("#info").show();
	$("#navbar-start,#navbar-my,#navbar-all").removeClass("ui-btn-active");
	$("#navbar-about").addClass("ui-btn-active");
}



document.addEventListener('deviceready', initialize);

//
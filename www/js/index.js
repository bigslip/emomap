function initialize() {   
	
	//initial values
	var curLatLng = [48.209219,16.370821];
	//var curLatLng = [48.191472, 16.269066];
	var curLatLngAccuracy=0;
	var curHeading = 0;
	var level_of_comfort=4;
	var adj="";
	var conx_with="alone";
	var conx_first="first_time";
	var marker;
	
	if (navigator.notification) { // Override default HTML alert with native dialog
		window.alert = function (message) {
			navigator.notification.alert(
			message,    // message
			null,       // callback
			"EmoMap", // title
			'OK'        // buttonName
			);
		};
	}
	
	
	//device information, network status, gps location
	var uuid= device.uuid;
	var networkState = navigator.connection.type;
	
	//need to check GPS is enabled or not
	navigator.geolocation.getCurrentPosition(
	function(position) {
		//curLatLng=new L.LatLng(position.coords.latitude, position.coords.longitude);
		curLatLng = [position.coords.latitude, position.coords.longitude];
		curLatLngAccuracy = position.coords.accuracy;
		map.panTo(curLatLng);
		marker.setLatLng (curLatLng);					
	},
	function(error) {
		alert('code: '    + error.code    + '\n' +
		'message: ' + error.message + '\n');
	},
	{maximumAge: 3000, timeout: 30000, enableHighAccuracy: true }	
	);
	
	navigator.compass.getCurrentHeading(
	function(heading) {
		//curLatLng=new L.LatLng(position.coords.latitude, position.coords.longitude);
		curHeading = heading.magneticHeading;						
	},
	function(error) {
		alert('code: '    + error.code    + '\n' +
		'message: ' + error.message + '\n');
	});
	
	
	
	var markersMy, markersAll;
	
	var db = new PouchDB('emomap_'+uuid,{auto_compaction:true});
	var remoteUserCouch = 'http://emomap:Carto126.1040w,y@128.130.178.154:5984/emomap_'+uuid;
	var remoteAllCouch = 'http://emomap:Carto126.1040w,y@128.130.178.154:5984/emomap_all';
	
	db.changes({
		since: 'now',
		live: true
		}).on('change', function(change) {
		// handle change
	});
	
	if (remoteUserCouch) {
		var opts = {live: true};
		db.replicate.to(remoteUserCouch, opts, syncError);		
		db.replicate.from(remoteUserCouch, opts, syncError);
		db.replicate.to(remoteAllCouch, opts, syncError);
	}
	// There was some form or error syncing
	function syncError() {
		console.log('There was some form or error syncing!');
	}
	
	//Check whether it is the first time launch
	var isApplaunch = window.localStorage.getItem('isLaunch');
	if(isApplaunch){
		$("#start-page").hide();
		$("#main-page").show();
		}else {
		//first time launch
		$("#start-page").show();
		$("#main-page").hide();				
	}
	
	//registration	
	
	var gender="male";
	$("#gender").bind( "change", function() {
		gender = $(this).val();
		console.log(gender);				
	});
	var birthyear="1951";
	$("#birthyear").bind( "change", function() {
		birthyear = $(this).val();
		console.log(birthyear);				
	});
	var workstatus="employed";
	$("#workstatus").bind( "change", function() {
		workstatus = $(this).val();
		console.log(workstatus);				
	});
	$("#register").click(function(){		
		//register users
		//might be good to check whether the internet is available
		//it does not check whether the device is already registered or not.
		var db_users = new PouchDB('http://emomap:Carto126.1040w,y@128.130.178.154:5984/emomap_user');
		var timestamp= new Date().toISOString();
		var emo_user = {
			_id: uuid,
			timestamp: timestamp,
			gender: gender,
			birthyear: birthyear,
			workstatus: workstatus
		};
		db_users.put(emo_user, function callback(err, result) {
			if (!err) {
				console.log('Successfully register a user!');
			}
		});
		
		//set isLaunch as true
		window.localStorage.setItem('isLaunch',true);
		alert("Thank you! Now you start to create your emotional map!");
		
		$("#start-page").hide();
		$("#main-page").show();
		map._onResize(); 
	});
	
	
	/*
		var map = L.map('map').setView(curLatLng, 16);
		L.tileLayer('../../tiles_vienna/{z}/{x}/{y}.png', {
		//attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);
	*/
	var map = L.map('map', {
		center: curLatLng,
		zoom: 16,
		minZoom: 12,
		maxZoom: 16,
	});	
	/*
	L.tileLayer('tiles/{z}/{x}/{y}.png', {
		//attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
	*/	
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		
		//attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, Points &copy 2012 LINZ'
	}).addTo(map);
	
	
	//add a marker to identify the map center
	var locationIcon = L.icon({
		iconUrl: 'css/lib/images/marker-icon.png',		
		shadowUrl: 'css/lib/images/marker-shadow.png',
		iconSize:     [25, 41], // size of the icon
		shadowSize:   [41, 41], // size of the shadow
		iconAnchor:   [12, 40], // point of the icon which will correspond to marker's location
		shadowAnchor: [10, 41],  // the same for the shadow
		popupAnchor:  [0, -40] // point from which the popup should open relative to the iconAnchor
	});
	marker = L.marker(curLatLng, {icon: locationIcon, draggable: true}).addTo(map);	
	
	//marker = L.marker([48.191472, 16.269066],{draggable: true}).addTo(map);
	marker.on('dragend', function(event) {
		var latLng = event.target.getLatLng();  
		curLatLng = [latLng.lat, latLng.lng];
		console.log(curLatLng);		
	});
	
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
		
		navigator.geolocation.getCurrentPosition(
		function(position) {
			//curLatLng=new L.LatLng(position.coords.latitude, position.coords.longitude);
			curLatLng = [position.coords.latitude, position.coords.longitude];
			curLatLngAccuracy = position.coords.accuracy;			
			map.panTo(curLatLng);
			marker.setLatLng (curLatLng);
			marker.bindPopup("Drag the marker to correct location!").openPopup();				
		},
		function(error) {
			alert('code: '    + error.code    + '\n' +
			'message: ' + error.message + '\n');
		},
		{maximumAge: 3000, timeout: 30000, enableHighAccuracy: true }	
		);
		
		navigator.compass.getCurrentHeading(
		function(heading) {			
			curHeading = heading.magneticHeading;						
		},
		function(error) {
			alert('code: '    + error.code    + '\n' +
			'message: ' + error.message + '\n');
		});		
		
		//set all initial values		
		level_of_comfort=4;
		adj="";
		conx_with="alone";
		conx_first="first_time";
		
	});
	
	//show the user' contributions
	$("#start-menu-my, #navbar-my").click(function(){
		
		$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();
		$("#map").show();
		$("#navbar-start,#navbar-all,#navbar-about").removeClass("ui-btn-active");
		$("#navbar-my").addClass("ui-btn-active");			
		
		//clean map view
		if (map.hasLayer(markersAll)){
			map.removeLayer(markersAll);
		}
		if (map.hasLayer(markersMy)){
			map.removeLayer(markersMy);
		}
		navigator.geolocation.getCurrentPosition(
		function(position) {
			//curLatLng=new L.LatLng(position.coords.latitude, position.coords.longitude);
			curLatLng = [position.coords.latitude, position.coords.longitude];
			map.panTo(curLatLng);
			marker.setLatLng (curLatLng);
			//marker.getPopup().setContent("You are here!");
			//marker.openPopup();				
		},
		function(error) {
			alert('code: '    + error.code    + '\n' +
			'message: ' + error.message + '\n');
		},
		{maximumAge: 3000, timeout: 30000, enableHighAccuracy: true }	
		);
		
		//read data from the local database
		db.allDocs({include_docs: true, descending: true}, function(err, doc) {
			//process all layers
			var locations=[];
			var emos=[];
			var ii=0;
			doc.rows.forEach(function(todo) {
				locations.push(todo.doc.location);
				emos.push(todo.doc.comfort);
				ii++;
			});
			markersMy = vizEmos(map, locations, emos);
		});
	}); 
	
	//show all contributions
	$("#start-menu-all, #navbar-all").click(function(){
		//clean map view
		if (map.hasLayer(markersAll)){
			map.removeLayer(markersAll);
		}
		if (map.hasLayer(markersMy)){
			map.removeLayer(markersMy);
		}
		
		if (networkState == Connection.NONE){
			alert("The EmoMap can not be shown due to no Internet Connection!");
			//start the main page
			$("#start-menu").show();
			$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();
			$("#navbar-start").addClass("ui-btn-active");
			$("#navbar-my,#navbar-all,#navbar-about").removeClass("ui-btn-active");
			return;
		}	
		
		$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();
		$("#map").show();
		$("#navbar-start,#navbar-my,#navbar-about").removeClass("ui-btn-active");
		$("#navbar-all").addClass("ui-btn-active");	
		
		
		
		navigator.geolocation.getCurrentPosition(
		function(position) {
			//curLatLng=new L.LatLng(position.coords.latitude, position.coords.longitude);
			curLatLng = [position.coords.latitude, position.coords.longitude];
			map.panTo(curLatLng);
			marker.setLatLng (curLatLng);
			//marker.getPopup().setContent("You are here!");
			//marker.openPopup();				
		},
		function(error) {
			alert('code: '    + error.code    + '\n' +
			'message: ' + error.message + '\n');
		},
		{maximumAge: 3000, timeout: 30000, enableHighAccuracy: true }	
		);
		
		
		//read data from the server database
		var db_server = new PouchDB(remoteAllCouch);
		db_server.allDocs({include_docs: true, descending: true}, function(err, doc) {
			//process all layers
			var locations=[];
			var emos=[];
			doc.rows.forEach(function(todo) {
				locations.push(todo.doc.location);
				emos.push(todo.doc.comfort);			
			});	
			markersAll = vizEmos(map, locations, emos);
		});
	}); 
	
	//information about emomap
	$("#start-menu-about,#navbar-about").click(function(){
		$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx, #map").hide();
		$("#info").show();		
		$("#navbar-start,#navbar-my,#navbar-all").removeClass("ui-btn-active");
		$("#navbar-about").addClass("ui-btn-active");
		
		//clean map view
		if (map.hasLayer(markersAll)){
			map.removeLayer(markersAll);
		}
		if (map.hasLayer(markersMy)){
			map.removeLayer(markersMy);
		}
	});	
	
	$("#navbar-start").click(function(){
		//start the main page
		$("#start-menu, #map").show();
		$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();
		$("#navbar-start").addClass("ui-btn-active");
		$("#navbar-my,#navbar-all,#navbar-about").removeClass("ui-btn-active");
		
		//clean map view
		if (map.hasLayer(markersAll)){
			map.removeLayer(markersAll);
		}
		if (map.hasLayer(markersMy)){
			map.removeLayer(markersMy);
		}
	});	
	
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
		//submit to pouchdb and couchd, add result to map, set all variables to initial values
		$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();
		$("#navbar-start,#navbar-my,#navbar-all,#navbar-about").removeClass("ui-disabled");//enable all nav bars
		
		var timestamp = new Date().toISOString();		
		var emo = {
			_id: timestamp,
			user: uuid,
			location: curLatLng,
			location_accuracy: curLatLngAccuracy,
			heading: curHeading,
			timestamp: timestamp,
			comfort: level_of_comfort,
			adjective: adj,
			conx_with: conx_with,
			conx_first: conx_first
		};
		db.put(emo, function callback(err, result) {
			if (!err) {
				console.log('Successfully posted a todo!');
			}
		});
		//marker.getPopup().setContent("<b>Thank you for your contribution!</b>");
		marker.closePopup();
		alert("Thank you for your contribution!");
		
		$("#start-menu").show();
		$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();			
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



//show all contributions
function allEmoMap(){		
	$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();
	$("#navbar-start,#navbar-my,#navbar-about").removeClass("ui-btn-active");
	$("#navbar-all").addClass("ui-btn-active");
}

//information about emomap
function Info(){		
	
}

//visualizing emos using marker cluster
function vizEmos (map, locations, emos){
	var markers = L.markerClusterGroup();	
	for (var i = 0; i < emos.length; i++) {
		var locationIcon = L.icon({
			iconUrl: 'css/lib/images/emo'+emos[i].toString()+'.png'		
		});
		
		var marker_emo = L.marker(locations[i], { icon: locationIcon});
		marker_emo.mydata=parseInt(emos[i]);
		markers.addLayer(marker_emo);
	}
	map.addLayer(markers);
	return markers;
}

document.addEventListener('deviceready', initialize);

//	
function initialize() {   
	
	ln.init();//set page language according to the device language
	
	//initial values
	var curLatLng = [48.209219,16.370821],
	//curLatLng = [48.191472, 16.269066],
	curLatLngAccuracy = 0,
	curHeading = 0,
	level_of_comfort = 4,
	adj = "",
	conx_with = "alone",
	conx_first = "first_time",
	marker;
	
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
	
	
	//check whether GPS is on?
	cordova.plugins.diagnostic.isLocationEnabled(
	function(e){
		if(!e){
			navigator.notification.alert(i18n.t('messages.location-enable'), alertDismissed_gpsSetting1, "EmoMap", i18n.t('messages.ok'));
			function alertDismissed_gpsSetting1() {
            	cordova.plugins.diagnostic.switchToLocationSettings();
			}			
		}
	},
	function(e){
		//alert('Error '+e);
		navigator.notification.alert(i18n.t('messages.location-enable'), alertDismissed_gpsSetting2, "EmoMap", i18n.t('messages.ok'));
		function alertDismissed_gpsSetting2() {
			cordova.plugins.diagnostic.switchToLocationSettings();
		}
	}
	);
	
	//device information, network status, gps location
	var uuid = device.uuid;
	var networkState = navigator.connection.type;
	document.addEventListener("offline", onOffline, false);
	function onOffline() {
		// Handle the offline event
		networkState = navigator.connection.type;
	}
	document.addEventListener("online", onOnline, false);
	function onOnline() {
		// Handle the online event
		networkState = navigator.connection.type;
	}
	
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
		//alert('code: '    + error.code    + '\n' +'message: ' + error.message + '\n');
		//alert('Can not get your current location!');
	},
	{maximumAge: 3000, timeout: 30000, enableHighAccuracy: true }	
	);
	
	navigator.compass.getCurrentHeading(
	function(heading) {
		//curLatLng=new L.LatLng(position.coords.latitude, position.coords.longitude);
		curHeading = heading.magneticHeading;						
	},
	function(error) {
		//alert('code: '    + error.code    + '\n' +'message: ' + error.message + '\n');
	}
    );
	
	
	
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
	if (isApplaunch){
		$("#start-page").hide();
		$("#main-page").show();
		}
    else {
		//first time launch
		$("#start-page").show();
		$("#main-page").hide();				
	}
	
	//registration	
	
	var gender="";
	$("#gender").bind( "change", function() {
		gender = $(this).val();		
		console.log(gender);				
	});
	var birthyear="";
	$("#birthyear").bind( "change", function() {
		birthyear = $(this).val();
		console.log(birthyear);				
	});
	var workstatus="";
	$("#workstatus").bind( "change", function() {
		workstatus = $(this).val();
		console.log(workstatus);				
	});
	$("#register").click(function(){		
		//register users
		if((gender=="")||(birthyear=="")||(workstatus=="")){
			alert(i18n.t('messages.registration-form-empty'));
			return;
		}
			
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
		//alert("Thank you! Now you start to create your emotional map!");
		//alert(i18n.t('messages.registration-success'));
		navigator.notification.alert(i18n.t('messages.registration-success'), alertDismissed_registrationSuccess, "EmoMap", i18n.t('messages.ok'));
		function alertDismissed_registrationSuccess() {
			$("#start-page").hide();
			$("#main-page").show();
			// resize map to cover whole screen
			var mapEl = $('#map');
			mapEl.height($(document).height() - mapEl.offset().top);
			var mapEl = $('.tabs');
			mapEl.height($(document).height() - mapEl.offset().top);
			map._onResize();
		}		 
	});
	
	
	/*
		var map = L.map('map').setView(curLatLng, 16);
		L.tileLayer('../../tiles_vienna/{z}/{x}/{y}.png', {
		//attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);
	*/
    // resize map to cover whole screen
    var mapEl = $('#map');
    mapEl.height($(document).height() - mapEl.offset().top);
    var mapEl = $('.tabs');
    mapEl.height($(document).height() - mapEl.offset().top);
    
	var map = L.map('map', {
		center: curLatLng,
		zoom: 16
	});	
	if (networkState == Connection.NONE){	
		L.tileLayer('tiles/{z}/{x}/{y}.png', {
		//L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
			minZoom:12,
			maxZoom:16
		}).addTo(map);		
	}
	else{
		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'			
		}).addTo(map);		
	}
	

	
    var MARKER_SIZE = 0.4;
    
	function EmoIcon(emo) {
        function getEmoImage(emo) {
            if (emo === null || emo === undefined) {
                return 'img/emo_empty.png'
			}
			return 'img/emo_' + emo + '.png'
		}
		var icon = L.divIcon({
            className: 'emoMarker',
            iconSize: [153*MARKER_SIZE, 186*MARKER_SIZE],
            iconAnchor: [76*MARKER_SIZE, 186*MARKER_SIZE],
            popupAnchor: [0, -186*MARKER_SIZE],
            html: '<img style="position:absolute; top:0; left:0; width:' + (153*MARKER_SIZE) + 'px;" src="img/locationmarker.png">' +
			'<img style="position:absolute; top:3.3%; left:5.4%; width:' + (137*MARKER_SIZE) + 'px;" src="' + getEmoImage(emo) + '">'
		});
        return icon;
	}
    
	//add a marker to identify the map center
	var locationIcon = EmoIcon();
	marker = L.marker(curLatLng, {icon: EmoIcon(), draggable: true}).addTo(map);	
	
	//marker = L.marker([48.191472, 16.269066],{draggable: true}).addTo(map);
	marker.on('dragend', function(event) {
		var latLng = event.target.getLatLng();  
		curLatLng = [latLng.lat, latLng.lng];
		console.log(curLatLng);		
	});
	
	$("#start-menu-contribute").click(function(){
		//enabling comfort slider to start contributing
		$("#start-menu,#checkbox-adj,#checkbox-conx,#mymap-stat,#info").hide();
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
		marker.closePopup();
		navigator.geolocation.getCurrentPosition(
		function(position) {
			//curLatLng=new L.LatLng(position.coords.latitude, position.coords.longitude);
			curLatLng = [position.coords.latitude, position.coords.longitude];
			curLatLngAccuracy = position.coords.accuracy;			
			map.panTo(curLatLng);
			marker.setLatLng (curLatLng);
			//marker.bindPopup("Correct location? You can drag the marker to adjust its position!").openPopup();
			marker.bindPopup(i18n.t('messages.marker-popup')).openPopup();
		},
		function(error) {
			//alert('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
		},
		{maximumAge: 3000, timeout: 30000, enableHighAccuracy: true }	
		);
		
		navigator.compass.getCurrentHeading(
		function(heading) {			
			curHeading = heading.magneticHeading;						
		},
		function(error) {
			//alert('code: '    + error.code    + '\n' +'message: ' + error.message + '\n');
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
		marker.setIcon(EmoIcon());
		marker.closePopup();
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
			//alert('code: '    + error.code    + '\n' +'message: ' + error.message + '\n');
			//alert('Can not get your current location!');
			alert(i18n.t('messages.geolocation-error'));			
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
			$("#mymap-stat").html ("<b>In total, you have " + ii + " contributions. </b><br/><br/>");
			$("#mymap-stat").show();
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
		marker.setIcon(EmoIcon());
		marker.closePopup();
		
		if (networkState == Connection.NONE){
			//alert("The EmoMap can not be shown due to no Internet Connection!");
			alert(i18n.t('messages.allemomap-nointernet'));
			//start the main page
			$("#start-menu").show();
			$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();
			$("#navbar-start").addClass("ui-btn-active");
			$("#navbar-my,#navbar-all,#navbar-about").removeClass("ui-btn-active");
			return;
		}	
		
		$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#mymap-stat,#info").hide();
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
			//alert('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
			alert(i18n.t('messages.geolocation-error'));
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
		$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#mymap-stat,#map").hide();
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
		marker.closePopup();
	});	
	
	$("#navbar-start").click(function(){
		//start the main page
		$("#start-menu, #map").show();
		$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info,#mymap-stat").hide();
		$("#navbar-start").addClass("ui-btn-active");
		$("#navbar-my,#navbar-all,#navbar-about").removeClass("ui-btn-active");
		
		//clean map view
		if (map.hasLayer(markersAll)){
			map.removeLayer(markersAll);
		}
		if (map.hasLayer(markersMy)){
			map.removeLayer(markersMy);
		}
		marker.closePopup();
	});	
	
	$("#comfort_cancel").click(function(){
		//go back to start page
		$("#start-menu").show();
		$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info,#mymap-stat").hide();
		$("#navbar-start,#navbar-my,#navbar-all,#navbar-about").removeClass("ui-disabled");//enable all nav bars
		marker.setIcon(EmoIcon());
		marker.closePopup();
	});
	$("#comfort_next").click(function(){
		//go to adj page
		$("#start-menu,#slider-comfort,#checkbox-conx,#info,#mymap-stat").hide();
		$("#checkbox-adj").show();
		
		if(adj=="")
		$("#adj_next").addClass("ui-disabled");//disable "next"
	});
	
	$("#adj_back").click(function(){
		//go back to slider page
		$("#start-menu,#checkbox-adj,#checkbox-conx,#info,#mymap-stat").hide();
		$("#slider-comfort").show();			
		$("#comfort_next").removeClass("ui-disabled");//enable "next"
	});	
	$("#adj_next").click(function(){
		//go to conx page		
		$("#start-menu,#slider-comfort,#checkbox-adj,#info,#mymap-stat").hide();
		$("#checkbox-conx").show();
	});
	
	$("#conx_back").click(function(){
		//go back to slider page
		$("#start-menu,#slider-comfort,#checkbox-conx,#info,#mymap-stat").hide();
		$("#checkbox-adj").show();
		$("#adj_next").removeClass("ui-disabled");//enable "next"
	});	
	$("#conx_next").click(function(){
		//submit to pouchdb and couchd, add result to map, set all variables to initial values
		$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#info,#mymap-stat").hide();
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
		
		//alert("Thank you for your contribution!");
		//alert(i18n.t('messages.contribution-success'));
		navigator.notification.alert(i18n.t('messages.contribution-success'), alertDismissed_contributionSuccess, "EmoMap", i18n.t('messages.ok'));
		function alertDismissed_contributionSuccess() {
			$("#start-menu").show();
			$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info,#mymap-stat").hide();	
			$("#navbar-start").addClass("ui-btn-active");
			marker.setIcon(EmoIcon());
			marker.closePopup();
		}				
	});
	
	
	
	//get level of comfort
	$("#slider1").bind("slidestop", function () {  			
		level_of_comfort = $("#slider1").val();
		console.log(level_of_comfort);
        //locationIcon.setEmo(level_of_comfort);
        marker.setIcon(EmoIcon(level_of_comfort-4));
		$("#comfort_next").removeClass("ui-disabled");//enable "next"
	});
	
	//get adjectives
	$("#adj").bind( "change", function() {
		adj = $(this).val();
		console.log(adj);	
		if((adj==null)||(adj==""))
		$("#adj_next").addClass("ui-disabled");//disable "next"
		else
		$("#adj_next").removeClass("ui-disabled");//enable "next"		
	});
	
	//get context (with whom)
	$(".xcheckbox-with").bind( "change", function() {
		//alert($(this).val());
		//var click_alone=$(this).attr("value").includes("alone");		
		var click_alone=$(this).val().search("alone");
		if(click_alone!=-1){
			$("#checkbox-h-2a").attr("checked",true).checkboxradio("refresh");
			$("#checkbox-h-2b,#checkbox-h-2c,#checkbox-h-2d").attr("checked",false).checkboxradio("refresh");
		}
		else{			
			$("#checkbox-h-2a").attr("checked",false).checkboxradio("refresh",true);
		}
		
		conx_with= $(".xcheckbox-with:checked").map(function () {return this.value;}).get().join(",");
		
		console.log(conx_with);
	});
	//get context (first time)
	$("input[type='radio']").bind( "change", function() {
		conx_first=$(this).val();
		console.log(conx_first);
	});
	
}

//visualizing emos using marker cluster
function vizEmos (map, locations, emos){
	var markers = L.markerClusterGroup();	
	for (var i = 0; i < emos.length; i++) {
		var locationIcon = L.icon({
			iconUrl: 'css/lib/images/emo'+emos[i].toString()+'.png'		
		});
		
		var marker_emo = L.marker(locations[i], { icon: locationIcon});
		marker_emo.bindPopup("comfortable: " + emos[i].toString());
		marker_emo.mydata=parseInt(emos[i]);
		markers.addLayer(marker_emo);
	}
	map.addLayer(markers);
	return markers;
}

document.addEventListener('deviceready', initialize);

//	
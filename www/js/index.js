function initialize() {   
	
	ln.init();//set page language according to the device language
	
	//initial values
	var curLatLng = [45.810991, 9.081521],
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
			if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
				navigator.notification.alert("Please enable your location services!", alertDismissed_gpsSetting1, "EmoMap", "OK" );
			}
			else{	
				navigator.notification.alert(i18n.t('messages.location-enable'), alertDismissed_gpsSetting1, "EmoMap", i18n.t('messages.ok') );
			}
			function alertDismissed_gpsSetting1() {
            	cordova.plugins.diagnostic.switchToLocationSettings();
				//here might need to tell the user that they might need to re-start the app to get the gps location
			}			
		}
	},
	function(e){
		//alert('Error '+e);
		if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
			navigator.notification.alert("Please enable your location services!", alertDismissed_gpsSetting2, "EmoMap", "OK" );
		}
		else{	
			navigator.notification.alert(i18n.t('messages.location-enable'), alertDismissed_gpsSetting2, "EmoMap", i18n.t('messages.ok') );
		}
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
		curLatLng = [position.coords.latitude, position.coords.longitude];
		curLatLngAccuracy = position.coords.accuracy;
		map.panTo(curLatLng);
		marker.setLatLng (curLatLng);					
	},
	function(error) {
		//alert('code: '    + error.code    + '\n' +'message: ' + error.message + '\n');
	},
	{maximumAge: 3000, timeout: 30000, enableHighAccuracy: true }	
	);
	
	navigator.compass.getCurrentHeading(
	function(heading) {
		curHeading = heading.magneticHeading;						
	},
	function(error) {
		//alert('code: '    + error.code    + '\n' +'message: ' + error.message + '\n');
	}
    );
	
	//pouchdb setting
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
	function syncError() {
		//console.log('There was some form or error syncing!');
	}
	
	//Check whether it is the first time launch
	var isApplaunch = window.localStorage.getItem('isLaunch');
	if (isApplaunch){
		$("#start-page").hide();
		$("#main-page").show();
	}
    else {//first time launch
		$("#start-page").show();
		$("#main-page").hide();				
	}
	
	//registration		
	var gender="";
	$("#gender").bind( "change", function() {
		gender = $(this).val();			
	});
	var birthyear="";
	$("#birthyear").bind( "change", function() {
		birthyear = $(this).val();				
	});
	var workstatus="";
	$("#workstatus").bind( "change", function() {
		workstatus = $(this).val();				
	});
	$("#register").click(function(){		
		//register users		
		//check Internet connection
		if (networkState == Connection.NONE){
			if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
				alert("Registration fails due to no Internet connection!");
			}
			else{	
				navigator.notification.alert(i18n.t('messages.registration-noInternet'), null, "EmoMap", i18n.t('messages.ok') );
			}
			return;
		}
		
		//check inputs
		if((gender=="")||(birthyear=="")||(workstatus=="")){
			if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
				alert("Please complete the registration form!");
			}
			else{				
				navigator.notification.alert(i18n.t('messages.registration-form-empty'), null, "EmoMap", i18n.t('messages.ok') );
			}
			return;
		}
	
		var db_users = new PouchDB('http://emomap:Carto126.1040w,y@128.130.178.154:5984/emomap_user');
		var timestamp= new Date().toISOString();		
		db_users.get(uuid).then(function (doc) {
			//if existed, update the user
			doc.timestamp = timestamp;
			doc.gender = gender;
			doc.birthyear = birthyear;
			doc.workstatus = workstatus;
			db_users.put(doc);
		}).catch(function (err) {
			//if not existed, add the user
			var emo_user = {
				_id: uuid,
				timestamp: timestamp,
				gender: gender,
				birthyear: birthyear,
				workstatus: workstatus
			};
			db_users.put(emo_user, function callback(err, result) {
				if (!err) {
					//console.log('Successfully register a user!');
				}
			});			
		});		
		
		//set isLaunch as true
		window.localStorage.setItem('isLaunch',true);
		if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
			navigator.notification.alert("Thank you! Now you can start to contribute and create your emotional map!", alertDismissed_registrationSuccess, "EmoMap", "OK");
		}
		else{				
			navigator.notification.alert(i18n.t('messages.registration-success'), alertDismissed_registrationSuccess, "EmoMap", i18n.t('messages.ok'));
		}
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
	
    // resize map to cover whole screen
    var mapEl = $('#map');
    mapEl.height($(document).height() - mapEl.offset().top);
    var mapEl = $('.tabs');
    mapEl.height($(document).height() - mapEl.offset().top);
    
	var map = L.map('map', {
		center: curLatLng,
		zoom: 17
	});	
	if (networkState == Connection.NONE){	
		//L.tileLayer('como1/{z}/{x}/{y}.png', {
		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>, Tiles from <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img height="8" width="8" src="img/mq_logo.png">',
			minZoom:12,
			maxZoom:17
		}).addTo(map);		
	}
	else{
		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'			
		}).addTo(map);		
	}
		
	var MARKER_SIZE = 0.4;	
	function EmoIcon(emo) {
		function getEmoImage(emo) {
			if (emo == null || emo == undefined) {
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
	marker.on('dragend', function(event) {
		var latLng = event.target.getLatLng();  
		curLatLng = [latLng.lat, latLng.lng];
		//console.log(curLatLng);		
	});
	
	//add locate me control
	//here should update curLatLng
	L.control.locate({
		drawCircle: false,
		markerClass:L.circleMarker,
		markerStyle: {opacity:0, fill:false},
		showPopup: false,
		originalMarker: marker,
		onLocationError: function(err) {
			//alert(err.message)
		},  // define an error callback function, update the alert message.
		onLocationOutsideMapBounds:  function(context) { // called when outside map boundaries
		},
		locateOptions: {enableHighAccuracy: true, maximumAge: 3000,timeout:10000,watch:false}
	}).addTo(map);
	
	/*
	//add legend: for my map and all map only
	var legend = L.control({position: 'topright'});	
	legend.onAdd = function (map) {		
		var div = L.DomUtil.create('div', 'legend');
		var grades;
		if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
			grades = ["very uncomfortable", "uncomfortable", "slightly uncomfortable", "neutral", "slightly comfortable", "comfortable", "very comfortable"];
			div.innerHTML +='<img src="css/lib/images/emo4.png" alt="contribution" style="width:10px;height:10px;"/> individual contribution<br/>';
			div.innerHTML +='<img src="css/lib/images/circle.png" alt="cluster" style="width:10px;height:10px;"/>cluster and its size<br/><br/>';
		}
		else{			
			grades = [i18n.t('legend.emo1'),i18n.t('legend.emo2'),i18n.t('legend.emo3'),i18n.t('legend.emo4'),i18n.t('legend.emo5'),i18n.t('legend.emo6'),i18n.t('legend.emo7')];
			div.innerHTML +='<img src="css/lib/images/emo4.png" alt="contribution" style="width:10px;height:10px;"/> '+ i18n.t('legend.single')+ '<br/>';
			div.innerHTML +='<img src="css/lib/images/circle.png" alt="cluster" style="width:10px;height:10px;"/>'+ i18n.t('legend.single')+'<br/><br/>';
		}
		for (var i = grades.length-1; i >=0; i--) {
			div.innerHTML +=
			'<i style="background:' + getColor(i+1) + '"></i> ' +
			grades[i] + (i!=0 ? '<br>' : '');
		}		
		return div;
	};
	function getColor(d) {
		return d == 1  ? 'rgba(247, 49, 40, 0.8)' :
		d == 2  ? 'rgba(253, 119, 0, 0.8)' :
		d == 3  ? 'rgba(253, 223, 60, 0.8)' :
		d == 4  ? 'rgba(180, 180, 180, 0.8)' :
		d == 5  ? 'rgba(214, 239, 138, 0.8)' :
		d == 6  ? 'rgba(144, 209, 50, 0.8)' :
		'rgba(0, 154, 0, 0.8)';
	}	
	legend.addTo(map);
	*/
	//add legend: for my map and all map only
	var legend = L.control({position: 'topright'});	
	legend.onAdd = function (map) {		
		var div = L.DomUtil.create('div', 'legend');		
		return div;
	};	
	legend.addTo(map);
	
	
	$("#start-menu-contribute").click(function(){
		//enabling comfort slider to start contributing
		$("#start-menu,#checkbox-adj,#checkbox-conx,#mymap-stat,#allmap-stat,#info, .legend").hide();
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
			curLatLng = [position.coords.latitude, position.coords.longitude];
			curLatLngAccuracy = position.coords.accuracy;			
			map.panTo(curLatLng);
			marker.setLatLng (curLatLng);
			if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
				marker.bindPopup("Not your current location? Drag the marker to correct!").openPopup();
			}
			else{	
				marker.bindPopup(i18n.t('messages.marker-popup')).openPopup();
			}
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
		$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#allmap-stat,#info").hide();		
		$("#map,.legend").show();
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
			curLatLng = [position.coords.latitude, position.coords.longitude];
			map.panTo(curLatLng);
			marker.setLatLng (curLatLng);			
		},
		function(error) {
			if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
				navigator.notification.alert("Can not get your current location!", null, "EmoMap", "OK" );
			}
			else{	
				navigator.notification.alert(i18n.t('messages.geolocation-error'), null, "EmoMap", i18n.t('messages.ok') );
			}
		},
		{maximumAge: 3000, timeout: 30000, enableHighAccuracy: true }	
		);
		
		//read data from the local database
		db.allDocs({include_docs: true, descending: true}, function(err, doc) {
			//process all docs
			var locations=[];
			var emos=[];
			var ii=0;
			var emo_sum=0.0;
			doc.rows.forEach(function(todo) {
				locations.push(todo.doc.location);
				emo_sum = emo_sum + parseInt(todo.doc.comfort);
				emos.push(todo.doc.comfort);
				ii++;
			});
			markersMy = vizEmos(map, locations, emos);
			if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
				$("#mymap-stat").html ("In total, you have " + ii + " contribution(s), and the average emotional rating is " + (emo_sum*1.0/ii).toFixed(1) + " on a scale of 1 (very uncomfortable) to 7 (very comfortable).<br/><br/>");
			}
			else{	
				$("#mymap-stat").html (i18n.t('stat.total') + ii + i18n.t('stat.avg') + (emo_sum*1.0/ii).toFixed(1) + i18n.t('stat.scale')+"<br/><br/>");
			}
			addLegend(ln.language.code);
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
			if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
				navigator.notification.alert("The 'All Map' can not be shown due to no Internet Connection!", null, "EmoMap", "OK" );
			}
			else{	
				navigator.notification.alert(i18n.t('messages.allemomap-nointernet'), null, "EmoMap", i18n.t('messages.ok') );
			}
			//start the main page
			$("#start-menu").show();
			$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info,#mymap-stat, .legend").hide();
			$("#navbar-start").addClass("ui-btn-active");
			$("#navbar-my,#navbar-all,#navbar-about").removeClass("ui-btn-active");
			map._onResize();
			return;
		}	
		
		$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#mymap-stat,#info").hide();
		$("#map,.legend").show();		
		$("#navbar-start,#navbar-my,#navbar-about").removeClass("ui-btn-active");
		$("#navbar-all").addClass("ui-btn-active");	
		
		navigator.geolocation.getCurrentPosition(
		function(position) {
			curLatLng = [position.coords.latitude, position.coords.longitude];
			map.panTo(curLatLng);
			marker.setLatLng (curLatLng);
		},
		function(error) {
			if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
				navigator.notification.alert("Can not get your current location!", null, "EmoMap", "OK" );
			}
			else{	
				navigator.notification.alert(i18n.t('messages.geolocation-error'), null, "EmoMap", i18n.t('messages.ok') );
			}
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
			generateAllEmos (curLatLng, locations, emos, ln.language.code); //add stat.
			addLegend(ln.language.code);
		});
	}); 
	
	//information about emomap
	$("#start-menu-about,#navbar-about").click(function(){
		$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#mymap-stat,#allmap-stat,#map, .legend").hide();
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
		$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info,#mymap-stat,#allmap-stat, .legend").hide();
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
		$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info,#mymap-stat,#allmap-stat, .legend").hide();
		$("#navbar-start,#navbar-my,#navbar-all,#navbar-about").removeClass("ui-disabled");//enable all nav bars
		marker.setIcon(EmoIcon());
		marker.closePopup();
	});
	$("#comfort_next").click(function(){
		//go to adj page
		$("#start-menu,#slider-comfort,#checkbox-conx,#info,#mymap-stat,#allmap-stat, .legend").hide();
		$("#checkbox-adj").show();
		
		if(adj=="")
		$("#adj_next").addClass("ui-disabled");//disable "next"
	});
	
	$("#adj_back").click(function(){
		//go back to slider page
		$("#start-menu,#checkbox-adj,#checkbox-conx,#info,#mymap-stat,#allmap-stat, .legend").hide();
		$("#slider-comfort").show();			
		$("#comfort_next").removeClass("ui-disabled");//enable "next"
	});	
	$("#adj_next").click(function(){
		//go to conx page		
		$("#start-menu,#slider-comfort,#checkbox-adj,#info,#mymap-stat,#allmap-stat, .legend").hide();
		$("#checkbox-conx").show();
	});
	
	$("#conx_back").click(function(){
		//go back to slider page
		$("#start-menu,#slider-comfort,#checkbox-conx,#info,#mymap-stat,#allmap-stat, .legend").hide();
		$("#checkbox-adj").show();
		$("#adj_next").removeClass("ui-disabled");//enable "next"
	});	
	$("#conx_next").click(function(){
		//submit to pouchdb and couchd, add result to map, set all variables to initial values
		$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#info,#mymap-stat,#allmap-stat, .legend").hide();
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
		
		if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
			navigator.notification.alert("Thank you very much for your contribution!", alertDismissed_contributionSuccess, "EmoMap", "OK" );
		}
		else{	
			navigator.notification.alert(i18n.t('messages.contribution-success'), alertDismissed_contributionSuccess, "EmoMap", i18n.t('messages.ok'));
		}
		function alertDismissed_contributionSuccess() {
			$("#start-menu").show();
			$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info,#mymap-stat,#allmap-stat, .legend").hide();	
			$("#navbar-start").addClass("ui-btn-active");
			marker.setIcon(EmoIcon());
			marker.closePopup();
			map._onResize();
		}				
	});
		
	//get level of comfort
	$("#slider1").bind("slidestop", function () {  			
		level_of_comfort = $("#slider1").val();
		marker.setIcon(EmoIcon(level_of_comfort-4));
		$("#comfort_next").removeClass("ui-disabled");//enable "next"
	});
	
	//get adjectives
	$("#adj").bind( "change", function() {
		adj = $(this).val();
		if((adj==null)||(adj==""))
		$("#adj_next").addClass("ui-disabled");//disable "next"
		else
		$("#adj_next").removeClass("ui-disabled");//enable "next"		
	});
	
	//get context (with whom)
	$(".xcheckbox-with").bind( "change", function() {
		var click_alone=$(this).val().search("alone");
		if(click_alone!=-1){
			$("#checkbox-h-2a").attr("checked",true).checkboxradio("refresh");
			$("#checkbox-h-2b,#checkbox-h-2c,#checkbox-h-2d").attr("checked",false).checkboxradio("refresh");
		}
		else{			
			$("#checkbox-h-2a").attr("checked",false).checkboxradio("refresh",true);
		}		
		conx_with= $(".xcheckbox-with:checked").map(function () {return this.value;}).get().join(",");
	});
	//get context (first time)
	$("input[type='radio']").bind( "change", function() {
		conx_first=$(this).val();
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
		marker_emo.bindPopup("Level of comfort: " + emos[i].toString());
		marker_emo.mydata=parseInt(emos[i]);
		markers.addLayer(marker_emo);
	}
	map.addLayer(markers);
	return markers;
}

//generating all emomap stat. : for all emomap
function generateAllEmos (curLoc, locations, emos, lang){
	
	var total_emo=0, total_num=0;	
	var latlng_current = L.latLng(curLoc[0], curLoc[1]);
	for (var i = 0; i < emos.length; i++) {
		var dist=latlng_current.distanceTo (L.latLng(locations[i][0], locations[i][1]))
		if(dist<=5000){
			total_emo += parseInt(emos[i]);
			total_num++;
		}	
	}
	if (total_num!=0){
		if(!((lang=="zh")||(lang=="de")||(lang=="it"))){
			$("#allmap-stat").html ("In total, there are " + total_num + " contribution(s) within 5km of your current location, and the average emotional rating is " + (total_emo*1.0/total_num).toFixed(1) + " on a scale of 1 (very uncomfortable) to 7 (very comfortable)." + "<br/><br/>");
		}
		else{	
			$("#allmap-stat").html (i18n.t('stat.total_all') + total_num + i18n.t('stat.avg_all') + (total_emo*1.0/total_num).toFixed(1) + i18n.t('stat.scale') + "<br/><br/>");
		}
	}
	else{
		if(!((lang=="zh")||(lang=="de")||(lang=="it"))){
			$("#allmap-stat").html ("No body has added an emotional rating within 5km of your current location.");
		}
		else{	
			$("#allmap-stat").html (i18n.t('stat.total_all') +"<br/><br/>");
		}
	}		
	$("#allmap-stat").show();
}

//add legend: for my map and all map
function addLegend (lang){
		var grades, innerhtml="";
		if(!((lang=="zh")||(lang=="de")||(lang=="it"))){
			grades = ["very uncomfortable", "uncomfortable", "slightly uncomfortable", "neutral", "slightly comfortable", "comfortable", "very comfortable"];
			innerhtml +='<img src="css/lib/images/emo4.png" alt="contribution" style="width:10px;height:10px;"/> individual contribution<br/>';
			innerhtml +='<img src="css/lib/images/circle.png" alt="cluster" style="width:10px;height:10px;"/>cluster and its size<br/><br/>';
		}
		else{			
			grades = [i18n.t('legend.emo1'),i18n.t('legend.emo2'),i18n.t('legend.emo3'),i18n.t('legend.emo4'),i18n.t('legend.emo5'),i18n.t('legend.emo6'),i18n.t('legend.emo7')];
			innerhtml +='<img src="css/lib/images/emo4.png" alt="contribution" style="width:10px;height:10px;"/> '+ i18n.t('legend.single')+ '<br/>';
			innerhtml +='<img src="css/lib/images/circle.png" alt="cluster" style="width:10px;height:10px;"/>'+ i18n.t('legend.cluster')+'<br/><br/>';
		}
		for (var i = grades.length-1; i >=0; i--) {
			innerhtml +=
			'<i style="background:' + getColor(i+1) + '"></i> ' +
			grades[i] + (i!=0 ? '<br>' : '');
		}	
		$(".legend").html(innerhtml);
}
function getColor(d) {
		return d == 1  ? 'rgba(247, 49, 40, 0.8)' :
		d == 2  ? 'rgba(253, 119, 0, 0.8)' :
		d == 3  ? 'rgba(253, 223, 60, 0.8)' :
		d == 4  ? 'rgba(180, 180, 180, 0.8)' :
		d == 5  ? 'rgba(214, 239, 138, 0.8)' :
		d == 6  ? 'rgba(144, 209, 50, 0.8)' :
		'rgba(0, 154, 0, 0.8)';
}	



document.addEventListener('deviceready', initialize);

//																			
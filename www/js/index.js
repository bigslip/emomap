function initialize() {   
	
	ln.init();//set page language according to the device language
	
	//initial values
	var curLatLng = [45.810991, 9.081521],
	curLatLngAccuracy = 0,
	level_of_comfort = 4,
	adj = "",
	conx_with = "alone",
	conx_first = "first_time",
	isContributing = false, //is it in contributing mode?
	marker;
	
	var watchId = null;
	var watchCallback_Popup = true; //true means the first time of receiving the watchPosition result
	
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
	
	//need to check GPS is enabled or not
	navigator.geolocation.getCurrentPosition(	
	function(position) {
		curLatLng = [position.coords.latitude, position.coords.longitude];
		curLatLngAccuracy = position.coords.accuracy;
		map.panTo(curLatLng);
		marker.setLatLng (curLatLng);	
		if (!isContributing){
			var messages_warninglocation="Note: this may not be your current location!";
			if((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))
				messages_warninglocation = i18n.t('messages.warning-location');
			if(marker.getPopup()!=null)
				marker.setPopupContent(messages_warninglocation).closePopup();
			else
				marker.bindPopup(messages_warninglocation).closePopup();
		}
	},
	function(error) {
		if (!isContributing){
			if(marker.getPopup()!=null)
				marker.setPopupContent("Note that this may not be your current location!").closePopup();
			else
				marker.bindPopup("Note that this may not be your current location!").closePopup();
		}
	},
	{maximumAge: 3000, timeout: 30000, enableHighAccuracy: true }	
	);
		
	//pouchdb setting
	var markersMy, markersAll;	
	var db = new PouchDB('emomap_local',{auto_compaction:true});
	var remoteAllCouch = 'http://128.130.178.158:80/emomap_alltry';
	db.changes({
		since: 'now',
		live: true
		}).on('change', function(change) {
		// handle change
	});
	
	if (remoteAllCouch) {
		var opts = {live: true};
		db.replicate.to(remoteAllCouch, opts, syncError);
	}
	function syncError() {
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
	
		var db_users = new PouchDB('http://128.130.178.158:80/emomap_usertry');
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
	
	var tilelayer;
	
	if (networkState == Connection.NONE){	
		tilelayer = L.tileLayer('como_tiles/{z}/{x}/{y}.png', {
			attribution: '&copy;OpenStreetMap, Tiles: MapQuest<img height="8" width="8" src="img/mq_logo.png">',
			//minZoom:12,
			maxZoom:17,
			errorTileUrl:'como_tiles/error-tile.png'
		});
		tilelayer.addTo(map);		
	}
	else{
		tilelayer = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
			attribution: '&copy;OpenStreetMap, Tiles: MapQuest<img height="8" width="8" src="img/mq_logo.png">',
			//minZoom:12,
			maxZoom:17, 
			subdomains:'1234',
			errorTileUrl:'como_tiles/error-tile.png'
		});
		tilelayer.addTo(map);		
	}
	
	//add offline/online events
	document.addEventListener("offline", onOffline, false);
	function onOffline() {
		// Handle the offline event， change to offline map
		networkState = navigator.connection.type;
		map.removeLayer(tilelayer);
		tilelayer=L.tileLayer('como_tiles/{z}/{x}/{y}.png', {
			attribution: '&copy;OpenStreetMap, Tiles: MapQuest<img height="8" width="8" src="img/mq_logo.png">',
			//minZoom:12,
			maxZoom:17,
			errorTileUrl:'como_tiles/error-tile.png'
		});
		tilelayer.addTo(map);
	}
	document.addEventListener("online", onOnline, false);
	function onOnline() {
		// Handle the online event, change to online map
		networkState = navigator.connection.type;
		map.removeLayer(tilelayer);
		tilelayer=L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
			attribution: '&copy;OpenStreetMap, Tiles: MapQuest<img height="8" width="8" src="img/mq_logo.png">',
			//minZoom:12,
			maxZoom:17, 
			subdomains:'1234',
			errorTileUrl:'como_tiles/error-tile.png'
		});
		tilelayer.addTo(map);
		
		if (remoteAllCouch) {
			var opts = {live: true};
			db.replicate.to(remoteAllCouch, opts, syncError);
		}
		function syncError() {
		}
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
	marker.dragging.disable();
	marker.on('dragend', function(event) {
		var latLng = event.target.getLatLng();  
		curLatLng = [latLng.lat, latLng.lng];
		curLatLngAccuracy = 0; //0 (very accuate) if set by users
		if(watchId!=null){
			navigator.geolocation.clearWatch(watchId);
			watchId = null;
		}
	});
		
	//add legend: for my map and all map only
	var legend = L.control({position: 'topright'});	
	legend.onAdd = function (map) {		
		var div = L.DomUtil.create('div', 'legend');		
		return div;
	};	
	legend.addTo(map);
	
	$("#start-menu-contribute").click(function(){
		isContributing = true;		
		watchCallback_Popup = true;
		map.hasLayer(markersAll) && map.removeLayer(markersAll);
		map.hasLayer(markersMy) && map.removeLayer(markersMy);
		map.hasLayer(marker) || map.addLayer(marker);
		var messages="Getting your current location ...";
		if((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))
			messages = i18n.t('messages.getting-location');	
		if(marker.getPopup()!=null)
			marker.setPopupContent(messages).openPopup();
		else
			marker.bindPopup(messages).openPopup();

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
		
		watchId = navigator.geolocation.watchPosition(
		function(position) {
			curLatLng = [position.coords.latitude, position.coords.longitude];
			curLatLngAccuracy = position.coords.accuracy;			
			map.panTo(curLatLng);
			marker.setLatLng (curLatLng);
			if (watchCallback_Popup){			
				if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
					marker.setPopupContent("Not your current location? Drag the marker to correct!").openPopup();
				}
				else{	
					marker.setPopupContent(i18n.t('messages.marker-popup')).openPopup();
				}	
			}
			watchCallback_Popup = false;
			marker.dragging.enable();
		},
		function(error) {
			var messages_gpserror="GPS error! Please drag the marker to set your current location!";
			if((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))
				messages_gpserror = i18n.t('messages.gps-error');	
			marker.setPopupContent(messages_gpserror).openPopup();
			marker.dragging.enable();
			watchCallback_Popup = true;
		},
		{maximumAge: 3000, timeout: 15000, enableHighAccuracy: true }	
		);
		
		//set all initial values		
		level_of_comfort=4;
		adj="";
		conx_with="alone";
		conx_first="first_time";		
	});

	$("#navbar-start").click(function(){
		//start the main page
		$("#start-menu, #map").show();
		$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info,#mymap-stat,#allmap-stat, .legend").hide();
		$("#navbar-start").addClass("ui-btn-active");
		$("#navbar-my,#navbar-all,#navbar-about").removeClass("ui-btn-active");
		
		//clean map view
		map.hasLayer(markersAll) && map.removeLayer(markersAll);
		map.hasLayer(markersMy) && map.removeLayer(markersMy);
		map.hasLayer(marker) || map.addLayer(marker);
		marker.closePopup();
	});	
	
	
	//show the user' contributions
	$("#start-menu-my, #navbar-my").click(function(){		
		$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#allmap-stat,#info, #mymap-stat,.legend").hide();		
		$("#map").show();
		$("#navbar-start,#navbar-all,#navbar-about").removeClass("ui-btn-active");
		$("#navbar-my").addClass("ui-btn-active");			
		
		//clean map view
		map.hasLayer(markersAll) && map.removeLayer(markersAll);
		map.hasLayer(markersMy) && map.removeLayer(markersMy);
		map.hasLayer(marker) && map.removeLayer(marker);
        
		//marker.setIcon(EmoIcon());
		//marker.closePopup();
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
			if(err){ 
				return;
			}
			//process all docs
			var locations=[];
			var emos=[];
			var ii=0;
			var emo_sum=0.0;
			doc.rows.forEach(function(todo) {
				if(todo.doc.location!=null&&todo.doc.comfort!=null){
					locations.push(todo.doc.location);
					emo_sum = emo_sum + parseInt(todo.doc.comfort);
					emos.push(todo.doc.comfort);
					ii++;
				}				
			});
			markersMy = vizEmos(map, locations, emos, ln.language.code);
			if (ii!=0){
				if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
					$("#mymap-stat").html ("In total, you have " + ii + " contribution(s), and the average emotional rating is " + (emo_sum*1.0/ii).toFixed(1) + " on a scale of 1 (very uncomfortable) to 7 (very comfortable).<br/><br/>");
				}
				else{	
					$("#mymap-stat").html (i18n.t('stat.total') + ii + i18n.t('stat.avg') + (emo_sum*1.0/ii).toFixed(1) + i18n.t('stat.scale')+"<br/><br/>");
				}
			}
			else{
				if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
					$("#mymap-stat").html ("You have not had any contribution yet!<br/><br/>");
				}
				else{	
					$("#mymap-stat").html (i18n.t('stat.nopoint-my') +"<br/><br/>");
				}	
			}
				
			addLegend(ln.language.code);
			$("#mymap-stat,.legend").show();
		});
		
	}); 
	
	//show all contributions
	$("#start-menu-all, #navbar-all").click(function(){
		//clean map view
		map.hasLayer(markersAll) && map.removeLayer(markersAll);
		map.hasLayer(markersMy) && map.removeLayer(markersMy);
		map.hasLayer(marker) && map.removeLayer(marker);

		//marker.setIcon(EmoIcon());
		//marker.closePopup();
		
		if (networkState == Connection.NONE){
			if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
				navigator.notification.alert("The map displaying all people's contributions can not be shown due to no Internet Connection!", null, "EmoMap", "OK" );
			}
			else{	
				navigator.notification.alert(i18n.t('messages.allemomap-nointernet'), null, "EmoMap", i18n.t('messages.ok') );
			}
			//start the main page
			$("#start-menu").show();
			$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info,#mymap-stat, #allmap-stat, .legend").hide();
			$("#navbar-start").addClass("ui-btn-active");
			$("#navbar-my,#navbar-all,#navbar-about").removeClass("ui-btn-active");
			map.hasLayer(marker) || map.addLayer(marker);
			map._onResize();
			return;
		}	
		
		$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#mymap-stat,#info,.legend, #allmap-stat").hide();
		$("#map").show();		
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
			if(err){
				if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
					navigator.notification.alert("The map displaying all people's contributions can not be shown due to no Internet Connection!", null, "EmoMap", "OK" );
				}
				else{	
					navigator.notification.alert(i18n.t('messages.allemomap-nointernet'), null, "EmoMap", i18n.t('messages.ok') );
				}
				//start the main page
				$("#start-menu").show();
				$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info,#mymap-stat, #allmap-stat, .legend").hide();
				$("#navbar-start").addClass("ui-btn-active");
				$("#navbar-my,#navbar-all,#navbar-about").removeClass("ui-btn-active");
				map.hasLayer(marker) || map.addLayer(marker);
				map._onResize();
				return;
			}
			
			//process all layers
			var locations=[];
			var emos=[];
			doc.rows.forEach(function(todo) {
				if(todo.doc.location!=null&&todo.doc.comfort!=null){
					locations.push(todo.doc.location);
					emos.push(todo.doc.comfort);
				}
			});	
			markersAll = vizEmos(map, locations, emos, ln.language.code);
			generateAllEmos (curLatLng, locations, emos, ln.language.code); //add stat.
			addLegend(ln.language.code);
			$(".legend, #allmap-stat").show();
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
	
	$("#comfort_cancel").click(function(){
		//go back to start page
		$("#start-menu").show();
		$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info,#mymap-stat,#allmap-stat, .legend").hide();
		$("#navbar-start,#navbar-my,#navbar-all,#navbar-about").removeClass("ui-disabled");//enable all nav bars
		marker.setIcon(EmoIcon());
		var messages_warninglocation="Note: this may not be your current location!";
		if((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))
			messages_warninglocation = i18n.t('messages.warning-location');
		marker.setPopupContent(messages_warninglocation).closePopup();
		marker.dragging.disable();
		isContributing = false; //not in contributing mode
		if(watchId!=null){
			navigator.geolocation.clearWatch(watchId);
			watchId = null;
		}
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
		//here get LatLng of the marker
		//curLatLng=[marker.getLatLng().lat, marker.getLatLng().lng];
		var emo = {
			_id: timestamp,
			user: uuid,
			location: curLatLng,
			location_accuracy: curLatLngAccuracy,
			lang: ln.language.code,
			timestamp: timestamp,
			comfort: level_of_comfort,
			adjective: adj,
			conx_with: conx_with,
			conx_first: conx_first
		};
		db.put(emo, function callback(err, result) {
			if (!err) {
				//console.log('Successfully posted a todo!');
			}
		});
		
		if(watchId!=null){
			navigator.geolocation.clearWatch(watchId);
			watchId = null;
		}		

		
		if(!((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))){
			if (networkState == Connection.NONE)
				navigator.notification.alert("Thank you for the contribution. Note that you are currently offline, please re-open the app once you have Internet connection to share your contributions.", alertDismissed_contributionSuccess, "EmoMap", "OK" );
			else
				navigator.notification.alert("Thank you very much for your contribution!", alertDismissed_contributionSuccess, "EmoMap", "OK" );
		}
		else{
			if (networkState == Connection.NONE)
				navigator.notification.alert(i18n.t('messages.contribution-success-noInternet'), alertDismissed_contributionSuccess, "EmoMap", i18n.t('messages.ok'));
			else
				navigator.notification.alert(i18n.t('messages.contribution-success'), alertDismissed_contributionSuccess, "EmoMap", i18n.t('messages.ok'));
		}
		function alertDismissed_contributionSuccess() {
			$("#start-menu").show();
			$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info,#mymap-stat,#allmap-stat, .legend").hide();	
			$("#navbar-start").addClass("ui-btn-active");
			marker.setIcon(EmoIcon());
			var messages_warninglocation="Note: this may not be your current location!";
			if((ln.language.code=="zh")||(ln.language.code=="de")||(ln.language.code=="it"))
				messages_warninglocation = i18n.t('messages.warning-location');
			marker.setPopupContent(messages_warninglocation).closePopup();
			isContributing = false; //not in contributing mode
			marker.dragging.disable();
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
function vizEmos (map, locations, emos, lang){
	var markers = L.markerClusterGroup();	
	var grades;
	if(!((lang=="zh")||(lang=="de")||(lang=="it"))){
		grades= ["very uncomfortable", "uncomfortable", "slightly uncomfortable", "neutral", "slightly comfortable", "comfortable", "very comfortable"];
	}
	else{
		grades = [i18n.t('legend.emo1'),i18n.t('legend.emo2'),i18n.t('legend.emo3'),i18n.t('legend.emo4'),i18n.t('legend.emo5'),i18n.t('legend.emo6'),i18n.t('legend.emo7')];
	}
	for (var i = 0; i < emos.length; i++) {
		var locationIcon = L.icon({
			iconUrl: 'css/lib/images/emo24_'+emos[i].toString()+'.png',
			iconSize: [20,20],
			iconAnchor: [9,20],
			popupAnchor: [0,-20]
		});
		
		var marker_emo = L.marker(locations[i], { icon: locationIcon});
		marker_emo.bindPopup(grades[emos[i]-1]);
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
			$("#allmap-stat").html ("In total, there are " + total_num + " contribution(s) within 5 km of your current location, and the average emotional rating is " + (total_emo*1.0/total_num).toFixed(1) + " on a scale of 1 (very uncomfortable) to 7 (very comfortable)." + "<br/><br/>");
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
			$("#allmap-stat").html (i18n.t('stat.nopoint') +"<br/><br/>");
		}
	}		
	$("#allmap-stat").show();
}

//add legend: for my map and all map
function addLegend (lang){	
		var grades, innerhtml="";
		if(!((lang=="zh")||(lang=="de")||(lang=="it"))){
			grades = ["very uncomfortable", "uncomfortable", "slightly uncomfortable", "neutral", "slightly comfortable", "comfortable", "very comfortable"];
			innerhtml +='<img src="css/lib/images/emo24_4.png" class="legend-images" alt="contribution" style="width:10px;height:10px;"/> individual contribution<br/>';
			innerhtml +='<img src="css/lib/images/circle.png" class="legend-images" alt="cluster" style="width:10px;height:10px;"/>cluster and its size<br/><br/>';
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
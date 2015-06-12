function initialize() {    
	//initial values
	var curLatLng = [48.209219,16.370821];
	var level_of_comfort=4;
	var adj="";
	var conx_with="alone";
	var conx_first="first_time";
	var marker;
	
	var db = new PouchDB('emomap11',{auto_compaction:true});
	var remoteUserCouch = 'http://emomap:Carto126.1040w,y@128.130.178.154:5984/todos';
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
	L.tileLayer('../../tiles_vienna/{z}/{x}/{y}.png', {
        //attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
	
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
		
		marker.getPopup().setContent("Drag the marker to correct location!");
		
		//set all initial values		
		level_of_comfort=4;
		adj="";
		conx_with="alone";
		conx_first="first_time";
		
	});
	
	//show the user' contributions
	$("#start-menu-my, #navbar-my").click(function(){
		$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();
		$("#navbar-start,#navbar-all,#navbar-about").removeClass("ui-btn-active");
		$("#navbar-my").addClass("ui-btn-active");		
		//read data from the local database
		db.allDocs({include_docs: true, descending: true}, function(err, doc) {
			//process all layers
			var locations=[];
			var emos=[];
			doc.rows.forEach(function(todo) {
				locations.push(todo.doc.location);
				emos.push(todo.doc.comfort);
				vizEmos(map, locations, emos);
			});
			
		});
	}); 
	$("#start-menu-all, #navbar-all").click(allEmoMap); //show all contributions
	$("#start-menu-about,#navbar-about").click(Info);//information about emomap
	
	$("#navbar-start").click(function(){
		//start the main page
		$("#start-menu").show();
		$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();
		$("#navbar-start").addClass("ui-btn-active");
		$("#navbar-my,#navbar-all,#navbar-about").removeClass("ui-btn-active");
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
		
		var timestamp= new Date().toISOString();
		var emo = {
			_id: timestamp,
			location: curLatLng,
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
		marker.getPopup().setContent("<b>Thank you for your contribution!</b>");
		
		$("#start-menu").show();
		$("#slider-comfort,#checkbox-adj,#checkbox-conx,#info").hide();	
		
	});
	
	//get current location, we need to use Geolocation
	
	var locationIcon = L.icon({
		iconUrl: 'css/lib/images/marker-icon-1.5x.png'		
	});
	marker = L.marker(curLatLng, {icon: locationIcon, draggable: true}).addTo(map);
	/*
		var popup = L.popup().setContent('Drag me to correct location');
		marker.bindPopup(popup).openPopup();
	*/
	marker.bindPopup("Drag the marker to correct location!").openPopup();
	
	marker.on('dragend', function(event) {
		var latLng = event.target.getLatLng();  
		curLatLng = [latLng.lat, latLng.lng];
		console.log(curLatLng);		
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
	$("#start-menu,#slider-comfort,#checkbox-adj,#checkbox-conx").hide();
	$("#info").show();
	$("#navbar-start,#navbar-my,#navbar-all").removeClass("ui-btn-active");
	$("#navbar-about").addClass("ui-btn-active");
}

//visualizing emos using marker cluster
function vizEmos (map, locations, emos){
	var markers = L.markerClusterGroup();
	for (var i = 0; i < emos.length; i++) {
		var locationIcon = L.icon({
			iconUrl: 'css/lib/images/emo'+emos[i].toString()+'.png'		
		});
		
		var marker_emo = L.marker(locations[i], { icon: locationIcon});
		marker_emo.mydata=emos[i];
		markers.addLayer(marker_emo);
	}
	map.addLayer(markers);
}


document.addEventListener('deviceready', initialize);

//
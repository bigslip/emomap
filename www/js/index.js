function initialize() {
    var map = L.map('map').setView([48.209219, 16.370821], 16);
    L.tileLayer('../../MapQuest_Vienna/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
	
	var circle = L.circle([45.814910, 9.083399], 20, {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5
	}).addTo(map);
	
}

document.addEventListener('deviceready', initialize);

//
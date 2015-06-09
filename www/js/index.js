function initialize() {
    var map = L.map('map').setView([48.21,16.37], 13);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

document.addEventListener('deviceready', initialize);
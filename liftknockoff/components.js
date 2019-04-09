var myUsername = "YcpHRqGU";
var seeking = "";
var myLat = 0;
var myLng = 0;
var myLocation = new google.maps.LatLng(myLat, myLng);
var myOptions = {
	zoom: 7, // The larger the zoom number, the bigger the zoom
	center: myLocation,
	mapTypeId: google.maps.MapTypeId.ROADMAP
};
var map;
var marker;
var JSONObject; 
var JSONByUsername = {};
var infowindow = new google.maps.InfoWindow();
var weinermobile_exists = false;

var icons = {
  vehicles: {
    icon: 'car.png'
  },
  passengers: {
    icon: 'passenger.png'
  },
  weinermobile: {
  	icon: 'weinermobile.png'
  }

};

/* Function: getJSON
 * Purpose: request JSON data from server
 * Input: none
 * return none
 *
 */
function getJSON() {
	var http = new XMLHttpRequest();
	var url = 'https://blooming-caverns-74609.herokuapp.com/rides';
	var params = 'username='+myUsername+'&lat='+myLat+'&lng='+myLng;
	http.open('POST', url, true);

	//Send the proper header information along with the request
	http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	http.send(params);
	http.onload = function() {
		JSONObject = JSON.parse(http.responseText);
		console.log("JSON:", JSONObject);
	}

}

/* Function: getMyLocation
 * Purpose: Generate my current lat and lng pos
 * Input: none
 * return none
 *
 */
function getMyLocation() {
	if (navigator.geolocation) { // the navigator.geolocation object is supported on your browser
		navigator.geolocation.getCurrentPosition(function(position) {
			myLat = position.coords.latitude;
			myLng = position.coords.longitude;
			renderMap();
		});
	}
	else {
		console.log("Geolocation is not supported by your web browser.  What a shame!");
	}
}

/* Function: getDistanceInMiles
 * Purpose: convert distacne between two points 
 			from meters to miles
 * Input: point_a, point_b
 * return number type
 *
 */
function getDistanceInMiles( point_a, point_b ) {
	var distance_in_meters = google.maps.geometry.spherical.computeDistanceBetween( point_a, point_b );

	return distance_in_meters * 0.000621371; // convert meters to miles
}

/* Function: getNearest
 * Purpose: get nearest vehicle/or passenger from
 			my current position on the map.
 * Input: none
 * return number type
 *
 */
function getNearest(){
	var closest;
	for(var key in JSONByUsername) {
	    if(JSONByUsername.hasOwnProperty(key)) {
	        var firstObj = JSONByUsername[key];
	        var location = new google.maps.LatLng(firstObj["lat"], firstObj["lng"]);
	        var myLocation = new google.maps.LatLng( myLat, myLng );
	        closest = getDistanceInMiles(location, myLocation);
	        console.log("closest temp:", closest);
	        break;
	    }
	}

	for(var key in JSONByUsername) {
	    if(JSONByUsername.hasOwnProperty(key)) {
	        var obj = JSONByUsername[key];
	        var location = new google.maps.LatLng(obj["lat"], obj["lng"]);
	        var distance = getDistanceInMiles(location, myLocation);
	        if(distance < closest)
	        	closest = distance;
	    }
	}
	return closest;
}

/* Function: setMarker
 * Purpose: Set a unique object marker on the map
 			given a new marker object and other details
 * Input: x, y, type, username
 * return none
 *
 */
function setMarker(x, y, type, username){
	var location = new google.maps.LatLng(x, y);
	var marker;
	var myLocation = new google.maps.LatLng( myLat, myLng );

	marker = getMarker(type, location, username);
	map.panTo(location);
	marker.setMap(map);

	var username = marker.title;
	var distance = getDistanceInMiles(location, myLocation);
	var nearest = 0;
	var d_from_weinermobile;

	// Open info window on click of marker
	google.maps.event.addListener(marker, 'click', function() {
		if(marker.title == myUsername){
			nearest = getNearest();
			if(weinermobile_exists){
				var WEINERMOBILE = JSONByUsername["WEINERMOBILE"];
				var weinerLocation = new google.maps.LatLng(WEINERMOBILE["lat"], WEINERMOBILE["lng"]);
				d_from_weinermobile = getDistanceInMiles(weinerLocation, myLocation);
			}
			
			infowindow.setContent(
				"<p>" + username + "</p>" + 
				"<p> Nearest " + seeking + ": " + nearest + " miles<p>" +
				"<p> Weinermobile exists: " + weinermobile_exists + "</p>" +
				"<p> Distance from Weinermobile: " + d_from_weinermobile + " miles<p>"
			);
		}else{
			infowindow.setContent(
				"<p>" + username + "</p>" + 
				"<p> Distance: " + distance + " miles</p>"
			);
		}
		
		infowindow.open(map, marker);
	});

}

/* Function: getMarker
 * Purpose: Create new marker object
 * Input: type, location, username
 * return marker
 *
 */
function getMarker(type, location, username){
	var marker
	if(type == 'passengers'){
		marker = new google.maps.Marker({
			position: location,
			title: username,
			icon: icons['passengers'].icon,
		});
	}else if(type == 'vehicles'){
		marker = new google.maps.Marker({
			position: location,
			title: username,
			icon: icons['vehicles'].icon,
		});
	}else if(type == 'weinermobile'){
		marker = new google.maps.Marker({
			position: location,
			title: username,
			icon: icons['weinermobile'].icon,
		});
	}
	return marker;

}

/* Function: renderMap
 * Purpose: Populate map with all vehicle/passenger 
 			objects from JSON data
 * Input: none
 * return none
 *
 */
function renderMap() {
	var category; 		
	
	if(JSONObject != null){
	//set vehicle markers
		console.log("JSON", JSONObject);
		for(var type in JSONObject){
			var infoObj = JSONObject[type];
			if(type == "vehicles"){
				seeking = "vehicle";
				category = "passengers";
			}else{
				seeking = "passenger";
				category = "vehicles";
			}
			for(var info in infoObj){
				var obj = infoObj[info];
				JSONByUsername[obj['username']] = obj;
				if(obj['username'] == "WEINERMOBILE"){
					weinermobile_exists = true;
					setMarker(obj['lat'], obj['lng'], "weinermobile", obj['username']);
				}else{
					setMarker(obj['lat'], obj['lng'], type, obj['username']);
				}
				
			}
		}
		//set my marker
		setMarker(myLat, myLng, category, myUsername);
	}
}
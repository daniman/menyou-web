/**
 * Event handlers for the map.
 *
 * Author: daniman
 */

(function() {

  Menyou.Map = {};

  // Icons for the map.
  var USER_POSITION = "http://maps.google.com/mapfiles/kml/pal2/icon10.png";
  var RESTAURANT_POSITION = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|5D8A31";
  var LOCATE_ME_BUTTTON = "http://cdn.androidpolice.com/wp-content/uploads/2012/09/nexusae0_btn_myl_normal.png";
  
  var markers;
  var mapOptions;
  var map;
  var searchRadiusCircle;

  // String list of Restaurant titles - so Restaurants aren't marked twice.
  var markedRestaurants = [];

  /**
   * Mark Resaurants based on the current Recommended Dishes displayed to the User.
   */
  Menyou.Map.mark_restaurants = function() {
    markers = []; markedRestaurants = [];
    var bounds = new google.maps.LatLngBounds();

    var dishes = Menyou.state.dishes;
    for (var i=0; i<dishes.length; i++) {
      var dish = dishes[i]

      if (markedRestaurants.indexOf(dish.restaurant.name) == -1) {

        var latlng = new google.maps.LatLng(dish.restaurant.lat,dish.restaurant.lon)
        bounds.extend(latlng)

        var infowindow = new google.maps.InfoWindow({});

        //create marker
        var marker = new google.maps.Marker({
          icon: RESTAURANT_POSITION,
          position: latlng,
          map: map,
          title: dish.restaurant.name,
          address: dish.restaurant.address,
          dishes: [dish.name]
        });

        /**
        * Marker click listener
        **/
        google.maps.event.addListener(marker, 'click', function() {
          $('.meal').each(function(index) { $(this).removeClass('selected'); })

          var looking_for = this.title;

          $('.meal').each(function(index) {
            var restaurant = $(this).find('.restaurant').html();
            if (looking_for == restaurant) {
              $(this).addClass('selected');
            }
          })

          var info_html = Menyou.templates["infowindow"]({
            "title": this.title,
            "address": this.address,
            "dishes": this.dishes
          });
          infowindow.setContent(info_html);
          infowindow.open(map,this);
        });

        markers.push(marker);
        markedRestaurants.push(dish.restaurant.name);

      } else {
        var marker = markers[markedRestaurants.indexOf(dish.restaurant.name)]
        marker.dishes.push(dish.name)
      }

    }

    /**
    * Meal widget click listener
    **/
    $(document).on("click", ".meal", function() {
      var restaurant = $(this).find('.restaurant').html();
      var index = markedRestaurants.indexOf(restaurant);
      google.maps.event.trigger(markers[index], 'click');
    });

  }

  /**
   * Initialize Map
   */

  Menyou.Map.initialize = function() {

    // Make the radius buttons visible.
    $(".radius-input").iCheck({
      checkboxClass: 'icheckbox_square-green',
      radioClass: 'iradio_square-green',
      ifChecked: function() {
        console.log("Here");
      }
    });

    var METERS_IN_MILE = 1609;
    $('#one-mile').on("ifChecked", function() {
      Menyou.state.location.radius = METERS_IN_MILE;
      $("#recommend-btn").show();
    });
    $('#three-mile').on("ifChecked", function() {
      Menyou.state.location.radius = 3 * METERS_IN_MILE;
      $("#recommend-btn").show();
    });
    $('#five-mile').on("ifChecked", function() {
      Menyou.state.location.radius = 5 * METERS_IN_MILE;
      $("#recommend-btn").show();
    });
    $('#ten-mile').on("ifChecked", function() {
      Menyou.state.location.radius = 10 * METERS_IN_MILE;
      $("#recommend-btn").show();
    });

    //reset list of markers
    markers = [];

    //current position as stored in the Menyou state
    var current_position = {
      lat: Menyou.state.location.lat,
      lng: Menyou.state.location.lon
    }

    var radius_miles = Menyou.state.location.radius / METERS_IN_MILE;

    var zoom_level = 14;
    if (radius_miles < 1.1) {
      zoom_level = 14;
      $("#one-mile").iCheck("check");
    } else if (radius_miles < 3.1) {
      zoom_level = 12;
      $("#three-mile").iCheck("check");
    } else if (radius_miles < 5.1) {
      zoom_level = 11;
      $("#five-mile").iCheck("check");
    } else if (radius_miles < 10.1) {
      zoom_level = 10;
      $("#ten-mile").iCheck("check");
    }

    //initial map options
    mapOptions = {
            center: current_position,
            zoom: zoom_level,
            disableDefaultUI: true
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    /**
     * Mark User's Location
     */
    var user_marker = new google.maps.Marker({
        icon: USER_POSITION,
        position: map.center,
        map: map,
        title: 'You are here.'
    });

    /**
     * Create circle indicating search radius.
     */
    if (searchRadiusCircle !== undefined) {
      searchRadiusCircle.setMap(null);
    }
    var searchRadiusCircle = new google.maps.Circle({
      strokeColor: '#3e621b',
      strokeOpacity: 0.3,
      strokeWeight: 2,
      fillColor: '#5d8a31',
      fillOpacity: 0.2,
      map: map,
      center: map.center,
      radius: Menyou.state.location.radius
    });

    /**
    * user's location marker click listener
    **/
    google.maps.event.addListener(user_marker, 'click', function() {
      infowindow.setContent(this.title);
      infowindow.open(map,this);
    });

    /*
    *Put the "Locate Me" button on the map
    */
    var locate_me_btn = $("<img>").attr("src", LOCATE_ME_BUTTTON)
                        .attr("id", "locate-me-btn");
    //set postion of "Locate Me" btn
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(locate_me_btn[0]);
    //"Locate Me" button click listener 
    google.maps.event.addDomListener(locate_me_btn[0], 'click', function() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(location){
          //get coordinates
          var lat = location.coords.latitude,
              lon = location.coords.longitude;
          //change the center of the map
          map.setCenter({lat: lat, lng: lon});
          //modify UI and state
          handleMapChange(lat, lon);
        });
      } else {
        alert("Your browser doesn't support Geolocation");
      }

    });

    /**
     * Search Box Controller
     */
    var input = document.getElementById('pac-input');
    // map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    var searchBox = new google.maps.places.SearchBox((input));
    google.maps.event.addListener(searchBox, 'places_changed', function() {
      var places = searchBox.getPlaces();
      if (places.length == 0) { return; }

      var bounds = new google.maps.LatLngBounds();
      for (var i = 0, place; place = places[i]; i++) {
          bounds.extend(place.geometry.location);
      }
      map.fitBounds(bounds);
      map.setZoom(15);
      //get coordinates
      var lat = map.getCenter().lat();
      var lon = map.getCenter().lng();
      //modify UI and state
      handleMapChange(lat, lon);   
    });

    /**
    * Map Click handler
    **/
    google.maps.event.addListener(map, 'click', function(event) {
      //get coordinates
      var lat_lng = event.latLng;
      //change the center of the map
      map.setCenter(lat_lng);
      //modify UI and state
      handleMapChange(lat_lng.lat(), lat_lng.lng());
    });

    /**
     * Biases the search box towards addresses in the map window
     */
    google.maps.event.addListener(map, 'bounds_changed', function() {
          var bounds = map.getBounds();
          searchBox.setBounds(bounds);
    });

    /**
    * Map dragend listener
    **/
    google.maps.event.addListener(map, 'dragend', function() {
      //get coordinates
      var lat = map.getCenter().lat();
      var lon = map.getCenter().lng();
      //modify UI and state
      handleMapChange(lat, lon);
    });
    /**
    Changes the position of the user marker, changes Menyou state, and displays
    the "Recommend Nearby" button
    @param lat - the latitude of the map's center
    @param lon - the longitude of the map's center
    **/
    function handleMapChange(lat, lon){
      //change the position of the user marker
      user_marker.setPosition({lat: lat, lng: lon});
      //change state
      Menyou.state.location.lat = lat;
      Menyou.state.location.lon = lon;
      //get name of city at (lat, lon)
      $.ajax({
        url: 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lon + '&sensor=true',
        type: 'GET',
        success: function(object) {
          for (var i=0; i<object.results.length; i++) {
            if (object.results[i].types.indexOf('locality') > -1) {
              Menyou.state.location.city = object.results[object.results.length-4].formatted_address;
            }
          }
        }
      });
      //display the "Recommend Nearby" button
      $("#recommend-btn").show();  
    }

  };

})();


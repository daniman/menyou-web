/**
 * This file declares our Menyou namespace, as well as
 * any variables we want to be globally accessible (such
 * as our application state).
 *
 * Author: rchipman
 */

Menyou = {};

(function() {

  // define default state for application
  Menyou.DEFAULT_STATE = {
    username: null,
    token: null,
    dishes: [],
    taste: {
      likes: [],
      dislikes: [],
      forbidden: []
    },
    location: {
      lat: 42.358638, // MIT is default location.
      lon: -71.093345,
      radius: 1609, // in meters
      city: 'Cambridge, MA'
    }
  };

  // set current state as default state
  Menyou.state = $.extend(true, {}, Menyou.DEFAULT_STATE);

  // The "token" cookie will contain the authentication token.
  Menyou.COOKIE_NAME = "token";

  // Mappings take a source keyword (ex. "shellfish") and maps it to a set of target keywords
  // (ex. "oyster", "clam", "lobster", "crab")
  Menyou.Mappings = null; 

})();

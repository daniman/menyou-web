/**
 * Methods for rendering the user interface.
 *
 * Author: rchipman, daniman
 */

(function() {

  Menyou.UI = {};

  /**
   * Renders the UI with the given template, and the
   * state that is defined in Menyou.state.
   *
   * @param template - the name of the template to render.
   */
  Menyou.UI.render = function(template) {
    preRender[template](function() {
      $('body').html(Menyou.templates[template](Menyou.state));
      postRender[template](function() {});
    });
  };

  /**
   * These are functions that should be executed prior to rendering a given page.
   * Tasks to do here may include fetching data from the API or initializing the map.
   */
  var preRender = {

    index: function(callback) {
      // Attempt to get the token before rendering.
      Menyou.SessionHelper.currentToken(function(has_token) {
        callback();
      });
    },

    profile: function(callback) {
      // Attempt to get the token before rendering.
      Menyou.SessionHelper.currentToken(function(has_token) {
        Menyou.APIHelper.getTasteProfile(Menyou.state.token, function(data) {
          //TODO handle failure case
          Menyou.state.taste = data.content;
          callback();
        });
      });


    }

  };

  var postRender = {
    index: function(callback) {
      // if there is an authenticated user, fetch his recommendations!
      if (Menyou.state.token) {
        $('body').spin("modal");
        Menyou.APIHelper.getDishes(Menyou.state.location.lat, 
            Menyou.state.location.lon,
            Menyou.state.location.radius, 
            Menyou.state.token,
            function(data) {
              //TODO handle failure case
              $('body').spin("modal");
              Menyou.state.dishes = data.content;
              $('body').html(Menyou.templates["index"](Menyou.state));
              Menyou.Map.initialize(); //TODO this really shouldn't be right here
              Menyou.Map.mark_restaurants();
              callback();
            });
      }
    },
    profile: function(callback) {
      callback();
    }
  };

})();

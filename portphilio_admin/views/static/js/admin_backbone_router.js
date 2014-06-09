/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Router
/* ------------------------------------------------------------------- */

App.Router = Backbone.Router.extend({

  routes:{

  "":"getPortfolio",
  "category/:id":"getCategory",
  "work/:id":"getWork"

  },

  initialize: function(){
    // Panel for Listings
    App.listingPanel = new App.ListingPanel();
    App.actionPanel = new App.ActionPanel();

  },

  // Body of work
  getPortfolio: function() {
    var portfolio = App.portfolioStorage.lookup();
    App.listingPanel.list(portfolio);
  },

  // Category

  getCategory: function(id) {
    var category = App.categoryStorage.lookup(id);
    App.listingPanel.list(category);
  },

  // Work

  getWork: function(id){
    var work = App.workStorage.lookup(id);
    App.listingPanel.list(work);
  }

 
});
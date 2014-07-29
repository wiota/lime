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
    App.requestPanel = new App.RequestPanel();
    App.listingPanel = new App.ListingPanel();
    App.actionPanel = new App.ActionPanel();

  },

  // Body of work
  getPortfolio: function() {
    var portfolio = App.portfolioStorage.lookup();
    App.listingPanel.list(portfolio);
    App.actionPanel.closeForms();
    //App.actionPanel.loadBatchForms(portfolio);
  },

  // Category

  getCategory: function(id) {
    var category = App.categoryStorage.lookup(id);
    App.listingPanel.list(category);
    App.actionPanel.closeForms();
    //App.actionPanel.loadBatchForms(category);
  },

  // Work

  getWork: function(id){
    var work = App.workStorage.lookup(id);
    App.listingPanel.list(work);
    App.actionPanel.closeForms();
    //App.actionPanel.loadBatchForms(work);
  }

 
});
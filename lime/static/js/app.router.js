/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Router
/* ------------------------------------------------------------------- */

App.Router = Backbone.Router.extend({

  routes:{

  "":"home",
  "body":"getBody",
  "category/:id":"getCategory",
  "work/:id":"getWork",
  "happenings":"getHappeningsApex",
  "happening/:id":"getHappening"

  },

  initialize: function(){
    // Panel for Listings
    App.requestPanel = new App.RequestPanel();
    App.listingPanel = new App.ListingPanel();
    App.actionPanel = new App.ActionPanel();
    App.pathPanel = new App.Path.PathPanel();

    App.pathPanel.render();

    App.icon = new Iconset();
    App.icon.add("bookcase", '.bookcase.icon');
    App.icon.refresh();

  },

  home: function() {
    App.listingPanel.apexMenu();
    App.actionPanel.closeForms();
    App.icon.refresh();
  },

  // Body of work
  getBody: function() {
    var body = App.collection['Vertex.Apex.Body'].lookup();
    App.listingPanel.list(body);
    App.actionPanel.closeForms();
  },

  // Category

  getCategory: function(id) {
    var category = App.collection['Vertex.Category'].lookup(id);
    App.listingPanel.list(category);
    App.actionPanel.closeForms();
  },

  // Work

  getWork: function(id){
    var work = App.collection['Vertex.Work'].lookup(id);
    App.listingPanel.list(work);
    App.actionPanel.closeForms();
  },

  // Happenings Apex

  getHappeningsApex: function(){
    var happenings = App.collection['Vertex.Apex.Happenings'].lookup();
    App.listingPanel.list(happenings);
    App.actionPanel.closeForms();
  },

  getHappening: function(id){
    var happening = App.collection['Vertex.Happening'].lookup(id);
    App.listingPanel.list(happening);
  }

 
});
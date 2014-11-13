/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Router
/* ------------------------------------------------------------------- */

LIME.Router = Backbone.Router.extend({

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
    LIME.requestPanel = new LIME.RequestPanel();
    LIME.listingPanel = new LIME.ListingPanel();
    LIME.actionPanel = new LIME.ActionPanel();
    LIME.pathPanel = new LIME.Path.PathPanel();


    LIME.icon = new Iconset();
    LIME.icon.add("bookcase", '.bookcase.icon');
    LIME.icon.refresh();
    this.on('route', function(r,p){
      LIME.icon.refresh();
      LIME.actionPanel.closeForms();
    })

  },

  home: function() {
    LIME.listingPanel.apexMenu();
    LIME.pathPanel.jsonLink('#');
  },

  // Body of work
  getBody: function() {
    var vertex = LIME.collection['Vertex.Apex.Body'].lookup();
    LIME.listingPanel.list(vertex);
    LIME.pathPanel.list(vertex);
    LIME.pathPanel.jsonLink('/api/v1/apex/body/');
  },

  // Category
  getCategory: function(id) {
    var vertex = LIME.collection['Vertex.Category'].lookup(id);
    LIME.listingPanel.list(vertex);
    LIME.pathPanel.list(vertex);
    LIME.pathPanel.jsonLink('/api/v1/category/'+id);
  },

  // Work
  getWork: function(id){
    var vertex = LIME.collection['Vertex.Work'].lookup(id);
    LIME.listingPanel.list(vertex);
    LIME.pathPanel.list(vertex);
    LIME.pathPanel.jsonLink('/api/v1/work/'+id);
  },

  // Happenings Apex

  getHappeningsApex: function(){
    var vertex = LIME.collection['Vertex.Apex.Happenings'].lookup();
    LIME.listingPanel.list(vertex);
    LIME.pathPanel.list(vertex);
    LIME.pathPanel.jsonLink('/api/v1/happenings/');
  },

  getHappening: function(id){
    var vertex = LIME.collection['Vertex.Happening'].lookup(id);
    LIME.listingPanel.list(vertex);
    LIME.pathPanel.list(vertex);
    LIME.pathPanel.jsonLink('/api/v1/happening/'+id);
  }

 
});
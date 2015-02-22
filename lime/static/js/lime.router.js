/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Router
/* ------------------------------------------------------------------- */

LIME.Router = Backbone.Router.extend({

  routes:{
    "":"home",
    "body":"getBody",
    "happenings":"getHappeningsApex",
    ":vertexType/:id":"getVertex"
  },

  initialize: function(){
    // Panel for Listings
    LIME.requestPanel = new LIME.RequestPanel();
    LIME.listingPanel = new LIME.ListingPanel();
    LIME.actionPanel = new LIME.ActionPanel();
    LIME.pathPanel = new LIME.Path.PathPanel();

    // Where should this go?
    window.addEventListener('drop', function(e){
      e.preventDefault();
    })

    window.addEventListener('dragover', function(e){
      e.preventDefault();
    })

    //
    LIME.host = new LIME.Model.Host({'vertex_type':'host'});

    // Icons
    LIME.icon = new Iconset();
    LIME.icon.add("bookcase", '.bookcase.icon');
    LIME.icon.refresh();
    this.on('route', function(r,p){
      LIME.icon.refresh();
      // possible bug here
      LIME.actionPanel.closeForms();
    })

  },

  home: function() {
    LIME.listingPanel.apexMenu();
    LIME.pathPanel.nowhere();
    LIME.pathPanel.jsonLink('#');
  },

  // Body of work
  getBody: function() {
    console.log('got body');
    var vertex = LIME.collection['Vertex.Apex.Body'].lookup();
    LIME.listingPanel.list(vertex);
    LIME.pathPanel.list(vertex);
    LIME.pathPanel.jsonLink('/api/v1/apex/body/');
  },

  // Vertex
  getVertex: function(vertexType, id){
    console.log('got vertex');
    var vertex = LIME.collection.Vertex.lookup(id, vertexType);
    LIME.listingPanel.list(vertex);
    LIME.pathPanel.list(vertex);
    LIME.pathPanel.jsonLink('/api/v1/'+vertexType+'/'+id);
  },

  // Happenings Apex
  getHappeningsApex: function(){
    var vertex = LIME.collection['Vertex.Apex.Happenings'].lookup();
    LIME.listingPanel.list(vertex);
    LIME.pathPanel.list(vertex);
    LIME.pathPanel.jsonLink('/api/v1/happenings/');
  }

});
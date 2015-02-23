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
    // LIME interface
    LIME.requestPanel = new LIME.RequestPanel();
    LIME.listingPanel = new LIME.ListingPanel();
    LIME.actionPanel = new LIME.ActionPanel();
    LIME.pathPanel = new LIME.Path.PathPanel();

    // special vertices
    LIME.apex = {}
    LIME.apex.body = new LIME.Model['Vertex.Apex.Body']({'vertex_type':'body'});
    LIME.apex.happenings = new LIME.Model['Vertex.Apex.Happenings']({'vertex_type':'happenings'});

    // fetch
    LIME.apex.body.deepen();
    LIME.apex.happenings.deepen();

    // icons
    LIME.icon = new Iconset();
    LIME.icon.add("bookcase", '.bookcase.icon');
    LIME.icon.refresh();

    this.on('route', function(r,p){
      LIME.icon.refresh();
      LIME.actionPanel.closeForm();
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
    var vertex = LIME.apex.body;
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
    var vertex = LIME.apex.happenings;
    LIME.listingPanel.list(vertex);
    LIME.pathPanel.list(vertex);
    LIME.pathPanel.jsonLink('/api/v1/happenings/');
  }

});
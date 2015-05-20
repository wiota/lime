/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Router
/* ------------------------------------------------------------------- */

LIME.Router = Backbone.Router.extend({

  routes:{
    "":"getHost",
    ":vertexType/:id":"getVertex"
  },

  initialize: function(){
    // LIME interface
    LIME.panel = new LIME.Panel({
      panels: ['#predecessor_column','#focus_column', '#successor_column']
    });

    LIME.panel.addPreset('standard', [0, 0, 250]);
    LIME.panel.addPreset('predecessor', [0, 250, 500]);
    LIME.panel.addPreset('successor', [0, 0, 180]);
    LIME.panel.shift('standard');

    LIME.focus = new LIME.Focus();
    LIME.successorSet = new LIME.ListingPanel({"setType": "successor", el: $('#succset')});
    LIME.predecessorSet = new LIME.ListingPanel({"setType": "predecessor", el: $('#predset')});
    LIME.actionPanel = new LIME.ActionPanel();

    // not shown right now
    LIME.requestPanel = new LIME.RequestPanel();

    // icons
    LIME.icon = new Iconset();
    LIME.icon.add("bookcase", '.bookcase.icon');
    LIME.icon.refresh();

    this.on('route', function(r,p){
      LIME.icon.refresh();
      // This should disappear with the forms being passed through the router
      LIME.actionPanel.closeForm();
    })

  },

  // Host
  getHost: function() {
    var id = (LIME.host.get('apex'));
    this.getVertex('host', id);
  },

  // Vertex
  getVertex: function(vertexType, id){
    var vertex = LIME.collection.Vertex.lookup(id, vertexType);
    LIME.focus.list(vertex);
    LIME.successorSet.list(vertex);
    LIME.predecessorSet.list(vertex);

  }

});
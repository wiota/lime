/* ------------------------------------------------------------------- */
// LIME Router
//
// requires
// underscore.js, backbone.js, jquery.js,
// lime.model.js,
// lime.collection.js,
// lime.panel.js,
// lime.view.js,
// lime.focus.js,
// lime.form.js,
// lime.icon.js
/* ------------------------------------------------------------------- */

LIME.Router = Backbone.Router.extend({

  routes:{
    "":"getHost",
    ":vertexType/:id":"getVertex"
  },

  initialize: function(){

    // Location on graph
    LIME.focus = null;

    // LIME panels
    LIME.panel = new LIME.Panel({
      panels: ['#predecessor_column','#focus_column', '#successor_column']
    });

    LIME.panel.addPreset('standard', [0, 0, 250]);
    LIME.panel.addPreset('predecessor', [0, 250, 500]);
    LIME.panel.addPreset('successor', [0, 0, 180]);
    LIME.panel.shift('standard');

    LIME.focusPanel = new LIME.FocusPanel();
    LIME.successorPanel = new LIME.ListingPanel({"setType": "successor", el: $('#succset')});
    LIME.predecessorPanel = new LIME.ListingPanel({"setType": "predecessor", el: $('#predset')});
    LIME.actionPanel = new LIME.ActionPanel();

    // Icons
    LIME.icon = new Iconset();
    LIME.icon.add("bookcase", '.bookcase.icon');
    LIME.icon.refresh();

    // This should disappear with the forms being passed through the router
    this.on('route', function(r,p){
      LIME.icon.refresh();
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
    LIME.focus = LIME.collection.Vertex.lookup(id, vertexType);
    LIME.focusPanel.list(LIME.focus);
    LIME.successorPanel.list(LIME.focus);
    LIME.predecessorPanel.list(LIME.focus);

  }

});
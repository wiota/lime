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
    LIME.panel = new LIME.Panel({
      panels: ['#predecessor_column','#focus_column', '#display_column']
    });

    LIME.panel.addPreset('standard', [0, 0, 250]);
    LIME.panel.addPreset('predecessor', [0, 500, 750]);

    LIME.focus = new LIME.Focus();
    LIME.successorSet = new LIME.ListingPanel({"setType": "successor", el: $('#succset')});
    LIME.predecessorSet = new LIME.ListingPanel({"setType": "predecessor", el: $('#predset')});
    LIME.actionPanel = new LIME.ActionPanel();

    // not shown right now
    LIME.requestPanel = new LIME.RequestPanel();

    // special vertices
    // This should be replace by host apex
    LIME.apex = {}
    LIME.apex.body = new LIME.Model.Vertex({'vertex_type':'body', 'title': 'body of work'});
    LIME.apex.happenings = new LIME.Model.Vertex({'vertex_type':'happenings', 'title': 'happenings'});

    // fetch
    // This should be replace by host apex
    LIME.apex.body.deepen();
    LIME.apex.happenings.deepen();

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

  // This should be replace by host apex
  home: function() {
    LIME.successorSet.apexMenu();
    LIME.focus.nowhere();
  },

  // Body of work
  // This should be replace by host apex
  getBody: function() {
    var vertex = LIME.apex.body;
    LIME.focus.list(vertex);
    LIME.successorSet.list(vertex);
  },

  // Vertex
  getVertex: function(vertexType, id){
    var vertex = LIME.collection.Vertex.lookup(id, vertexType);
    LIME.focus.list(vertex);
    LIME.successorSet.list(vertex);
    LIME.predecessorSet.list(vertex);

  },

  // Happenings Apex
  // This should be replace by host apex
  getHappeningsApex: function(){
    var vertex = LIME.apex.happenings;
    LIME.successorSet.list(vertex);
    LIME.focus.list(vertex);
  }

});
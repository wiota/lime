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

  // Route roadmap

  // /#                               - list host
  // /#category/1234                  - list vertex + successors
  // /#category/1234/update           - show update form
  // /#category/1234/create/          - show add form
  // /#category/1234/list/5678/move   - move successors - from vertex to vertex
  // /#category/1234/list/5678/link   - add new successors - limit to bucket vertex

  routes:{
    "":"listHost",
    ":vertexType/:id" : "list",
    ":vertexType/:id/update" : "update",
    ":vertexType/:id/create/:newVertexType" : "create",
    ":vertexType/:id/list/:bucket/move" : "move",
    ":vertexType/:id/list/:bucket/link" : "link",
  },

  initialize: function(){

    // Location on graph
    LIME.focus = null;
    LIME.bucket = null;

    // LIME panels
    LIME.panel = new LIME.Panel({
      panels: ['#predecessor_column','#focus_column', '#successor_column']
    });

    LIME.panel.addPreset('standard', [0, 0, 250]);
    LIME.panel.addPreset('predecessor', [0, 250, 500]);
    LIME.panel.addPreset('successor', [0, 0, 0]);


    LIME.focusPanel = new LIME.FocusPanel();
    LIME.successorPanel = new LIME.ListingPanel({"setType": "successor", "menu": true, el: $('#succset')});
    LIME.predecessorPanel = new LIME.ListingPanel({"setType": "predecessor", el: $('#predset')});
    LIME.actionPanel = new LIME.ActionPanel();
    LIME.bucketPanel = new LIME.ListingPanel({"setType": "successor", el: $('#bucket')});

    // Icons
    LIME.icon = new Iconset();
    LIME.icon.add("bookcase", '.bookcase.icon');
    LIME.icon.refresh();
    this.on('route', function(r,p){
      LIME.icon.refresh();
    })
  },

  // Endpoints
  listHost: function() {
    var id = (LIME.host.get('apex'));
    this.list('host', id);
  },

  list: function(vertexType, id){
    if(this.sameId(LIME.focus, id)){
      this.listVertex(vertexType, id, 'list', null, null);
    }
    LIME.panel.shift('predecessor');
    $('#bucket_column').fadeOut();
    //LIME.actionPanel.closeForm();
  },

  update: function(vertexType, id){
    if(this.sameId(LIME.focus, id)){
      this.listVertex(vertexType, id, 'list', null, null);
    }
    LIME.panel.shift('successor');
    $('#bucket_column').fadeOut();
    LIME.actionPanel.loadVertexForm(LIME.focus, null);
  },

  create: function(vertexType, id, newVertexType){
    if(this.sameId(LIME.focus, id)){
      this.listVertex(vertexType, id, 'list', null, null);
    }
    var vertex = LIME.stack.createVertex({'vertex_type': newVertexType})
    LIME.panel.shift('successor');
    $('#bucket_column').fadeOut();
    LIME.actionPanel.loadVertexForm(vertex, LIME.focus);
  },

  move: function(vertexType, id, bucket){
    if(this.sameId(LIME.focus, id)){
      this.listVertex(vertexType, id);
    }
    if(this.sameId(LIME.bucket, id)){
      this.listBucket(bucket);
    }
    $('#bucket_column').fadeIn();
    LIME.panel.shift('successor');

  },

  link: function(vertexType, id, bucket){
    console.warn('Function not implemented');
  },

  // Tools
  sameId: function(existing, id){
    if(existing && existing.id === id){
      return false;
    } else {
      return true;
    }
  },

  lookupVertex: function(vertexType, id){
    return LIME.focus = LIME.collection.Vertex.lookup(id, vertexType); // focus state set here
  },

  listVertex: function(vertexType, id){
    vertex = this.lookupVertex(vertexType, id)

    LIME.focusPanel.list(vertex);
    LIME.successorPanel.list(vertex);
    LIME.predecessorPanel.list(vertex);
  },

  listBucket: function(id){
    vertex = this.lookupVertex(null, id);
    LIME.bucketPanel.list(vertex);
  }

});
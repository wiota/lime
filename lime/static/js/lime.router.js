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

    // Locations on graph
    LIME.state = {
      subject: [
        // Subject primary
        {
          focus: null,
          lens: {
            focus: {
              view: new LIME.FocusPanel()
            },
            successors: {
              view: new LIME.ListingPanel({"setType": "successor", "menu": true, el: $('#succset')}),
              menu: null
            },
            predecessors: {
              view: new LIME.ListingPanel({"setType": "predecessor", el: $('#predset')})
            }
          },
          panel: new LIME.Panel({panels: ['#predecessor_column','#focus_column', '#successor_column']})
        },

        // Subject 1 is for moving and linking
        {
          focus: null,
          lens: {
            successors: {
              view: new LIME.ListingPanel({"setType": "successor", el: $('#bucket')})
            }
          }
        }
      ],
      panel: new LIME.Panel({panels: ['#subject0','#subject1']})
    }

    LIME.state.subject[0].panel.addPreset('standard', [0, 0, 250]);
    LIME.state.subject[0].panel.addPreset('predecessor', [0, 250, 500]);
    LIME.state.subject[0].panel.addPreset('successor', [0, 0, 0]);

    LIME.state.panel.addPreset('single', [0, 100], "%");
    LIME.state.panel.addPreset('double', [0, 50], "%");

    LIME.actionPanel = new LIME.ActionPanel(); // will be incorporated into lens.focus.view

    // Icons
    LIME.icon = new Iconset();
    LIME.icon.add("bookcase", '.bookcase.icon');
    LIME.icon.refresh();
    this.on('route', function(r,p){
      LIME.icon.refresh();
    })
  },

  // Set State

  setFocusState: function(index, vertex){
    if(this.sameId(LIME.state.subject[index], vertex)){
      LIME.state.subject[index].focus = vertex;
      _.each(LIME.state.subject[index].lens, function(lens){
        lens.view.list(vertex);
      })
    }
  },

  setLensState: function(panelPreset){
    LIME.state.subject[0].panel.shift(panelPreset);
  },

  // Endpoints
  listHost: function() {
    var id = (LIME.host.get('apex'));
    this.list('host', id);
  },

  list: function(vertexType, id){
    this.setFocusState(0, this.lookupVertex(id))
    this.setLensState('predecessor');
    $('#bucket_column').fadeOut();
  },

  update: function(vertexType, id){
    this.setFocusState(0, this.lookupVertex(id))
    this.setLensState('successor');
    $('#bucket_column').fadeOut();
    LIME.actionPanel.loadVertexForm(LIME.focus, null);
  },

  create: function(vertexType, id, newVertexType){
    var predecessor = this.lookupVertex(id);
    this.setFocusState(0, predecessor)
    var vertex = LIME.stack.createVertex({'vertex_type': newVertexType})
    this.setLensState('successor');
    $('#bucket_column').fadeOut();
    LIME.actionPanel.loadVertexForm(vertex, predecessor);
  },

  move: function(vertexType, id, bucket){
    this.setFocusState(0, this.lookupVertex(id))
    this.setFocusState(1, this.lookupVertex(null, id));
    $('#bucket_column').fadeIn();
    this.setLensState('successor');

  },

  link: function(id, bucket){
    console.warn('Function not implemented ');
    this.move(id, bucket)
  },

  // Tools
  sameId: function(currentFocus, newFocus){
    if(currentFocus && newFocus && currentFocus.id === newFocus.id){
      return false;
    } else {
      return true;
    }
  },

  lookupVertex: function(id){
    return LIME.collection.Vertex.lookup(id); // focus state set here
  }
});
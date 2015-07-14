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
    ":vertexType/:id/list/:secondary/move" : "move",
    ":vertexType/:id/list/:secondary/link" : "link",
  },

  initialize: function(){

    // Locations on graph
    LIME.ui = {
      primarySubject: {
        lens: {
          focus: new LIME.FocusPanel({el: $('#primary_subject .focus.box')}),
          successors: new LIME.ListingPanel({"setType": "successor", "menu": true, el: $('#primary_subject .succset')}),
          predecessors: new LIME.ListingPanel({"setType": "predecessor", el: $('#primary_subject .predset')})
        }
      },
      secondarySubject: {
        lens: {
          successors: new LIME.ListingPanel({"setType": "successor", el: $('#secondary_subject .succset')})
        }
      }
    }

    LIME.panel = {
      subjects: new LIME.Panel({panels: ['#primary_subject','#secondary_subject']}),
      primarySubject: new LIME.Panel({panels: ['#primary_subject .predecessor.lens','#primary_subject .focus.lens', '#primary_subject .successor.lens']})
    }

    LIME.state = {
      primarySubject: {
        focus: null,
        panelState: 'predecessor',
        lens: {
          focus: {
            nav: true
          },
          successors: {
            nav: false,
            view: 'list',
            mode: 'add'
          },
          predecessors: {
            nav: false,
            view: 'list',
            mode: 'add'
          }
        }
      },
      secondarySubject: {
        focus: null,
        panelState: 'standard',
        lens: {
          focus: {
            nav: false
          },
          successors: {
            nav: false,
            view: 'list',
            mode: 'add'
          }
        }
      },
      panelState: 'single'
    }

    LIME.cursors = {
      'primarySubject.focus': function(vertex){
        _.invoke(LIME.ui.primarySubject.lens, 'list', vertex);
      },
      'secondarySubject.focus': function(vertex){
        _.invoke(LIME.ui.secondarySubject.lens, 'list', vertex);
      },
      'panelState': _.bind(LIME.panel.subjects.shift, LIME.panel.subjects),
      'primarySubject.panelState': _.bind(LIME.panel.primarySubject.shift, LIME.panel.primarySubject)
    }

    LIME.panel.primarySubject.addPreset('standard', [0, 0, 250]);
    LIME.panel.primarySubject.addPreset('predecessor', [0, 250, 500]);
    LIME.panel.primarySubject.addPreset('successor', [0, 0, 0]);

    LIME.panel.subjects.addPreset('single', [0, 100], "%");
    LIME.panel.subjects.addPreset('double', [0, 50], "%");

    LIME.actionPanel = new LIME.ActionPanel(); // will be incorporated into lens.focus.view

    // Icons
    LIME.icon = new Iconset();
    LIME.icon.add("bookcase", '.bookcase.icon');
    LIME.icon.refresh();
    this.on('route', function(r,p){
      LIME.icon.refresh();
    })
  },

  getTreeValue: function(obj, path){
    var undefined;
    if(obj === undefined || path.length < 1){ return false }
    var arr = path.split('.');
    var child = obj[arr[0]];
    if(arr.length === 1){
      return child;
    } else {
      return this.getTreeValue(child, _.rest(arr).join('.'));
    }
  },

  replaceTreeValue: function(obj, path, val){
    var undefined;
    if(obj === undefined || path.length < 1){ return false }

    var arr = path.split('.');
    var clone = _.clone(obj);
    var child = obj[arr[0]];

    if(arr.length === 1){                                     // if path is a single prop
      clone[arr[0]] = val;
      return clone;
    } else {
      clone[arr[0]] = this.replaceTreeValue(child, _.rest(arr).join('.'), val);
      return clone;
    }
  },

  // Set State
  setState: function(path, val){
    var currentVal = this.getTreeValue(LIME.state, path);
    var fn = LIME.cursors[path];
    if(currentVal !== val){
      LIME.state = this.replaceTreeValue(LIME.state, path, val);
    }
    if(_.isFunction(fn)){
      fn(val);
    }
    console.log(LIME.state);
  },

  focusLens: function(subject, vertex){
    if(this.sameId(LIME.state[subject].focus, vertex)){
      LIME.state[subject].focus = vertex;
      _.each(LIME.ui[subject].lens, function(lens){
        lens.list(vertex);
      })
    }
  },

  setLensState: function(subject, panelPreset){
    LIME.panel[subject].shift(panelPreset);
  },

  // Endpoints
  listHost: function() {
    var id = (LIME.host.get('apex'));
    this.list('host', id);
  },

  list: function(vertexType, id){
    this.setState('primarySubject.focus', this.lookupVertex(id));
    this.setState('panelState', 'single');
    this.setState('primarySubject.panelState', 'predecessor');
  },

  update: function(vertexType, id){
    LIME.actionPanel.loadVertexForm(LIME.focus, null);

    this.setState('primarySubject.focus', this.lookupVertex(id));
    this.setState('panelState', 'single');
    this.setState('primarySubject.panelState', 'successor');
  },

  create: function(vertexType, id, newVertexType){
    var predecessor = this.lookupVertex(id);
    var vertex = LIME.stack.createVertex({'vertex_type': newVertexType})

    LIME.actionPanel.loadVertexForm(vertex, predecessor);

    this.setState('primarySubject.focus', predecessor);
    this.setState('panelState', 'single');
    this.setState('primarySubject.panelState', 'successor');
  },

  move: function(vertexType, id, secondary){
    this.setState('primarySubject.focus', this.lookupVertex(id));
    this.setState('secondarySubject.focus', this.lookupVertex(secondary));
    this.setState('panelState', 'double');
    this.setState('primarySubject.panelState', 'successor');
  },

  link: function(vertexType, id, secondary){
    this.setState('primarySubject.focus', this.lookupVertex(id));
    this.setState('secondarySubject.focus', this.lookupVertex(secondary));
    this.setState('panelState', 'double');
    this.setState('primarySubject.panelState', 'successor');
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
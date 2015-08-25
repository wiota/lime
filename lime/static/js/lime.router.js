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

// Handles the notion of application state
// Keep graph state in the models

LIME.Router = Backbone.Router.extend({

  routes:{
    "":"listHost",
    ":vertexType/:id" : "list",
    ":vertexType/:id/" : "list",
    ":vertexType/:id/list" : "list",
    ":vertexType/:id/update" : "update",
    ":vertexType/:id/cover" : "cover",
    ":vertexType/:id/create/:newVertexType" : "create",
    ":vertexType/:id/list/:secondary/move" : "move",
    ":vertexType/:id/list/:secondary/link" : "link",
  },

  initialize: function(){

    // Screen grid
    LIME.panel = {
      subjects: new LIME.Panel({panels: ['#primary_subject','#secondary_subject']}),
      primarySubject: new LIME.Panel({panels: ['#primary_subject .predecessor.lens','#primary_subject .focus.lens', '#primary_subject .successor.lens']})
    }

    LIME.panel.primarySubject.addPreset('standard', [0, 0, 250]);
    LIME.panel.primarySubject.addPreset('focus', [0, 0, 100], "%");
    LIME.panel.primarySubject.addPreset('predecessor', [0, 250, 500]);
    LIME.panel.primarySubject.addPreset('cover', [0, 0, 500]);
    LIME.panel.primarySubject.addPreset('successor', [0, 0, 0]);

    LIME.panel.subjects.addPreset('single', [0, 100], "%");
    LIME.panel.subjects.addPreset('double', [0, 50], "%");


    // Subjects are selected vertices
    // UI elements already exist in the DOM
    var ui = LIME.ui = {
      primarySubject: {
        lens: {
          focus: new LIME.FocusLens({el: $('#primary_subject .focus.box')}),
          successors: new LIME.SuccessorLens({el: $('#primary_subject .successor.box')}),
          predecessors: new LIME.PredecessorLens({el: $('#primary_subject .predecessor.box')})
        }
      },
      secondarySubject: {
        lens: {
          successors: new LIME.SecondaryListingLens({el: $('#secondary_subject .successor.box')})
        }
      }
    }

    // LIME State Machine
    LIME.state = new LIME.StateMachine();

    // Lens State
    LIME.state.on('primarySubject.focus', function(vertex){ _.invoke(ui.primarySubject.lens, 'list', vertex); });
    LIME.state.on('secondarySubject.focus', function(vertex){ _.invoke(ui.secondarySubject.lens, 'list', vertex); });

    // Panel State
    LIME.state.on('panelState', _.bind(LIME.panel.subjects.shift, LIME.panel.subjects));
    LIME.state.on('primarySubject.panelState', _.bind(LIME.panel.primarySubject.shift, LIME.panel.primarySubject));

    // Input State
    LIME.state.on('primarySubject.inputState', _.bind(ui.primarySubject.lens.focus.state.set, ui.primarySubject.lens.focus.state, 'inputState'));
    LIME.state.on('primarySubject.successorInputState', _.bind(ui.primarySubject.lens.successors.state.set, ui.primarySubject.lens.successors.state, 'inputState'));

    // New Subject
    LIME.state.on('newSubject', _.noop);

    this.setInitialState();

    // Icons
    LIME.icon = new Iconset();

  },

  // Unsure of these instructions
  setInitialState: function(){

    // New Subject
    LIME.state.set('newSubject', null);

    // Nav
    LIME.state.set('primarySubject.lens.focus.nav', 'true');

    // Panels
    LIME.state.set('panelState', 'single');
    LIME.state.set('primarySubject.panelState', 'predecessor');
    LIME.state.set('secondarySubject.panelState', 'standard');

  },


  // Endpoints
  // There should be an endpoint for every application state that needs a url.
  // Maybe there should be an endpoint for every possible applicaton state.
  // Question: Should browser history handle the application state entirely?
  //   Should syncing state be there?

  listHost: function() {
    var id = (LIME.host.get('apex'));
    this.list('host', id);
  },

  list: function(vertexType, id){
    var start = new Date();
    console.log("LIST START ----------------");
    // Listed Vertex
    LIME.state.set('primarySubject.focus', this.lookupVertex(id));

    // Input State
    LIME.state.set('primarySubject.inputState', 'read');
    LIME.state.set('primarySubject.successorInputState', 'read');

    // Panel Grid
    LIME.state.set('panelState', 'single');
    LIME.state.set('primarySubject.panelState', 'predecessor');
    console.log("LIST STOP - " + (new Date() - start))
  },

  update: function(vertexType, id){
    // Listed Vertex
    LIME.state.set('primarySubject.focus', focus = this.lookupVertex(id));

    // Input State
    LIME.state.set('primarySubject.inputState', 'update');
    LIME.state.set('primarySubject.successorInputState', 'read');

    // Panel Grid
    LIME.state.set('panelState', 'single');
    LIME.state.set('primarySubject.panelState', 'focus');
  },

  cover: function(vertexType, id){
    // Listed Vertex
    LIME.state.set('primarySubject.focus', this.lookupVertex(id));

    // Input State
    LIME.state.set('primarySubject.inputState', 'cover');
    LIME.state.set('primarySubject.successorInputState', 'read');

    // Panel Grid
    LIME.state.set('panelState', 'single');
    LIME.state.set('primarySubject.panelState', 'cover');
  },

  create: function(vertexType, id, newVertexType){
    // Listed Vertex
    LIME.state.set('primarySubject.focus', this.lookupVertex(id));

    // New Subject
    LIME.state.set('newSubject', LIME.stack.createVertex({'vertex_type': newVertexType}));

    // Input State
    LIME.state.set('primarySubject.inputState', 'read');
    LIME.state.set('primarySubject.successorInputState', 'create');

    // Panel Grid
    LIME.state.set('panelState', 'single');
    LIME.state.set('primarySubject.panelState', 'standard');
  },

  move: function(vertexType, id, secondary){
    // Listed Vertices
    LIME.state.set('primarySubject.focus', this.lookupVertex(id));
    LIME.state.set('secondarySubject.focus', this.lookupVertex(secondary));

    // Input State
    LIME.state.set('primarySubject.inputState', 'read');
    LIME.state.set('primarySubject.successorInputState', 'read');

    // Panel Grid
    LIME.state.set('panelState', 'double');
    LIME.state.set('primarySubject.panelState', 'successor');
  },

  link: function(vertexType, id, secondary){
    // Listed Vertices
    LIME.state.set('primarySubject.focus', this.lookupVertex(id));
    LIME.state.set('secondarySubject.focus', this.lookupVertex(secondary));

    // Input State
    LIME.state.set('primarySubject.inputState', 'read');
    LIME.state.set('primarySubject.successorInputState', 'read');

    // Panel Grid
    LIME.state.set('panelState', 'double');
    LIME.state.set('primarySubject.panelState', 'successor');
  },


  // Pure Functional Tools

  getTreeValue: function(obj, path){
    var undefined, arr, child;
    if(obj === undefined || path.length < 1){ return false }
    arr = path.split('.');
    child = obj[arr[0]];
    if(arr.length === 1){
      return child;
    } else {
      return this.getTreeValue(child, _.rest(arr).join('.'));
    }
  },

  replaceTreeValue: function(obj, path, val){
    var undefined, arr, child, clone;
    if(path.length < 1){ return false }

    arr = path.split('.');
    if(obj === undefined){
      clone = {};
      child = {};
    } else {
      clone =  _.clone(obj);
      child = obj[arr[0]];
    }


    // if shallow
    if(arr.length === 1){
      clone[arr[0]] = val;
      return clone;
    // if deep, call recursively
    } else {
      clone[arr[0]] = this.replaceTreeValue(child, _.rest(arr).join('.'), val);
      return clone;
    }
  },

  sameId: function(model1, model2){
    if(model1 && model2 && model1.id === model2.id){
      return false;
    } else {
      return true;
    }
  },


  // Helpers
  lookupVertex: function(id){
    return LIME.collection.Vertex.lookup(id);
  }
});
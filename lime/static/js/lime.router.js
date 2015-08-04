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
    ":vertexType/:id/" : "list",
    ":vertexType/:id/list" : "list",
    ":vertexType/:id/update" : "update",
    ":vertexType/:id/create/:newVertexType" : "create",
    ":vertexType/:id/list/:secondary/move" : "move",
    ":vertexType/:id/list/:secondary/link" : "link",
  },

  initialize: function(){

    // Subjects are selected vertices
    LIME.ui = {
      primarySubject: {
        form: new LIME.ActionPanel(), // will be incorporated into lens.focus.view
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


    // Screen grid
    LIME.panel = {
      subjects: new LIME.Panel({panels: ['#primary_subject','#secondary_subject']}),
      primarySubject: new LIME.Panel({panels: ['#primary_subject .predecessor.lens','#primary_subject .focus.lens', '#primary_subject .successor.lens']})
    }



    // Cursors
    // Cursors in this context are functions applied (usually to the ui)
    // when application state is set
    LIME.cursor = {}

    // Lens State
    LIME.cursor['primarySubject.focus'] = function(vertex){ _.invoke(LIME.ui.primarySubject.lens, 'list', vertex); }
    LIME.cursor['secondarySubject.focus'] = function(vertex){ _.invoke(LIME.ui.secondarySubject.lens, 'list', vertex); }

    // Panel State
    LIME.cursor['panelState'] = _.bind(LIME.panel.subjects.shift, LIME.panel.subjects)
    LIME.cursor['primarySubject.panelState'] = function(state){
      _.bind(LIME.panel.primarySubject.shift, LIME.panel.primarySubject)(state)
    }

    // Input State
    LIME.cursor['primarySubject.inputState'] = function(state){
      if(state === 'update'){
        var focus = LIME.router.getState('primarySubject.focus');
        LIME.ui.primarySubject.form.loadVertexForm(focus);

      } else if (state === 'create'){
        var vertex = LIME.router.getState('newSubject');
        var predecessor = LIME.router.getState('primarySubject.focus');
        LIME.ui.primarySubject.form.loadCreateForm(vertex, predecessor);

      } else if(state === 'view'){
        LIME.ui.primarySubject.form.closeForm();
      }
    }


    // Panel Settings
    LIME.panel.primarySubject.addPreset('standard', [0, 0, 250]);
    LIME.panel.primarySubject.addPreset('focus', [0, 0, 100], "%");
    LIME.panel.primarySubject.addPreset('predecessor', [0, 250, 500]);
    LIME.panel.primarySubject.addPreset('successor', [0, 0, 0]);

    LIME.panel.subjects.addPreset('single', [0, 100], "%");
    LIME.panel.subjects.addPreset('double', [0, 50], "%");


    // Icons
    LIME.icon = new Iconset();


    // Inital State
    this.setInitialState();
  },


  // Application State Machine
  // By dicipline, the application state is immutable.
  // Do not mutate the state. Calling setState will return
  // a new object, only cloning the property that changes
  // and its ancestors up the tree to the root object

  setState: function(path, val){
    var currentVal = this.getTreeValue(LIME.state, path);
    var fn = LIME.cursor[path] || _.noop;
    if(currentVal !== val){
      LIME.state = this.replaceTreeValue(LIME.state, path, val);
      newVal = this.getTreeValue(LIME.state, path);
      fn(newVal);
    }
  },

  getState: function(path){
    return this.getTreeValue(LIME.state, path);
  },


  setInitialState: function(){

    LIME.state = {}

    // Input state
    this.setState('primarySubject.inputState', 'view');

    // Nav
    this.setState('primarySubject.lens.focus.nav', 'true');

    // Menus State is not wired yet
    // this.setState('primarySubject.lens.successors.view', 'list');
    // this.setState('primarySubject.lens.successors.mode', 'add');
    // this.setState('primarySubject.lens.predecessors.view', 'list');
    // this.setState('primarySubject.lens.predecessors.mode', 'add');
    // this.setState('secondarySubject.lens.successors.view', 'list');
    // this.setState('secondarySubject.lens.successors.mode', 'add');

    // Panels
    this.setState('panelState', 'single');
    this.setState('primarySubject.panelState', 'predecessor');
    this.setState('secondarySubject.panelState', 'standard');

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
    this.setState('primarySubject.focus', this.lookupVertex(id));
    this.setState('primarySubject.inputState', 'view');

    this.setState('panelState', 'single');
    this.setState('primarySubject.panelState', 'predecessor');
  },

  update: function(vertexType, id){
    var focus;
    this.setState('primarySubject.focus', focus = this.lookupVertex(id));
    this.setState('primarySubject.inputState', 'update');

    // Panels
    this.setState('panelState', 'single');
    this.setState('primarySubject.panelState', 'focus');
  },

  create: function(vertexType, id, newVertexType){
    var predecessor, vertex;

    vertex = LIME.stack.createVertex({'vertex_type': newVertexType});
    predecessor = this.lookupVertex(id);

    this.setState('primarySubject.focus', predecessor);
    this.setState('newSubject', vertex)
    this.setState('primarySubject.inputState', 'create');

    // Panels
    this.setState('panelState', 'single');
    this.setState('primarySubject.panelState', 'focus');
  },

  move: function(vertexType, id, secondary){
    this.setState('primarySubject.focus', this.lookupVertex(id));
    this.setState('secondarySubject.focus', this.lookupVertex(secondary));

    // Panels
    this.setState('panelState', 'double');
    this.setState('primarySubject.panelState', 'successor');
  },

  link: function(vertexType, id, secondary){
    this.setState('primarySubject.focus', this.lookupVertex(id));
    this.setState('secondarySubject.focus', this.lookupVertex(secondary));

    // Panels
    this.setState('panelState', 'double');
    this.setState('primarySubject.panelState', 'successor');
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
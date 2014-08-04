/* ------------------------------------------------------------------- */
// Portphillio Admin Request Panel
/* ------------------------------------------------------------------- */

// The two reasons you would create subrequests are if
// A: You have several requests you want to call in series
// B: You have an array for which you want to loop and make requests

// id tag
// on success, remove them
// on error, rerun once and then flag the manager to halt requests



App.Request = Backbone.View.extend({

  initialize: function(options){
    // object passed from initRequest
    var content = options.content;
    this.func = content.func;
    this.args = content.args;

    // id passed from initRequest
    this.rid = options.rid;
    this.type = options.type || 'noop';

    _.bindAll(this,'complete', 'error');
  },

  call: function(request){
    console.log("Call " + request.type + ' ' + request.rid);
    var func = request.func
    var args = request.args;
    // calls function as if it is a method
    func.apply(request, args);
  },

  registerSubrequest: function(subrequest){
    // set parent variable of subrequest
    // set handler to remove subrequest from request
    console.log('registered ' + subrequest.type + ' with ' + this.type);
    subrequest.parentRequest = this;
    this.listenTo(subrequest, 'complete', this.removeSubrequest);
  },

  registerSubrequests: function(subrequests){
    console.log('registering ' + subrequests.length + ' ')
    _.each(subrequests, this.registerSubrequest, this);
  },

  callParallelSubrequests: function(subrequests){
    _.each(subrequests, this.call, this)
  },

  callSerialSubrequests: function(subrequests){
    // set up handlers
    var first = null;
    var prereq = null;
    _.each(subrequests, function(subrequest){
      if(!prereq){
        first = subrequest;
      } else {
        subrequest.listenTo(prereq, 'complete', function(){
          subrequest.call(subrequest);
        })
      }
      prereq = subrequest;
    })
    this.call(first);
  },

  removeSubrequest: function(subrequest){
    console.log('Removed from parent list '+ subrequest.type + ' ' + subrequest.rid);
    this.subrequests = _.without(this.subrequests, subrequest)
    if(this.subrequests.length <= 0){
      console.log('Subrequest complete of ' + this.type + ' ' + this.rid);
      this.trigger('subrequestscomplete', this);

    }
  },

  complete: function(model, response, options){
    this.trigger('complete', this);
  },

  error: function(model, response, options){
    this.trigger('error', this);
  }

});

App.RequestPanel = Backbone.View.extend({
  el: $('#request_panel'),
  requestsMade: 0,
  queuedRequests: [],
  activeRequests: [],
  completedRequests: [],

  initialize: function(){},

  // Public Interface

  makeRequest: function(functionName, arguments){
    var request = this.initRequest(functionName, arguments);
    _.defer(request.call, request);
    return request;
  },

  // Private subrequests
  // granularity for requests

  // These functions will be called in the context of the request
  // They are groupings of smaller functions related to server requests
  // This is where I could load any controller function

  batchPhotoUploadRequest: function(files, newPhotoNesting, model, predecessor){
    // by convention:
    // subrequests if many - callParallel/callSerial
    // request if only one - call
    var subrequests = this.subrequests = [];
    // var request;

    // if model is new, add to predecessor
    if(model.isNew()){
      vertices = [model];
      edges = [[predecessor, model]];

      subrequests.push(
        App.requestPanel.initRequest('graphRequest',[vertices, edges])
      );
    }

    // registering creates a reference to the parent of the subrequest
    // also attached handler to request to listen to subrequest complete
    this.registerSubrequests(subrequests);

    // Call in Parallel
    this.callParallelSubrequests(subrequests);

    /* OLD CODE from before requestPanel refactor
    // initiate new subrequests
    var subrequests = _.map(files, function(file){
      return this.photoUploadRequest(file, newPhotoNesting, model);
    }, this);

    // register subrequests
    request.registerSubrequests(subrequests);

    // upload
    // request.batchView = new App.Upload.batchProgressView({'className': 'batch'});
    // App.actionPanel.$el.prepend(request.batchView.render().el);
    */

  },

  photoUploadRequest: function(file, nesting, model){
    var request = this.initRequest();
    request.requestType = 'nestedphoto';
    request.file = file;
    request.nesting = nesting;
    request.model = model;

    var time = (Math.random() * 2000) + 1000;
    setTimeout(function(){
      request.trigger('complete', request);
    }, time)

    return request;

  },

  graphRequest: function(vertices, edges){
    // this function sets up more requests
    // by convention:
    // subrequests if many - callParallel/callSerial
    // request if only one - call

    var subrequests = this.subrequests = [
      App.requestPanel.initRequest('verticesRequest',[vertices]),
      App.requestPanel.initRequest('edgesRequest',[edges])
    ]

    // Always register listeners before calling
    //this.listenTo(vertReq, 'complete', null)

    this.registerSubrequests(subrequests);
    this.callSerialSubrequests(subrequests);
  },

  verticesRequest: function(vertices){
    // test
    // this.trigger('complete', this);
    // return false;

    console.log(vertices);

    var subrequests = _.map(vertices, function(vertex){
      return App.requestPanel.initRequest('vertexRequest',[vertex]);
    }, this);

    console.log(subrequests.length);

    this.registerSubrequests(subrequests);
    this.listenTo(this, 'subrequestscomplete', function(){
      console.log('Vertices Done');
    })
    this.callParallelSubrequests(subrequests);

  },

  vertexRequest: function(vertex){
    var _cls = vertex.get('_cls')

    // client side
    var collection = App.collection[_cls];
    collection.add(vertex);

    // persistence
    vertex.save(vertex.changedAttributes(), {'success':this.complete,'error':this.error});
  },

  edgesRequest: function(edges){

    console.log(edges);
    var subrequests = _.map(edges, function(edge){
      return App.requestPanel.initRequest('edgeRequest',[edge]);
    }, this);

    this.registerSubrequests(subrequests);

    this.listenTo(this, 'subrequestscomplete', function(){
      console.log('Edges done');
    })
    this.callParallelSubrequests(subrequests);

  },

  edgeRequest: function(edge){
    var vertex = edge[0];
    console.log(vertex);
    vertex.addToSuccset(edge[1], {'success':this.complete,'error':this.error});

    console.log('added '+ vertex.get('_cls') + ' to ' + edge[1].get('_cls'));
  },

  getId: function(){
    return this.requestsMade++;
  },

  initRequest: function(functionName, arguments){
    // creates and registers the request with the master list
    // (as opposed to with the parent request)
    // purpose: to keep track of all pending or queued requests

    // create new request
    var options = options || {};
    options.content = {'func': this[functionName],'args':arguments};
    options.type = functionName;
    options.rid = this.getId();
    var request = new App.Request(options);

    // keep track of it
    this.queuedRequests.push(request);
    this.listenTo(request, 'complete', this.removeRequest);
    // automatic cleanup
    this.listenTo(request, 'subrequestscomplete', request.complete);

    // log
    //console.log('Request Init '+ request.type + ' ' + request.rid + ' created');
    return request;
  },

  removeRequest: function(request){
    console.log('Removed from master list ' + request.type + ' ' + request.rid);

    // remove from master list
    this.queuedRequests = _.without(this.queuedRequests, request);

    // remove request (backbone view)
    request.remove();
  }

})


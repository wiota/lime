/* ------------------------------------------------------------------- */
// Portphillio Admin Request Panel
/* ------------------------------------------------------------------- */

// id tag
// on success, remove them
// on error, rerun once and then flag the manager to halt requests

/* ------------------------------------------------------------------- */
// Request API
/* ------------------------------------------------------------------- */

// These functions will be called in the context of the request
  // when triggering the complete event
  // pass any variables that need to be
  // passed to the next function in serial
  // or (not implemented yet) back to the parent

App.RequestApi = {

  // Highest Level

  batchPhotoUploadRequest: function(files, newPhotoNesting, model, predecessor){
    var requestChain = [];

    // if model is new, add to predecessor
    if(model.isNew()){
      vertices = [model];
      edges = [[predecessor, model]];
      requestChain.push({'func': App.RequestApi.graphRequest, 'args': [vertices, edges]});
    }

    this.serial(requestChain);

    // request.batchView = new App.Upload.batchProgressView({'className': 'batch'});
    // App.actionPanel.$el.prepend(request.batchView.render().el);
  },

  graphRequest: function(vertices, edges){
    this.serial([
      {'func': App.RequestApi.verticesRequest, 'args': [vertices]},
      {'func': App.RequestApi.edgesRequest, 'args': [edges]}
    ]);
  },

  // High Level

  verticesRequest: function(vertices){
    this.serial(this.mapToInstructions(vertices, App.RequestApi.vertexRequest));
  },

  edgesRequest: function(edges){
    this.serial(this.mapToInstructions(edges, App.RequestApi.edgeRequest));
  },


  wrapUploadedFile: function(request, href, title){
    console.log("Callback: <a href='"+href+"'>"+title+"</a>");

    var photo = new App.Model['Vertex.Medium.Photo']({'href': href});
    var work = new App.Model['Vertex.Work']({'title':title});

     // ???????????????????????
    var predecessor = null;
     // ???????????????????????

    vertices = [photo, work];
    edges = [[work, photo], [predecessor, work]];

    var request = App.requestPanel.initRequest(
      App.RequestApi.graphRequest,
      [vertices, edges]
    );
  },

  // Lowest Level

  uploadFile: function(file){
    var request = this;

    // S3 uploader
    var uploader = new App.Uploader();
    uploader.on('complete', function(href){
      request.trigger('complete', href);
    });
    uploader.on('error', function(href){
      request.trigger('error', href);
    });
    uploader.uploadFile(file);
  },

  vertexRequest: function(vertex){
    var _cls = vertex.get('_cls')

    // client side
    var collection = App.collection[_cls];
    collection.add(vertex);

    // options
    var options = {
      success: this.callback,
      error: this.error
    }

    // persistence
    vertex.save(vertex.changedAttributes(), options);
  },

  edgeRequest: function(edge){
    // options
    var options = {
      success: this.callback,
      error: this.error
    }

    edge[0].addToSuccset(edge[1], options);
  }
}

/* ------------------------------------------------------------------- */
// Request Library
/* ------------------------------------------------------------------- */

App.RequestLibrary = {
  request: function(instrution){
    return new App.Request(instrution);
  },

  requests: function(instructions){
    return _.map(instructions, function(instruction){return this.request(instruction)}, this);
  },

  mapToInstructions: function(array, func){
    return _.map(array, function(item){return {'func': func, 'args': [item]}}, this);
  },

  serial: function(instructions, callback, error){

    // context for callback
    var context = this;

    // callback immediately if no requests
    if(!instructions || instructions.length == 0){return callback.apply(context, arguments)}

    // map object notation to request object
    var requests = this.requests(instructions);

    // last request for chaining and callback
    var lastRequest = _.last(requests);

    // Set up callback depending on request context
    var callback = callback || this.callback || function(){
      console.log('parallel complete');
      this.trigger('complete');
    }
    // set up callback to listen to last request
    this.listenTo(lastRequest, 'complete', function(){
      return callback.apply(context, arguments)
    })

    // set up latter request to listen former request and execute foremost
    _.reduceRight(_.initial(requests),
      function(r1, r2) {
        r1.listenTo(r2, 'complete', function() {
          console.log(arguments);
          r1.execute(arguments);
        })
        return r2;
      },
      lastRequest
    ).execute();
  },

  parallel: function(instructions, callback, error){
    // context for callback
    var context = this;

    // callback immediately if no instructions
    if(!instructions || instructions.length == 0){return callback.apply(context, arguments)}

    // Set up callback depending on request context
    var callback = callback || this.callback || function(){
      console.log('parallel complete');
      this.trigger('complete');
    }

    var notches = instructions.length;
    var notch = 0;

    // execute all requests
    _.each(instructions, function(instruction){
      var request = this.request(instruction);
      this.listenTo(request, 'complete', function(){
        notch++;
        if(notch>=notches){return callback.apply(context);}
      });
      request.execute.apply(request);
    }, this);
  }
}

/* ------------------------------------------------------------------- */
// Request Function
/* ------------------------------------------------------------------- */

App.Request = Backbone.View.extend({

  initialize: function(options){
    this.options = options || {};
    // Id this request
    this.rid = App.requestPanel.getId();
    // Keep track of it
    var request = this;
    App.requestPanel.register(request);
    App.requestPanel.listenTo(this, 'complete', function(){
      App.requestPanel.unregister(request);
    });
    _.bindAll(this, 'callback', 'error');
  },

  execute: function(){
    console.log('---- Executing ' + this.rid + ' -------');
    return this.options.func.apply(this, this.options.args.concat(_.toArray(arguments)));
  },

  // default callbacks, can be overriden
  callback: function(){
    args = ['complete'].concat(_.toArray(arguments));
    this.trigger.apply(this, args);
  },

  error: function(){
    args = ['error'].concat(_.toArray(arguments));
    this.trigger.apply(this, args);
  }
});

/* ------------------------------------------------------------------- */
// Request Panel
/* ------------------------------------------------------------------- */

App.RequestPanel = Backbone.View.extend({
  el: $('#request_panel'),
  requestsMade: 0,
  allRequests: [],

  initialize: function(){
    this.render();
  },

  render: function(){
    this.$el.html(this.allRequests.length);
  },

  getId: function(){
    return this.requestsMade++;
  },

  register: function(request){
    console.log('---- Register ' + request.rid + ' -------');
    this.allRequests.push(request);
    this.render();
  },

  unregister: function(request){
    console.log('---- Unregister ' + request.rid + ' -------');
    this.allRequests = _.without(this.allRequests, request);
    //request.remove();
    this.render();
  }

})


_.extend(App.RequestPanel.prototype, App.RequestLibrary);
_.extend(App.Request.prototype, App.RequestLibrary);
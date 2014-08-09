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

  batchPhotosToVertex: function(files, nesting, model, predecessor){
    var requestChain = [];

    // if model is new, add to predecessor
    if(model.isNew()){
      vertices = [model];
      edges = [[predecessor, model]];
      requestChain.push({'func': App.RequestApi.graphRequest, 'args': [vertices, edges]});
    }

    requestChain.push({'func':App.RequestApi.splitBatchPhotos, 'args': [files, nesting, model]})

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

  splitBatchPhotos: function(files, nesting, model){
    this.parallel(this.mapToInstructions(files, App.RequestApi.photoRequest, [nesting, model]))
  },

  photoRequest: function(file, nesting, model){

    this.serial([
      {'func': App.RequestApi.filePutRequest, 'args': [file]},
      {'func': App.RequestApi.wrapRequest, 'args': [file, nesting, model]}
    ]);
  },

  verticesRequest: function(vertices){
    this.serial(this.mapToInstructions(vertices, App.RequestApi.vertexRequest));
  },

  edgesRequest: function(edges){
    this.serial(this.mapToInstructions(edges, App.RequestApi.edgeRequest));
  },

  // Lower Level

  wrapRequest: function(file, nesting, model, href){
    var vertices = [];
    var edges = [];

    // content type should map to vertex types
    var lowest = new App.Model['Vertex.Medium.Photo']({"href": href});
    vertices.push(lowest);

    var highest = _.reduce(nesting, function(v1, nest){
      if(nesting == 'Vertex.Category'){var title = 'Category';}
      else {var title = App.fileToName(file.name);}
      var v2 = new App.Model[nest]({'title':title});
      vertices.push(v2);
      edges.push([v2, v1]);
      return v2;
    }, lowest);

    edges.push([model, highest]);
    this.serial([
      {'func': App.RequestApi.verticesRequest, 'args': [vertices]},
      {'func': App.RequestApi.edgesRequest, 'args': [edges]}
    ]);
  },


  // Lowest Level

  filePutRequest: function(file){
    var request = this;

    // S3 uploader
    var uploader = new App.Uploader();
    uploader.on('complete', function(href){
      request.trigger('complete', href);
    });
    uploader.on('uploadError', function(){
      console.log('error');
      request.trigger('error');
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
    console.log(edge);
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
  request: function(instruction){
    return new App.Request(instruction);
  },

  requests: function(instructions){
    return _.map(instructions, function(instruction){return this.request(instruction)}, this);
  },

  mapToInstructions: function(array, func, additionalParams){
    additionalParams = additionalParams || [];
    return _.map(array, function(item){return {'func': func, 'args': [item].concat(additionalParams)}}, this);
  },

  serial: function(instructions, callback, error){

    // context for callback
    var context = this;
    var errors = [];

    // callback immediately if no requests
    if(!instructions || instructions.length == 0){return callback.apply(context, arguments)}

    // map object notation to request object
    var requests = this.requests(instructions);

    // last request for chaining and callback
    var lastRequest = _.last(requests);

    // Set up callback depending on request context
    var callback = callback || this.callback || function(){
      console.log('serial complete');
      this.trigger('error');
    }

    var error = error || this.error || function(){
      console.log('serial error');
      this.trigger('error');
    }

    // set up callback to listen to last request
    this.listenTo(lastRequest, 'complete', function(){
      return callback.apply(context, arguments)
    })

    // set up error to listen to all requests
    _.each(requests, function(r){
      this.listenTo(r, 'error', function(){
        errors.push(r)
        return error.apply(context, errors);
      })
    }, this)

    // set up latter request to listen former request and execute foremost
    _.reduceRight(_.initial(requests),
      function(r1, r2) {
        r1.listenTo(r2, 'complete', function() {
          r1.execute.apply(r1, arguments);
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

    var error = error || this.error || function(){
      console.log('parallel error');
      this.trigger('error');
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
      this.listenTo(request, 'error', function(){
        return error.apply(context);
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
    this.sts = "created";
    // Keep track of it
    var request = this;
    App.requestPanel.register(request);
    this.sts = "registered";
    App.requestPanel.listenTo(this, 'complete', function(){
      request.sts = "complete";
      App.requestPanel.unregister(request);
      request.sts = "unregistered";
    });
    App.requestPanel.listenTo(this, 'error', function(){
      request.sts = "error";
    });
    _.bindAll(this, 'callback', 'error');
  },

  execute: function(){
    console.log('---- Executing ' + this.rid + ' -------');
    this.sts = "executing";
    return this.options.func.apply(this, this.options.args.concat(_.toArray(arguments)));
  },

  // default callbacks, can be overriden
  callback: function(){
    args = ['complete'].concat(_.toArray(arguments));
    this.trigger.apply(this, args);
  },

  error: function(){
    console.log('error');
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
  completedRequests: [],

  initialize: function(){
    this.render();
    this.initPanelInterface();
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
    this.render();
    //this.allRequests = _.without(this.allRequests, request);
    this.completedRequests.push(request);
    //request.remove();
  },

  completeById: function(){
    return _.indexBy(this.completedRequests, 'rid');
  },

  initPanelInterface: function(){
    var panel = this.$el;
    panel.on('mousedown', function(e){
      var of = e.offsetY;
      console.log(of);
      $(window).on('mousemove', function(e){
        var top = ((e.pageY - of)/$(this).height()*100) + '%';
        panel.css({'top':top})
      });
      $(window).on('mouseup', function(){
        console.log($(this).height())
        $(this).unbind('mouseup mousemove');
      });
      return false;
    })
  },

  render: function(){
    if(this.allRequests.length<=0){};
    var a = $('<div class="requestlog"></div>');
    _.each(this.allRequests, function(r){
      if(r.rid < 10){format = '&nbsp;'}
      else {format = ''}
      display = "<a class='" + r.sts + "'><span>" + format + r.rid + "</span></a>";
      a.append(display);
    })
    this.$el.children('.container').prepend(a);
  }

})


_.extend(App.RequestPanel.prototype, App.RequestLibrary);
_.extend(App.Request.prototype, App.RequestLibrary);
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



  uploadFile: function(file){
    var request = this;

    // S3 uploader
    var uploader = new App.Uploader();
    uploader.on('complete', function(href){
      request.trigger('complete', href, file.name);
    });
    uploader.uploadFile(file);
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


  batchPhotoUploadRequest: function(files, newPhotoNesting, model, predecessor){
    var requestChain = [];

    // if model is new, add to predecessor
    if(model.isNew()){
      vertices = [model];
      edges = [[predecessor, model]];
      requestChain.push({'func': App.RequestApi.graphRequest, 'args': [vertices, edges]});
    }

    this.serial(requestChain);

    // var r = App.requestPanel.serial([
    //   {'func': App.RequestApi.uploadFile, 'args': [file]},
    // ]);

    // upload
    // request.batchView = new App.Upload.batchProgressView({'className': 'batch'});
    // App.actionPanel.$el.prepend(request.batchView.render().el);

  },

  photoNestingRequest: function(file, nesting, model){
    var subrequests = this.subrequests = [];

    subrequest.push(
      App.requestPanel.initRequest(App.RequestApi.photoUploadRequest,[file])
    )
    this.registerSubrequests(subrequests);
    this.callSerialSubrequests(subrequests);
  },

  photoUploadRequest: function(file){

    // S3 uploader
    this.uploader = new App.Uploader();
    this.listenTo(this.uploader, 'complete', function(href){
      console.log('upload complete');
      //this.trigger(complete, this, href);
    });

    this.listenTo(this.uploader, 'uploadError', function(error){
      console.log(error);
    });

    this.uploader.uploadFile(this.file);
  },

  graphRequest: function(vertices, edges){
    this.serial([
      {'func': App.RequestApi.verticesRequest, 'args': [vertices]},
      {'func': App.RequestApi.edgesRequest, 'args': [edges]}
    ]);
  },

  verticesRequest: function(vertices){
    this.mapSerial(vertices, App.RequestApi.vertexRequest);
  },

  vertexRequest: function(vertex){
    var _cls = vertex.get('_cls')

    // client side
    var collection = App.collection[_cls];
    collection.add(vertex);

    // options
    var request = this;
    var options = {
      success:function(){
        request.trigger('complete');
      },
      error:function(){
        request.trigger('error');
      }
    }

    // persistence
    vertex.save(vertex.changedAttributes(), options);
  },

  edgesRequest: function(edges){
    this.mapSerial(edges, App.RequestApi.edgeRequest);
  },

  edgeRequest: function(edge){
    // options
    var request = this;
    var options = {
      success:function(){
        request.trigger('complete');
      },
      error:function(){
        request.trigger('error');
      }
    }

    edge[0].addToSuccset(edge[1], options);
  }
}

/* ------------------------------------------------------------------- */
// Request Library
/* ------------------------------------------------------------------- */

App.RequestLibrary = {
  request: function(options){
    return new App.Request(options);
  },

  parallel: function(requests, callback, error){
    _.each(requests, function(r){
      request.execute();
    })
  },

  serial: function(requests, callback, error){

    // context for callback
    var context = this;

    // callback immediately if no requests
    if(!requests || requests.length == 0){return callback.apply(context, arguments)}

    // map object notation to request object
    var requestObjects = _.map(requests, function(r){return this.request(r)}, this);

    // last request for chaining and callback
    var lastRequest = _.last(requestObjects);

    // Set up callback depending on request context
    var callback = callback || this.callback || function(){
      this.trigger('complete');
    }

    // set up callback to listen to last request
    this.listenTo(lastRequest, 'complete', function(){
      return callback.apply(context, arguments)
    })

    // set up latter request to listen former request
    // and execute foremost
    _.reduceRight(_.initial(requestObjects),
      function(r1, r2) {
        r1.listenTo(r2, 'complete', function() {
          r1.execute(_.rest(arguments));
        })
        return r2;
      },
      lastRequest
    ).execute();
  },

  mapSerial: function(array, func, callback, error){
    this.serial(_.map(
      array,
      function(item){
        return {'func': func, 'args': [item]}
      },
      this
    ));
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
  },

  execute: function(parameters){
    console.log('---- Executing ' + this.rid + ' -------');
    return this.options.func.apply(this, this.options.args.concat(parameters));
  },

  // default callbacks, can be overriden
  callback: function(){
    this.trigger('complete', arguments);
  },

  error: function(){
    this.trigger('error', arguments);
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
    request.remove();
    this.render();
  }

})


_.extend(App.RequestPanel.prototype, App.RequestLibrary);
_.extend(App.Request.prototype, App.RequestLibrary);
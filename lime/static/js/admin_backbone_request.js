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
      request.trigger('complete', request, href, file.name);
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
    console.log('Batch');
    var request = this;
    var requestChain = [];

    // if model is new, add to predecessor
    if(model.isNew()){
      vertices = [model];
      edges = [[predecessor, model]];
      requestChain.push({'func': App.RequestApi.graphRequest, 'args': [vertices, edges]});
    }

    App.requestPanel.serial(requestChain,function(){
      request.trigger('complete', request);
    });

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
    var request = this;
    App.requestPanel.serial([
      {'func': App.RequestApi.verticesRequest, 'args': [vertices]},
      {'func': App.RequestApi.edgesRequest, 'args': [edges]}
    ],
    function(){
      request.trigger('complete', request);
    });
  },

  verticesRequest: function(vertices){
    var request = this;
    var requestChain = _.map(vertices, function(vertex){
      return {'func': App.RequestApi.vertexRequest, 'args': [vertex]}
    }, this);

    App.requestPanel.serial(requestChain, function(){
      request.trigger('complete', request);
    });
  },

  vertexRequest: function(vertex){
    var request = this;
    var _cls = vertex.get('_cls')

    // client side
    var collection = App.collection[_cls];
    collection.add(vertex);

    // persistence
    vertex.save(vertex.changedAttributes(), {'success':function(){
      request.trigger('complete', request);
    },
    'error':function(){
      request.trigger('error', request);
    }});
  },

  edgesRequest: function(edges){
    var request = this;
    var requestChain = _.map(edges, function(edge){
      return {'func': App.RequestApi.edgeRequest, 'args': [edge]}
    }, this);

    App.requestPanel.serial(requestChain, function(){
      request.trigger('complete', request);
    });
  },

  edgeRequest: function(edge){
    var request = this;
    var vertex = edge[0];
    vertex.addToSuccset(edge[1], {'success':function(){
      request.trigger('complete', request);
    },
    'error':function(){
      request.trigger('error', request);
    }});
  }
}


/* ------------------------------------------------------------------- */
// Request Function
/* ------------------------------------------------------------------- */

App.Request = Backbone.View.extend({

  initialize: function(options){
    this.options = options || {};
    this.rid = this.options.rid;
  },

  execute: function(parameters){
    console.log('---- Executing ' + this.rid + ' -------');
    return this.options.func.apply(this, this.options.args.concat(parameters));
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

  request: function(options){

    // create new request
    var options = options || {};
    options.rid = this.getId();
    var request = new App.Request(options);

    // keep track of it
    this.allRequests.push(request);
    this.listenTo(request, 'complete', this.removeRequest);

    this.render();

    // automatic cleanup
    //this.listenTo(request, 'subrequestscomplete', request.complete);

    return request;

    // call it
    //console.log('Called '+ request.rid)
    //return func.apply(request, arguments);

  },

  parallel: function(requests){
    _.each(requests, function(r){
      request.execute();
    })
  },

  serial: function(requests, callback, error){
    if(!requests || requests.length == 0){
      return callback();
    }
    var requestObjects = _.map(requests, function(r){return this.request(r)}, this);
    var lastRequest = _.last(requestObjects);
    var callback = callback || function(){
      // need access to calling context
      console.log('Serial Complete')
    }
    this.listenTo(lastRequest, 'complete', function(){return callback()})

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

  removeRequest: function(request){
    console.log('removed request '+ request.rid);
    // remove from master list
    this.allRequests = _.without(this.allRequests, request);
    this.render();
    // remove request (backbone view)
    request.remove();
  }

})


/* ------------------------------------------------------------------- */
// Request API
/* ------------------------------------------------------------------- */

// These functions will be called in the context of the request
  // when triggering the complete event
  // pass any variables that need to be
  // passed to the next function in serial
  // or (not implemented yet) back to the parent

App.RequestApi = {

  // Highest Level - Public

  batchPhotosToVertex: function(files, nesting, model, predecessor){
    var requestChain = [];

    // if model is new, add to predecessor
    if(model.isNew()){
      vertices = [model];
      edges = [[predecessor, model]];
      requestChain.push({'func': 'graphRequest', 'args': [vertices, edges]});
    }

    requestChain.push({'func':'splitBatchPhotos', 'args': [files, nesting, model]})

    this.serial(requestChain);

    // request.batchView = new App.Upload.batchProgressView({'className': 'batch'});
    // App.actionPanel.$el.prepend(request.batchView.render().el);
  },

  graphRequest: function(vertices, edges){
    this.serial([
      {'func': 'createVerticesRequest', 'args': [vertices]},
      {'func': 'createEdgesRequest', 'args': [edges]}
    ]);
  },

  uploadCoverPhoto: function(file, model){
    this.serial([
      {'func': 'filePutRequest', 'args': [file]},
      {'func': 'wrapCover', 'args': []},
      {'func': 'setCover', 'args': [model]}
    ])
  },

  setCover: function(vertex, cover){
    var options = {
      success: this.callback,
      error: this.error
    }

    vertex.setCover([cover], options);
  },

  // High Level

  splitBatchPhotos: function(files, nesting, model){
    this.parallel(this.mapToInstructions(files, ['photoRequest'], [nesting, model]))
  },

  photoRequest: function(file, nesting, model){

    this.serial([
      {'func': 'filePutRequest', 'args': [file]},
      {'func': 'wrapVertex', 'args': [file, nesting, model]}
    ]);
  },

  createVerticesRequest: function(vertices){
    this.serial(this.mapToInstructions(vertices, ['createVertexRequest']));
  },

  createEdgesRequest: function(edges){
    this.serial(this.mapToInstructions(edges, ['createEdgeRequest']));
  },

  // Lower Level

  wrapCover: function(href){
    var photo = new App.Model['Vertex.Medium.Photo']({"href": href, 'resize_href': file.name});
    this.serial([{'func':'createVertexRequest', 'args':[photo]}]);
  },

  wrapVertex: function(file, nesting, model, href){
    var vertices = [];
    var edges = [];

    // content type should map to vertex types
    var lowest = new App.Model['Vertex.Medium.Photo']({"href": href, 'resize_href': file.name});
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
      {'func': 'createVerticesRequest', 'args': [vertices]},
      {'func': 'createEdgesRequest', 'args': [edges]}
    ]);
  },


  // Lowest Level

  filePutRequest: function(file){
    var request = this;

    // testing
    // if(Math.random()<.5){
    //   request.trigger('error');
    //   return false;
    // }

    // S3 uploader
    var uploader = new App.Uploader();
    uploader.on('complete', function(href){
      request.trigger('complete', href);
    });
    uploader.on('uploadError', function(){
      request.trigger('error');
    });
    uploader.uploadFile(file);
  },

  createVertexRequest: function(vertex){
    var _cls = vertex.get('_cls')

    // client side
    var collection = App.collection[_cls];
    collection.add(vertex);

    // options
    var options = {
      success: this.callback,
      error: function(){
        this.trigger('error');
        vertex.modified = true;
      }
    }

    // persistence
    vertex.save({}, options);
  },

  createEdgeRequest: function(edge){
    // options
    var options = {
      success: this.callback,
      error: this.error
    }

    edge[0].addEdgeTo(edge[1], options);
  },

  removeEdgeRequest: function(edge){
    var options = {
      success: this.callback,
      error: this.error
    }

    edge[0].removeEdgeTo(edge[1], options);
  },

  updateVertexRequest: function(vertex){
    var options = {
      success: this.callback,
      error: this.error
    }
    vertex.saveAttributes({}, options);
  }

}
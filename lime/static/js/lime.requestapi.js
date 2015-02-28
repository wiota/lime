/* ------------------------------------------------------------------- */
// Request API
/* ------------------------------------------------------------------- */


LIME.RequestApi = {

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

    // request.batchView = new LIME.Upload.batchProgressView({'className': 'batch'});
    // LIME.actionPanel.$el.prepend(request.batchView.render().el);
  },

  graphRequest: function(vertices, edges){
    this.serial([
      {'func': 'createVerticesRequest', 'args': [vertices]},
      {'func': 'createEdgesRequest', 'args': [edges]}
    ]);
  },

  uploadCoverPhoto: function(file, vertex){
    this.serial([
      {'func': 'filePutRequest', 'args': [file]},
      {'func': 'setCover', 'args': [vertex, file]}
    ])
  },

  setCover: function(vertex, file, name){
    var coverObj = [{"href": "/image/"+name}];
    var options = {
      success: this.callback,
      error: this.error
    }

    vertex.setCover(coverObj, options);
  },

  removeCover: function(vertex){
    var coverObj = [];
    var options = {
      success: this.callback,
      error: this.error
    }

    vertex.setCover(coverObj, options);
  },

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


  wrapVertex: function(file, nesting, model, name){
    var vertices = [];
    var edges = [];

    // content type should map to vertex types
    var lowest = new LIME.Model['Vertex.Medium.Photo']({"href": "/image/"+name, "vertex_type": "photo"});
    vertices.push(lowest);

    /*
    var highest = _.reduce(nesting, function(v1, nest){
      if(nesting == 'Vertex.Category'){var title = 'Category';}
      else {var title = LIME.fileToName(file.name);}
      var v2 = new LIME.Model[nest]({'title':title, 'cover':[{"href": "/image/"+name}]});
      vertices.push(v2);
      edges.push([v2, v1]);
      return v2;
    }, lowest);
    */

    edges.push([model, lowest]);
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

    var arr = file.name.split('.');
    var ext = arr.pop();
    var name = arr.join('.') + '_' + Date.now() + '.' + ext;

    // S3 uploader
    var uploader = new LIME.Uploader();
    uploader.on('complete', function(href){
      request.trigger('complete', name);
    });
    uploader.on('uploadError', function(){
      request.trigger('error');
    });
    uploader.uploadFile(file, {"name": name});
  },

  createVertexRequest: function(vertex){
    var request = this;

    // client side
    LIME.collection.Vertex.add(vertex);

    // options
    var options = {
      success: this.callback,
      error: function(){
        request.trigger('error');
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
    vertex.saveAttributes(options);
  }

}
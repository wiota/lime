// requires
// Underscore.js
// Backbone.js
// LIME.Models
// LIME.Collection

(function(LIME){


  var stack = LIME.stack = {

    createMedium: function(file){
      var allowed = {
        //"video/quicktime": "video",
        //"image/vnd.adobe.photoshop": ""
        "audio/mp3": "audio",
        "image/svg+xml": "photo",
        "image/gif": "photo",
        "image/jpeg": "photo",
        "audio/mp3": "audio",
        "application/pdf": "pdf",
        "image/png": "photo"
      }
      if(allowed[file.type]){
        return new LIME.Model.Medium({}, {fileRef:file, accepted: true});
      } else {
        return {accepted: false, fileRef: file}
      }
    },

    batchMedia: function(files){
      media = _.map(files, stack.createMedium);
      //var map = _.map(media, function(m){return m.fileRef})
      //console.log(map);
    },

    createVertex: function(attributes){
      return new LIME.Model.Vertex(attributes);
    },

    updateVertex: function(v){
      var options = {
        success: function(){
          console.log(v.id + ' vertex updated')
        },
        error: function(){
          console.log(v.id + ' vertex failed')
        }
      }
      v.saveAttributes(options);
    },

    createEdge: function(v1, v2){},

    deleteEdge: function(v1, v2){},

    addToGraph: function(vertices, edges, callback){
      var callback = callback || function(){}
      // add vertices
      async.reject(vertices, stack.addVertex, function(rejects){
        if(rejects.length > 0){
          //stack.addToGraph(rejects, edges, callback); // rerun command with rejected vertices
        } else {
          // add edges
          async.reject(edges, stack.addEdge, function(rejects){
            if(rejects.length > 0){
              //stack.addToGraph({}, rejects, callback); // rerun command with rejected edges
            } else {
              callback()
            }
          })
        }
      });
    },

    addVertex: function(vertex, callback){
      // options
      var options = {
        success: function(){
          // add vertex to local collection
          LIME.collection.Vertex.add(vertex);
          callback(true);
        },
        error: function(){
          callback(false);
        }
      }

      // add vertex to db
      vertex.save({}, options);

      // test
      // stack.asyncTest(vertex, callback);
    },

    addEdge: function(edge, callback){
      // add edge locally and at server
      var options = {
        success: function(){
          callback(true);
        },
        error: function(){
          callback(false);
        }
      }

      edge[0].addEdgeTo(edge[1], options);

      // test
      // stack.asyncTest(edge, callback);
    },

    // testing
    asyncTest: function(obj, cb){
      // waits between 1-2 seconds and returns an err at some frequency
      var err = null;
      var err2 = '';
      var truth = true;
      var errFreq = 20;
      var minDelay = 1000;
      var variance = 1000;

      if(Math.random()<(errFreq/100)){
        err2 = 'x';
        err = "Testing Error";
        truth = false;
      }
      var time = Math.random()*variance + minDelay;
      console.log("Start "+ obj.get('title') + " time " + time + " " + err2);
      setTimeout(function(){
        cb(truth);
      }, time);
    },

    add1: function(number){
      da = {vertex_type: 'work', title: 'Test Work'}
      var nv = _.map([da,da,da,da,da], stack.createVertex);
      var ne = [];
      stack.addToGraph(nv);
    },

    add5: function(number){
      var nv = _.map([
        {vertex_type: 'work', title: "Test work 1"},
        {vertex_type: 'work', title: "Test work 2"},
        {vertex_type: 'work', title: "Test work 3"},
        {vertex_type: 'work', title: "Test work 4"}
      ], stack.createVertex);
      var ne = [];
      stack.addToGraph(nv, ne, function(){console.log('add5 done')});
    }



  }

})(LIME);
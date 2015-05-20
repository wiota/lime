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
        //"audio/mp3": "audio",
        "image/svg+xml": "photo",
        "image/gif": "photo",
        "image/jpeg": "photo",
        //"application/pdf": "pdf",
        "image/png": "photo"
      }
      var type = null;
      if(type = allowed[file.type]){
        return new LIME.Model.Medium({vertex_type: type}, {fileRef:file, accepted: true});
      } else {
        return {accepted: false, fileRef: file}
      }
    },

    batchMedia: function(files, v){
      var media = _.map(files, stack.createMedium);
      var accepted = _.filter(media, function(m){ return m.accepted });
      var rejected = _.filter(media, function(m){ return !m.accepted });
      var edges = _.map(accepted, function(m){ return [v, m]; });

      stack.addToGraph(accepted, edges);
      if(rejected.length > 0){
        console.warn(_.reduce(rejected, function(memo, val, index){ return memo += ' [' + val.fileRef.name; + ']'; }, 'The following files were rejected: '));
      }
    },

    createVertex: function(attributes, options){
      return new LIME.Model.Vertex(attributes, options);
    },

    modifyVertex: function(v, changes){
      v.set(changes);
      return v;
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
      async.reject(vertices, stack.addVertex, function(rejected){
        if(rejected.length > 0){
          console.warn(rejected.length +' vertices failed to be added');
          //stack.addToGraph(rejected, edges, callback); // rerun command with rejected vertices
        } else {
          // add edges
          async.reject(edges, stack.addEdge, function(rejected){
            if(rejected.length > 0){
              console.warn(rejected.length +' edges failed to be added');
              //stack.addToGraph({}, rejected, callback); // rerun command with rejected edges
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
    }
  }

})(LIME);
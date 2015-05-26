// requires
// Underscore.js
// Backbone.js
// LIME.Models
// LIME.Collection

(function(LIME){


  var stack = LIME.stack = {

    createMedium: function(file){
      var allowed = {
        // "video/quicktime": "video",
        // "image/vnd.adobe.photoshop": ""
        // "image/svg+xml": "photo",
        // "application/pdf": "pdf",
        "audio/x-m4a": "audio",
        "audio/mp3": "audio",
        "image/gif": "photo",
        "image/jpeg": "photo",
        "image/png": "photo"
      }
      var type = null;
      if(type = allowed[file.type]){
        return new LIME.Model.Medium({vertex_type: type, href: file, title: file.name}, {accepted: true});
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
        console.warn(_.reduce(rejected, function(memo, val, index){ return memo += '\n[' + val.fileRef.name + " " + val.fileRef.type + '] '; }, 'The following files were rejected: '));
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
      v.save({}, options);
    },

    createEdge: function(v1, v2){},

    deleteEdge: function(v1, v2){},

    addToGraph: function(vertices, edges, callback){
      // may not need async stuff here
      var callback = callback || function(){}
      // add vertices
      async.reject(vertices, stack.addVertex, function(rejected){
        if(rejected.length > 0){
          console.warn(rejected.length +' vertices failed to be added');
          //stack.addToGraph(rejected, edges, callback); // rerun command with rejected vertices
        }
      });

      // add edges locally, rely on model to await model ids
      // edges are controlled locally by the initial vertex, or the first in the pair
      async.reject(edges, stack.addEdge, function(rejected){
        if(rejected.length > 0){
          console.warn(rejected.length +' edges failed to be added');
          //stack.addToGraph({}, rejected, callback); // rerun command with rejected edges
        } else {
          callback()
        }
      })
    },

    // Add vertex remotely
    addVertex: function(vertex, callback){

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

    // Add edge locally and remotely
    addEdge: function(edge, callback){

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
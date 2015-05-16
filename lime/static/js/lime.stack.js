// requires
// Underscore.js
// Backbone.js
// LIME.Models

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

    addToGraph: function(vertices, edges){
      // add vertices
      _.map(vertices, stack.addVertex);
      // save edges
      _.map(edges, stack.addEdge);
    },

    addVertex: function(cb, vertex){
      // add vertex to local collection and server
      // test
      stack.asyncTest(function(){ console.log('vertex added') });
    },

    addEdge: function(cb, vertex){
      // add edge locally and at server
      // test
      stack.asyncTest(function(){ console.log('edge added') });
    },

    // testing

    asyncTest: function(cb){
      var time = Math.random()*2000 + 500;
      setTimeout(_.bind(cb, null, true), time);

    test1: function(number){
      da = {vertex_type: 'work'}
      var nv = _.map([da,da,da,da,da], stack.createVertex);
      var ne = [];
      stack.addToGraph(nv);
    }



  }

})(LIME);
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
      return LIME.Model.Vertex(attributes);
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

  }

})(LIME);
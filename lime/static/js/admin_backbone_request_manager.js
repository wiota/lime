/* ------------------------------------------------------------------- */
// Portphillio Admin Request Manager
/* ------------------------------------------------------------------- */

App.RequestManager = {};

App.RequestPanel = Backbone.View.extend({
  el: $('#request_panel'),

  initialize: function(){

  },

  // don't want to have batchItemView here
  // trigger events and register handlers instead
  batchRequest: function(vertices, edges, batchItemView){
    this.persistBatchedVertices(vertices, edges, batchItemView);
  },

  persistBatchedVertices: function(vertices, edges, batchItemView){
    var unidentified_vertices = 0;
    var complete = function(){
      if(unidentified_vertices <= 0){
        return true;
      }
      return false;
    }

    // add vertices
    _.each(vertices, function(model){
      unidentified_vertices++;
      var _cls = model.get('_cls')
      //var vertex = batchItemView.noteVertexCreation(App.clsToClass(_cls));
      var collection = App.collection[_cls];
      collection.add(model);
      model.save();

      // sync
      this.listenToOnce(model, 'sync', function(){
        //batchItemView.noteVertexSync(vertex);
        unidentified_vertices--;
        if(complete()){
          this.addBatchEdges(vertices, edges, batchItemView);
        }
      }, this);
      // error
      this.listenToOnce(model, 'error', function(){
        batchItemView.error();
        console.log('vertex save error' + model.get('title'));
      }, this);
    }, this)
    // this.addBatchEdges(vertices, edges, batchItemView);

  },

  addBatchEdges: function(vertices, edges, batchItemView){
    // batchItem visual update
    batchItemView.$el.addClass('edges');
    var missing_edges = 0;
    var edgesComplete = function(callback){
      if(missing_edges <= 0){
        return true;
      }
      return false;
    }

    // add edges
    _.each(edges, function(set){
      missing_edges++;
      var model = set[0];
      model.addToSuccset(set[1]);
      console.log('added '+ model.get('_cls') + ' to ' + set[1].get('_cls'));
      // sync
      this.listenToOnce(model, 'sync', function(){
        missing_edges--;
        if(edgesComplete()){
          batchItemView.collapse();
        }
      }, this);
      // error
      this.listenToOnce(model, 'error', function(){
        console.log('edge save error' + model.get('title'));
        batchItemView.error();
      }, this);
    }, this);
  },


  simpleRequest: function(){

  },

  display: function(message){
    this.$el.html(message);
  }

})


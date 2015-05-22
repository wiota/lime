/* ------------------------------------------------------------------- */
// LIME Vertex Collection
// requires Backbone.js, Underscore.js, jQuery
/* ------------------------------------------------------------------- */

LIME.Collection = {};

LIME.Collection.Vertex = Backbone.Collection.extend({
  model: LIME.Model.Vertex,

  initialize: function(){
    _.bindAll(this, 'added');
    this.on('add', this.added);
  },

  added: function(model, collection){},

  // This function returns a model instance and
  // initiates a deepen call on the model if necessary
  lookup: function(id, vertexType){
    var vertex = this.get(id) || this.getEmpty(id, vertexType);

    if(!vertex.isFetched() || !vertex.isDeep()){
      return vertex.deepen();
    } else {
      return vertex;
    }
  },

  getEmpty: function(id, vertexType){
    return new this.model({'_id': id, 'vertex_type': vertexType}, {vertexType: vertexType});
  }

});

/* ------------------------------------------------------------------- */
// Collection instance
/* ------------------------------------------------------------------- */

LIME.collection = {};
LIME.collection.Vertex = new LIME.Collection.Vertex();


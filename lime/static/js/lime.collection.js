/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Collections
/* ------------------------------------------------------------------- */

LIME.Collection = {};

/* ------------------------------------------------------------------- */
// Vertex Collection - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

LIME.Collection['Vertex'] = Backbone.Collection.extend({
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
    return new this.model({'_id': id, 'vertex_type': vertexType});
  },

  // should be replaced by edge/vertex list
  createAndAddTo: function(data, predecessor){
    alert("Shouldn't be used!");
    console.log("Shouldn't be used!");
    var model = this.create(data);
    model.once('sync', function(model, response, options){
      predecessor.addToSuccset(model)
    });
    model.once('error', function(){
      this.off('sync');
    })
    return model;
  }

});

// The Body and the Happenings might be better as two items in the succset of the Host

LIME.Collection['Vertex.Apex.Body'] = LIME.Collection['Vertex'].extend({ // Unique - only contains one body - may be changed to start vertex
  model: LIME.Model['Vertex.Apex.Body'],
  _cls: 'Vertex.Apex.Body',
  body: null,

  lookup: function(){
    var body = this.get() || this.getEmpty();

    if(!body.isFetched()){
      return body.deepen();
    } else {
      return body;
    }
  },

  // allows adding to replace singular collection
  // should be tweaked when all are added to a single collection
  add: function(model){
    this.body = model;
  },

  get: function(){
    return this.body;
  },

  getEmpty: function(){
    return new this.model({'vertex_type': 'body'});
  }
});

LIME.Collection['Vertex.Apex.Happenings'] = LIME.Collection['Vertex'].extend({
  model: LIME.Model['Vertex.Apex.Happenings'],
  _cls: 'Vertex.Apex.Happenings',
  happenings: null,

  lookup: function(){
    var happenings = this.get() || this.getEmpty();

    if(!happenings.isFetched()){
      return happenings.deepen();
    } else {
      return happenings;
    }
  },

  // allows adding to replace singular collection
  // should be tweaked when all are added to a single collection
  add: function(model){
    this.happenings = model;
  },

  get: function(){
    return this.happenings;
  },

  getEmpty: function(){
    return new this.model({'vertex_type': 'happenings'});
  }
});

/* ------------------------------------------------------------------- */
// Collection instances
/* ------------------------------------------------------------------- */

LIME.collection = {};
LIME.collection.Vertex = new LIME.Collection['Vertex'];
LIME.collection['Vertex.Apex.Body'] = new LIME.Collection['Vertex.Apex.Body']();
LIME.collection['Vertex.Apex.Happenings'] = new LIME.Collection['Vertex.Apex.Happenings']();


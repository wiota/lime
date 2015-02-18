/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Collections
/* ------------------------------------------------------------------- */

LIME.Collection = {};

/* ------------------------------------------------------------------- */
// Vertex Collection - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

LIME.Collection['Vertex'] = Backbone.Collection.extend({
  model: LIME['Vertex'],
  _cls: 'Vertex',
  formUrl: null,
  formSerialization: null,

  initialize: function(){
    _.bindAll(this, 'added');
    this.on('add', this.added);
    this.formUrl = this.url + "form/";
  },

  added: function(model, collection){},

  // This function returns a model instance and
  // initiates a deepen call on the model if necessary
  lookup: function(id){
    var vertex = this.get(id) || this.getEmpty(id);

    if(!vertex.isFetched() || !vertex.isDeep()){
      return vertex.deepen();
    } else {
      return vertex;
    }
  },

  getEmpty: function(id){
    if(id){
      return new this.model({'_id': id, '_cls': this._cls});
    } else {
      return new this.model({'_cls': this._cls});
    }
  },

  // should be replaced by edge/vertex list
  createAndAddTo: function(data, predecessor){
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

LIME.Collection['Vertex.Category'] = LIME.Collection['Vertex'].extend({
  model: LIME.Model['Vertex.Category'],
  url: "api/v1/category/",
  _cls: 'Vertex.Category'
});

LIME.Collection['Vertex.Work'] = LIME.Collection['Vertex'].extend({
  model: LIME.Model['Vertex.Work'],
  url: "api/v1/work/",
  _cls: 'Vertex.Work'
});

LIME.Collection['Vertex.Medium.Photo'] = LIME.Collection['Vertex'].extend({
  model: LIME.Model['Vertex.Medium.Photo'],
  url: "api/v1/photo/",
  _cls: 'Vertex.Medium.Photo'
});

LIME.Collection['Vertex.Happening'] = LIME.Collection['Vertex'].extend({
  model: LIME.Model['Vertex.Happening'],
  url: "api/v1/happening/",
  _cls: 'Vertex.Happening'
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

  add: function(model){
    this.body = model;
  },

  get: function(){
    return this.body;
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

  add: function(model){
    this.happenings = model;
  },

  get: function(){
    return this.happenings;
  }
});

/* ------------------------------------------------------------------- */
// Collection instances
/* ------------------------------------------------------------------- */

LIME.collection = {};

// Eventually will become collection for all vertices - customVertex
LIME.collection['Vertex'] = new LIME.Collection['Vertex'];

LIME.collection['Vertex.Apex.Body'] = new LIME.Collection['Vertex.Apex.Body']();
LIME.collection['Vertex.Apex.Happenings'] = new LIME.Collection['Vertex.Apex.Happenings']();
LIME.collection['Vertex.Category'] = new LIME.Collection['Vertex.Category']();
LIME.collection['Vertex.Work'] = new LIME.Collection['Vertex.Work']();
LIME.collection['Vertex.Medium.Photo'] = new LIME.Collection['Vertex.Medium.Photo']();
LIME.collection['Vertex.Happening'] = new LIME.Collection['Vertex.Happening']();

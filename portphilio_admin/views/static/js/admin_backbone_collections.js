/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Collections
/* ------------------------------------------------------------------- */

App.Collection = {};

/* ------------------------------------------------------------------- */
// Vertex Collection - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

App.Collection['Vertex'] = App.VertexCollection = Backbone.Collection.extend({
  model: App.Vertex,
  _cls: 'Vertex',

  initialize: function(){
    _.bindAll(this, "added");
    this.on('add', this.added);
  },

  added: function(model, collection){
    // console.log("Added " + model.get('_cls') + " " + model.get("title").substr(0, 20));
  },

  // This function returns a model instance and
  // initiates a deepen call on the model if necessary
  lookup: function(id){
    var succset = this.get(id) || this.getEmpty(id);
    //console.log(succset.isFetched() + " " + succset.isDeep());
    if(!succset.isFetched() || !succset.isDeep()){
      return succset.deepen();
    } else {
      return succset;
    }
  },

  getEmpty: function(id){
    // This should return a blank vertex
    // The vertex should have enough information
    // to fill the template
    return new this.model({'_id': id, '_cls': this._cls, 'title': ''});
  }
});

App.Collection['Vertex.Category'] = App.CategoryCollection = App.VertexCollection.extend({
  model: App.Category,
  url: "api/v1/category",
  _cls: 'Vertex.Category'
});

App.Collection['Vertex.Work'] = App.WorkCollection = App.VertexCollection.extend({
  model: App.Work,
  url: "api/v1/work",
  _cls: 'Vertex.Work'
});

App.Collection['Vertex.Photo'] = App.PhotoCollection = App.VertexCollection.extend({
  model: App.Photo,
  url: "api/v1/photo",
  _cls: 'Vertex.Medium.Photo',

  added: function(model, collection){
    //console.log("Added " + model.get('_cls'));
  }
});

App.Collection['Vertex.Body'] = App.BodyCollection = App.VertexCollection.extend({ // Unique - only contains one body - may be changed to start vertex
  model: App.Portfolio,
  _cls: 'Vertex.Body',
  portfolio: null,

  initialize: function(){
    return this;
  },

  lookup: function(){
    var portfolio = this.portfolio = this.get() || this.getEmpty();
    if(!portfolio.isFetched()){
      return portfolio.deepen();
    } else {
      return portfolio;
    }
  },

  add: function(model){
    // noop
    console.log("Added " + model.get('_cls'));
  },

  get: function(){
    return this.portfolio;
  }
});

/* ------------------------------------------------------------------- */
// Collection instances
/* ------------------------------------------------------------------- */

App.collection = {};

App.collection['Vertex.Body'] = App.portfolioStorage = new App.BodyCollection();
App.collection['Vertex.Category'] = App.categoryStorage = new App.CategoryCollection();
App.collection['Vertex.Work'] = App.workStorage = new App.WorkCollection();
App.collection['Vertex.Medium.Photo'] = App.photoStorage = new App.PhotoCollection();
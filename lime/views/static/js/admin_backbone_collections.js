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
  formUrl: null,
  formSerialization: null,

  initialize: function(){
    _.bindAll(this, 'added');
    this.on('add', this.added);
    this.formUrl = this.url + "form/";
  },

  added: function(model, collection){
    msg.log("ADD " + model.get('_id') + " " + model.get("title") + " to " + collection._cls,'model');
  },

  // This function returns a model instance and
  // initiates a deepen call on the model if necessary
  lookup: function(id){
    var vertex = this.get(id) || this.getEmpty(id);
    msgExtra = "";
    msgExtra += vertex.isFetched() ? "<b>FETCHED</b> " : "";
    msgExtra += vertex.isDeep() ? "<b>DEEP</b>" : "";
    msg.log("Lookup: " + id + " " + vertex.get('title') + " " + msgExtra, 'lookup');

    if(!vertex.isFetched() || !vertex.isDeep()){
      return vertex.deepen();
    } else {
      return vertex;
    }
  },

  getEmpty: function(id){
    // Title is blank to temporarily solve template problems
    return new this.model({'_id': id, '_cls': this._cls, 'title': ''});
  },

  hasForm: function(){
    if(!this.formSerialization){
      return false;
    } else {
      return true;
    }
  },

  // timeouts? What to do if form does not load?
  fetchForm: function(){
    msg.log("Fetching Form " + this.formUrl);
    $.ajax({
      type: 'GET',
      url: this.formUrl,
      // type of data we are expecting in return:
      dataType: 'json',
      timeout: 1000,
      context: this,
      success: function(data){
        this.formSerialization = data;
        this.trigger("hasForm");
      },
      error: function(){
        console.log('Form get error');
      }

    })
  },

  lookupForm: function(){
    this.fetchForm();
  },

  createAndAddTo: function(data, predecessor){
    var model = this.create(data, {'wait':true});
    model.once('sync', function(model, response, options){
      predecessor.addToSuccset(model)
    });
    return model;
  }

});

App.Collection['Vertex.Category'] = App.CategoryCollection = App.VertexCollection.extend({
  model: App.Category,
  url: "api/v1/category/",
  _cls: 'Vertex.Category'
});

App.Collection['Vertex.Work'] = App.WorkCollection = App.VertexCollection.extend({
  model: App.Work,
  url: "api/v1/work/",
  _cls: 'Vertex.Work'
});

App.Collection['Vertex.Photo'] = App.PhotoCollection = App.VertexCollection.extend({
  model: App.Photo,
  url: "api/v1/photo/",
  _cls: 'Vertex.Medium.Photo'
});

App.Collection['Vertex.Body'] = App.BodyCollection = App.VertexCollection.extend({ // Unique - only contains one body - may be changed to start vertex
  model: App.Portfolio,
  _cls: 'Vertex.Body',
  portfolio: null,

  lookup: function(){
    var portfolio = this.get() || this.getEmpty();
    msgExtra = "";
    msgExtra += portfolio.isFetched() ? "<b>FETCHED</b> " : "";
    msgExtra += portfolio.isDeep() ? "<b>DEEP</b> " : "";
    msg.log("Lookup: Body " + msgExtra, 'lookup');

    if(!portfolio.isFetched()){
      return portfolio.deepen();
    } else {
      return portfolio;
    }
  },

  add: function(model){
    this.portfolio = model;
    msg.log("Added Body",'model');
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

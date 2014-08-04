/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Collections
/* ------------------------------------------------------------------- */

App.Collection = {};

/* ------------------------------------------------------------------- */
// Vertex Collection - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

App.Collection['Vertex'] = Backbone.Collection.extend({
  model: App['Vertex'],
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
  fetchForm: _.throttle(function(){
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
        this.fetchForm();
      }

    })
  }, 1000),

  lookupForm: function(){
    this.fetchForm();
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

App.Collection['Vertex.Category'] = App.Collection['Vertex'].extend({
  model: App.Model['Vertex.Category'],
  url: "api/v1/category/",
  _cls: 'Vertex.Category'
});

App.Collection['Vertex.Work'] = App.Collection['Vertex'].extend({
  model: App.Model['Vertex.Work'],
  url: "api/v1/work/",
  _cls: 'Vertex.Work'
});

App.Collection['Vertex.Medium.Photo'] = App.Collection['Vertex'].extend({
  model: App.Model['Vertex.Medium.Photo'],
  url: "api/v1/photo/",
  _cls: 'Vertex.Medium.Photo'
});

App.Collection['Vertex.Apex.Body'] = App.Collection['Vertex'].extend({ // Unique - only contains one body - may be changed to start vertex
  model: App.Model['Vertex.Apex.Body'],
  _cls: 'Vertex.Apex.Body',
  body: null,

  lookup: function(){
    var body = this.get() || this.getEmpty();
    msgExtra = "";
    msgExtra += body.isFetched() ? "<b>FETCHED</b> " : "";
    msgExtra += body.isDeep() ? "<b>DEEP</b> " : "";
    msg.log("Lookup: Body " + msgExtra, 'lookup');

    if(!body.isFetched()){
      return body.deepen();
    } else {
      return body;
    }
  },

  add: function(model){
    this.body = model;
    msg.log("Added Body",'model');
  },

  get: function(){
    return this.body;
  }
});

/* ------------------------------------------------------------------- */
// Collection instances
/* ------------------------------------------------------------------- */

App.collection = {};

App.collection['Vertex.Apex.Body'] = App.bodyStorage = new App.Collection['Vertex.Apex.Body']();
App.collection['Vertex.Category'] = App.categoryStorage = new App.Collection['Vertex.Category']();
App.collection['Vertex.Work'] = App.workStorage = new App.Collection['Vertex.Work']();
App.collection['Vertex.Medium.Photo'] = App.photoStorage = new App.Collection['Vertex.Medium.Photo']();

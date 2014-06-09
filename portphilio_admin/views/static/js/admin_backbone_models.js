/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Models
/* ------------------------------------------------------------------- */

App.Model = {};

/* ------------------------------------------------------------------- */
// App Model Overrides
/* ------------------------------------------------------------------- */

Backbone.Model.prototype.parse = function(response){
  if(response.result);
  return response.result;
};

Backbone.Model.prototype.idAttribute = "_id";

/* ------------------------------------------------------------------- */
// Vertex - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

App.Model['Vertex'] = App.Vertex = Backbone.Model.extend({
  formSerialization: null,
  formUrl: null,

  initialize: function(){
    this.formUrl = this.urlRoot + "form/";
    this.set({'_cls': this._cls});
    this.fetched = false;
    this.deep = false;
    //_.bindAll(this, 'triggerEvents');
    this.on('change', this.triggerEvents);
  },

  triggerEvents: function(model, options){
    console.log('change')
    var attr = model.changedAttributes()
    var summary_attr = _.omit(attr, 'succset');

    console.log(_.keys(attr));

    if(!_.isEmpty(summary_attr)){
      this.trigger('summaryChanged', this, {'attr':summary_attr});
    }

  },

  isFetched: function(){
    return this.fetched;
  },

  isDeep: function(){
    return this.deep;
  },

  deepen: function(){
    console.log('deepen');
    this.fetch({
      success: this.deepenSuccess,
      error: this.deepenError
    });
    return this;
  },

  deepenSuccess: function(model, response, options){
    console.log("Fetched "+model.get("_cls"));
    var collection = App.collection[model.get('_cls')];
    collection.add(model);
    model.fetched = true;
    // not considered deep until referenced
    model.reference();
  },

  deepenError: function(model, response, options){
    console.log("Fetch unsucessful " + response);
  },

  reference: function(){
    var succset = this.get('succset');
    var succsetReferences = [];

    _.each(succset, function(succsetitem){

      var modelFactory = App.Model[succsetitem._cls];
      var model = new modelFactory(succsetitem);
      model.deep = false;
      model.fetched = true;
      var collection = App.collection[succsetitem._cls];
      collection.add(model);

      succsetReferences.push(model);

    })
    this.set({'succset': succsetReferences});

    this.deep = true;
    this.trigger('referenced');
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
    console.log("Fetching Form " + this.formUrl);
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

  saveVertex: function(){
    var list = this.get('succset');

    var options = {
      'url': this.url() + '/succset/',
      'contentType' : "application/json",
      'data': JSON.stringify({'succset' : _.pluck(list, 'id')})
    }

    Backbone.sync('update', this, options)
  }


});

/* ------------------------------------------------------------------- */
// Category
/* ------------------------------------------------------------------- */

App.Model['Vertex.Category'] = App.Category = App.Vertex.extend({
  urlRoot: "api/v1/category/",
  _cls: "Vertex.Category"
});

/* ------------------------------------------------------------------- */
// Work
/* ------------------------------------------------------------------- */

App.Model['Vertex.Work'] = App.Work = App.Vertex.extend({
  urlRoot: "api/v1/work/",
  _cls: "Vertex.Work"
});

/* ------------------------------------------------------------------- */
// Tag
/* ------------------------------------------------------------------- */

App.Model['Vertex.Tag'] = App.Tag = Backbone.Model.extend({
  urlRoot: "api/v1/tag/",
  _cls: "Vertex.Tag"
});

/* ------------------------------------------------------------------- */
// Medium - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

App.Model['Vertex.Medium'] = App.Medium = App.Vertex.extend({
  _cls: "Vertex.Medium",

  initialize: function(){
    this.formUrl = null;
    this.set({'_cls': this._cls});
    this.fetched = false;
    this.deep = false;
  }
});

/* ------------------------------------------------------------------- */
// Photo
/* ------------------------------------------------------------------- */


App.Model['Vertex.Medium.Photo'] = App.Photo = App.Medium.extend({
  urlRoot: "api/v1/photo/",
  _cls: "Vertex.Medium.Photo",
  formSerialization: {
    "formFields": {
      "s3_image": {
        "required": true,
        "type": "s3_image",
        "label": "Photo"
      }
    }
  },
});

/* ------------------------------------------------------------------- */
// Body or Portfolio
/* ------------------------------------------------------------------- */

App.Model['Vertex.Body'] = App.Portfolio = App.Vertex.extend({
  urlRoot: "api/v1/body/",

  url: function(){
    return this.urlRoot;
  },

  initialize: function(){
    this.fetched = false;
    this.deep = false;
  },

  isFetched: function(){
    return this.fetched;
  },

  isDeep: function(){
    return this.deep;
  }

});

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

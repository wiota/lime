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

  initialize: function(options){
    options = options || {};
    this.fetched = options.fetched || false;
    this.deep = options.deep || false;

    this.formUrl = this.urlRoot + "form/";
    this.set({'_cls': this._cls});

    this.on('change', this.triggerEvents);
  },

  triggerEvents: function(model, options){
    var attr = model.changedAttributes()
    var summary_attr = _.omit(attr, 'succset');

    if(!_.isEmpty(summary_attr)){
      this.trigger('summaryChanged', this, {'attr':summary_attr});
    }

    msg.log("CHANGE Model ['"+_.keys(attr).join("', '") + "']", 'model');
  },

  isFetched: function(){
    return this.fetched;
  },

  isDeep: function(){
    return this.deep;
  },

  deepen: function(){
    msg.log("GET "+ this.url(), 'lookup');
    this.fetch({
      success: this.deepenSuccess,
      error: this.deepenError
    });
    return this;
  },

  deepenSuccess: function(model, response, options){
    msg.log("FETCH SUCCESS " + model.get("_id") + " " + model.get("title"),'lookup');
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

    _.each(succset, function(object){

      var collection = App.collection[object._cls];
      var modelFactory = App.Model[object._cls];

      var model = collection.get(object['_id']) || new modelFactory(object, {'fetched': true, 'deep': false});

      collection.add(model);
      succsetReferences.push(model);

    })
    this.set({'succset': succsetReferences});

    this.deep = true;
    this.trigger('referenced');
    msg.log("REFERENCED", 'lookup');
    msg.log("REFERENCED", 'model');
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
  _cls: "Vertex.Body",

  url: function(){
    return this.urlRoot;
  }

});
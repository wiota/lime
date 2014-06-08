/* ------------------------------------------------------------------- */
// Models
// for admin
/* ------------------------------------------------------------------- */


Backbone.Model.prototype.parse = function(response){
  if(response.result);
  return response.result;
}

Backbone.Model.prototype.idAttribute = "_id";

/* ------------------------------------------------------------------- */
// Subset - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

App.Subset = Backbone.Model.extend({
  formSerialization: null,
  formUrl: null,

  initialize: function(){
    this.formUrl = this.urlRoot + "form/";
    this.set({'_cls': this._cls});
    this.fetched = false;
    this.deep = false;
  },

  events: {
    'change':'change'
  },

  change: function(){
    console.log("Model " + this.get('title') + "changed");
  },

  isFetched: function(){
    return this.fetched;
  },

  isDeep: function(){
    return this.deep;
  },

  deepen: function(){
    this.fetch({
      success: this.deepenSuccess,
      error: this.deepenError
    });
    return this;
  },

  deepenSuccess: function(model, response, options){
    debug.log("Fetched "+model.get("_cls"));
    var collection = App.typeDictionary[model.get('_cls')]['collection'];
    collection.add(model);
    model.fetched = true;
    model.deep = true;
    model.reference();
  },

  deepenError: function(model, response, options){
    debug.log("Fetch unsucessful " + response);
  },

  reference: function(){
    var subsetReferences = [];

    _.each(this.get('subset'), function(subsetitem){

      var modelFactory = App.typeDictionary[subsetitem._cls]['model'];
      var model = new modelFactory(subsetitem);
      model.deep = false;
      model.fetched = true;

      var collection = App.typeDictionary[subsetitem._cls]['collection'];
      collection.add(model);

      subsetReferences.push(model);
    })

    this.set({'subset': subsetReferences});
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

  saveSubset: function(){
    var list = this.get('subset');

    var options = {
      'url': this.url() + '/subset/',
      'contentType' : "application/json",
      'data': JSON.stringify({'subset' : _.pluck(list, '_id')})
    }

    Backbone.sync('update', this, options)
  }


});

/* ------------------------------------------------------------------- */
// Category
/* ------------------------------------------------------------------- */

App.Category = App.Subset.extend({
  urlRoot: "api/v1/category/",
  _cls: "Subset.Category"
});

/* ------------------------------------------------------------------- */
// Work
/* ------------------------------------------------------------------- */

App.Work = App.Subset.extend({
  urlRoot: "api/v1/work/",
  _cls: "Subset.Work"
});

/* ------------------------------------------------------------------- */
// Tag
/* ------------------------------------------------------------------- */

App.Tag = Backbone.Model.extend({
  urlRoot: "api/v1/tag/",
  _cls: "Subset.Tag"
});

/* ------------------------------------------------------------------- */
// Medium - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

App.Medium = App.Subset.extend({
  _cls: "Subset.Medium",

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


App.Photo = App.Medium.extend({
  urlRoot: "api/v1/photo/",
  _cls: "Subset.Medium.Photo",
  formSerialization: {
    "formFields": {
      "s3_image": {
        "required": true,
        "type": "s3_image",
        "label": "Photo"
      }
    }
  },
})

/* ------------------------------------------------------------------- */
// Body or Portfolio
/* ------------------------------------------------------------------- */

App.Portfolio = App.Subset.extend({
  urlRoot: "api/v1/body",

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
// Collections
// for admin
/* ------------------------------------------------------------------- */

App.portfolioStorage = {
  portfolio: null,
  _cls: 'Portfolio',

  initialize: function(){
    //_.bindAll(this, "fetchSuccess", "fetchError");
    return this;
  },

  lookup: function(){
    var portfolio = this.portfolio = this.get() || this.getEmptyPortfolio();
    if(!portfolio.isFetched()){
      return portfolio.deepen();
    } else {
      return portfolio;
    }
  },

  add: function(model){
    // noop
    debug.log("Added " + model.get('_cls'));
  },

  get: function(){
    return this.portfolio;
  },

  getEmptyPortfolio: function(){
    return new App.Portfolio({_cls: this._cls});
  }

}

/* ------------------------------------------------------------------- */
// SubsetCollection - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

App.SubsetCollection = Backbone.Collection.extend({

  initialize: function(){
    _.bindAll(this, "added");
    this.on('add', this.added);
  },

  added: function(model, collection){
    debug.log("Added " + model.get('_cls') + " " + model.get("title").substr(0, 20));
  },

  // This function returns a model instance and
  // initiates a deepen call on the model if necessary
  lookup: function(id){
    var subset = this.get(id) || this.getEmpty(id);
    if(!subset.isFetched() || !subset.isDeep()){
      return subset.deepen();
    } else {
      return subset;
    }
  },

  getEmpty: function(id){
    return new this.model({_id: id, _cls: this._cls});
  }
})

/* ------------------------------------------------------------------- */
// CategoryCollection
/* ------------------------------------------------------------------- */

App.CategoryCollection = App.SubsetCollection.extend({
  model: App.Category,
  url: "api/v1/category",
  _cls: 'Subset.Category'
})

App.WorkCollection = App.SubsetCollection.extend({
  model: App.Work,
  url: "api/v1/work",
  _cls: 'Subset.Work'
})

App.PhotoCollection = App.SubsetCollection.extend({
  model: App.Photo,
  url: "api/v1/photo",
  _cls: 'Subset.Medium.Photo',

  added: function(model, collection){
    debug.log("Added " + model.get('_cls'));
  }
})

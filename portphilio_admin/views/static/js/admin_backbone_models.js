/* ------------------------------------------------------------------- */
// Models
// for admin
/* ------------------------------------------------------------------- */


Backbone.Model.prototype.parse = function(response){
  return response.result;
}

Backbone.Model.prototype.idAttribute = "_id";

/* ------------------------------------------------------------------- */
// Body or Portfolio
/* ------------------------------------------------------------------- */

App.Portfolio = Backbone.Model.extend({
  urlRoot: "api/v1/body",

  url: function(){
    return this.urlRoot;
  },

  initialize: function(){
    this.fetched = false;
  },

  isFetched: function(){
    return this.fetched;
  }

});


/* ------------------------------------------------------------------- */
// Subset - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

App.Subset = Backbone.Model.extend({ 
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
// Category
/* ------------------------------------------------------------------- */

App.Category = App.Subset.extend({
  urlRoot: "api/v1/category",
});

/* ------------------------------------------------------------------- */
// Work
/* ------------------------------------------------------------------- */

App.Work = App.Subset.extend({
  urlRoot: "api/v1/work",
  formFields: {
    "title":{
      label: 'Title',
      required: 'true', 
      type: 'text'
    },
    "description": {
      label: 'Description',
      required: 'true', 
      type: 'textarea'
    },
    "medium": {
      label: 'Medium',
      required: 'true', 
      type: 'text'
    }
  },

  events: {
    'change':'change'
  },

  change: function(){
    console.log("Model " + this.get('title') + "changed");
  }



});

/* ------------------------------------------------------------------- */
// Tag
/* ------------------------------------------------------------------- */

App.Tag = Backbone.Model.extend({
  urlRoot: "api/v1/tag",
});

/* ------------------------------------------------------------------- */
// Medium - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

App.Medium = Backbone.Model.extend({  
  initialize: function(){
    this.fetched = false;
  },

  isFetched: function(){
    return this.fetched;
  }
});

/* ------------------------------------------------------------------- */
// Photo
/* ------------------------------------------------------------------- */


App.Photo = App.Medium.extend({})

/* ------------------------------------------------------------------- */
// Collections
// for admin
/* ------------------------------------------------------------------- */

App.portfolioStorage = {
  portfolio: null,
  _cls: 'Portfolio',

  initialize: function(){
    _.bindAll(this, "fetchSuccess", "fetchError");
    return this;
  },

  lookup: function(){
    return this.portfolio || this.fetch();
  },

  fetch: function(){
    var portfolio = new App.Portfolio({_cls: this._cls});

    portfolio.fetch({
      success: this.fetchSuccess,
      error: this.fetchError
    });

    return portfolio;
  },

  fetchSuccess: function(model, response, options){
    //console.log("Fetched portfolio");
    this.portfolio = model;
    model.fetched = true;
  },

  fetchError: function(model, response, options){
    //console.log("Portfolio fetch unsucessful " + response);
  }
  
}

/* ------------------------------------------------------------------- */
// SubsetCollection - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

App.SubsetCollection = Backbone.Collection.extend({
  
  initialize: function(){
    _.bindAll(this, "fetchSuccess", "fetchError");

    this.on('add', function(model, collection){
      //console.log("Added " + this._cls + model.get("title"));
    }, this);
  },

  lookup: function(id){
    return this.get(id) || this.fetchOne(id);
  },

  fetchOne: function(id){
    var subset = new this.model({_id: id, _cls: this._cls});

    subset.fetch({
      success: this.fetchSuccess,
      error: this.fetchError
    });

    return subset;
  },

  fetchSuccess: function(model, response, options){
    //console.log("Fetched "+model.get("title"));
    model.fetched = true;
    this.add(model);
    _.each(model.get('subset'), function(subsetitem){
      
      //console.log(subsetitem._cls);
    })
    

  },

  fetchError: function(model, response, options){
    //console.log("Fetch unsucessful " + response);
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
  _cls: 'Subset.Medium.Photo'
})

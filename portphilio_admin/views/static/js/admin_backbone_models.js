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

window.Portfolio = Backbone.Model.extend({
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

window.Subset = Backbone.Model.extend({ 
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

window.Category = Subset.extend({
  urlRoot: "api/v1/category",
});

/* ------------------------------------------------------------------- */
// Work
/* ------------------------------------------------------------------- */

window.Work = Subset.extend({
  urlRoot: "api/v1/work",
});

/* ------------------------------------------------------------------- */
// Tag
/* ------------------------------------------------------------------- */

window.Tag = Backbone.Model.extend({
  urlRoot: "api/v1/tag",
});

/* ------------------------------------------------------------------- */
// Media - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

window.Media = Backbone.Model.extend({  
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


window.Photo = Media.extend({})

/* ------------------------------------------------------------------- */
// Collections
// for admin
/* ------------------------------------------------------------------- */

window.portfolioStorage = {
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
    var portfolio = new Portfolio({_cls: this._cls});

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

window.SubsetCollection = Backbone.Collection.extend({
  
  initialize: function(){
    _.bindAll(this, "fetchSuccess", "fetchError");

    this.on('add', function(model, collection){
      console.log("Added " + this._cls + model.get("title"));
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
  },

  fetchError: function(model, response, options){
    //console.log("Fetch unsucessful " + response);
  }

})

/* ------------------------------------------------------------------- */
// CategoryCollection
/* ------------------------------------------------------------------- */

window.CategoryCollection = SubsetCollection.extend({
  model: Category,
  url: "api/v1/category",
  _cls: 'Subset.Category'
})

window.WorkCollection = SubsetCollection.extend({
  model: Work,
  url: "api/v1/work",
  _cls: 'Subset.Work'
})

window.PhotoCollection = SubsetCollection.extend({
  model: Photo,
  url: "api/v1/photo",
  _cls: 'Media.Photo'
})

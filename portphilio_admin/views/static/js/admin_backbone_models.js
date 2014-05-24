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
// Category
/* ------------------------------------------------------------------- */

window.Category = Backbone.Model.extend({
  urlRoot: "api/v1/category",

  initialize: function(){
    this.fetched = false;
  },

  isFetched: function(){
    return this.fetched;
  },

  validate: function(attrs, options){
    if(_.has(attrs, 'title')){
      console.log('has title')
      return
    }
    console.log('does not has title')
    return "Error";
  }

});

/* ------------------------------------------------------------------- */
// Work
/* ------------------------------------------------------------------- */

window.Work = Backbone.Model.extend({
  urlRoot: "api/v1/work",
  initialize: function(){
    this.fetched = false;
  },

  isFetched: function(){
    return this.fetched;
  }

});

window.Tag = Backbone.Model.extend();

window.Media = Backbone.Model.extend();

/* ------------------------------------------------------------------- */
// Collections
// for admin
/* ------------------------------------------------------------------- */

window.portfolioStorage = {
  portfolio: null,
  archtype: 'Portfolio',

  initialize: function(){
    _.bindAll(this, "fetchSuccess", "fetchError");
    return this;
  },

  lookup: function(){
    return this.portfolio || this.fetch();
  },

  fetch: function(){
    var portfolio = new Portfolio({archtype: this.archtype});

    portfolio.fetch({
      success: this.fetchSuccess,
      error: this.fetchError
    });

    return portfolio;
  },

  fetchSuccess: function(model, response, options){
    console.log("Fetched portfolio");
    this.portfolio = model;
    model.fetched = true;
  },

  fetchError: function(model, response, options){
    console.log("Portfolio fetch unsucessful " + response);
  }
  
}



window.CategoryCollection = Backbone.Collection.extend({
  model: Category,
  url: "api/v1/category",
  archtype: 'Subset.Category', // archtype that will be stored here

  initialize: function(){
    _.bindAll(this, "fetchSuccess", "fetchError");

    this.on('add', function(model, collection){
      console.log("Added Category " + model.get("title"));
    }, this);
  },

  lookup: function(id){
    return this.get(id) || this.fetchOne(id);
  },

  fetchOne: function(id){
    var category = new Category({_id: id, archtype: this.archtype});

    category.fetch({
      success: this.fetchSuccess,
      error: this.fetchError
    });

    return category;
  },

  fetchSuccess: function(model, response, options){
    console.log("Fetched "+model.get("title"));
    model.fetched = true;
    this.add(model);
  },

  fetchError: function(model, response, options){
    console.log("Fetch unsucessful " + response);
  }

})



window.WorkCollection = Backbone.Collection.extend({
  model: Work,
  url: "api/v1/work",
  archtype: 'Subset.Work', // archtype that will be stored here

  initialize: function(){
    _.bindAll(this, "fetchSuccess", "fetchError");
    this.on('add', function(model){
      console.log("Added Model " + model.get("title"))
    }, this);
  },

  lookup: function(id){
    return this.get(id) || this.fetchOne(id);
  },

  fetchOne: function(id){
    var work = new Work({_id: id, archtype: this.archtype});

    work.fetch({
      success: this.fetchSuccess,
      error: this.fetchError
    });

    return work;
  },

  fetchSuccess: function(model, response, options){
    console.log("Fetched "+model.get("title"));
    model.fetched = true;
    this.add(model);
  },

  fetchError: function(model, response, options){
    console.log("Fetch unsucessful " + response);
  }


})

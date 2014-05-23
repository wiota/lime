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
    _.bindAll(this, "fetchSuccess", "fetchError");
  },

  fetchSuccess: function(model, response, options){
    
  },

  fetchError: function(model, response, options){
    
  }

});

/* ------------------------------------------------------------------- */
// Category
/* ------------------------------------------------------------------- */

window.Category = Backbone.Model.extend({
  urlRoot: "api/v1/category",

  initialize: function(){
    _.bindAll(this, "fetchSuccess", "fetchError");
  },

  fetchSuccess: function(model, response, options){
    this.collection.add(model);
    //console.log(this.collection.toJSON());
  },

  fetchError: function(model, response, options){
    alert(response);
  }

});

/* ------------------------------------------------------------------- */
// Work
/* ------------------------------------------------------------------- */

window.Work = Backbone.Model.extend({
  urlRoot: "api/v1/work",
  initialize: function(){
    _.bindAll(this, "fetchSuccess", "fetchError");
  },

  fetchSuccess: function(model, response, options){
    this.collection.add(model);
    //console.log(this.collection.toJSON());
  },

  fetchError: function(model, response, options){
    alert(response);
  }
});

window.Tag = Backbone.Model.extend();

window.Media = Backbone.Model.extend();

// Collections


window.CategoryCollection = Backbone.Collection.extend({
  model: Category,
  url: "api/v1/category",
  initialize: function(){
    this.on('add', function(category){
      console.log("Added " + category.get("title"))
    });

  }


})

window.WorkCollection = Backbone.Collection.extend({
  model: Category,
  url: "api/v1/work",
  initialize: function(){
    this.on('add', function(work){
      console.log("Added " + work.get("title"))
    });

  }


})

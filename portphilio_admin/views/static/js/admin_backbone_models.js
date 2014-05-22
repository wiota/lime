// Models

Backbone.Model.prototype.parse = function(response){
  return response.result;
}

Backbone.Model.prototype.idAttribute = "_id";

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

window.Work = Backbone.Model.extend();

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

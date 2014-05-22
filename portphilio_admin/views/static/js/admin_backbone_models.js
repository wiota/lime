// Models

Backbone.Model.prototype.parse = function(response){
  return response.result;
}

//console.log(Backbone.Model.prototype.isNew);

window.Category = Backbone.Model.extend({
  urlRoot: "api/v1/category",
  url: function(){
    var base =
      _.result(this, 'urlRoot') ||
      _.result(this.collection, 'url') ||
      urlError();
    //if (this.isNew()) return base;
    return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.get("_id"));
  }

});


window.Work = Backbone.Model.extend();

window.Tag = Backbone.Model.extend();

window.Media = Backbone.Model.extend();

// Collections

window.CategoryCollection = Backbone.Collection.extend({
  model: Category,
  url: "api/v1/category"


})
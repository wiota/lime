// Models

window.Category = Backbone.Model.extend({

  urlRoot: "api/v1/work",
  url: function(){
    var base =
      _.result(this, 'urlRoot') ||
      _.result(this.collection, 'url') ||
      urlError();
    //if (this.isNew()) return base;
    return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.get("slug"));
  }
});


window.Work = Backbone.Model.extend();

window.Tag = Backbone.Model.extend();

window.Media = Backbone.Model.extend();
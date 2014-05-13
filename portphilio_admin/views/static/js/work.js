
// Models
window.Work = Backbone.Model.extend();
 
// Collections
window.WorkSet = Backbone.Collection.extend({
    // Reference to this collection's model.
    model:Work,
    url:"/api/v1/work/sculpture"
});
 
// Views
window.WorkSetView = Backbone.View.extend({
 
    //tagName:'ul',
    el: $('#workSet'),

    initialize:function () {
        this.model.bind("reset", this.render, this);
    },
 
    render:function (eventName) {
        _.each(this.model.models, function (work) {
            $(this.el).append(new WorkSetItemView({model:work}).render().el);
        }, this);
        return this;
    }
 
});

window.WorkSetItemView = Backbone.View.extend({
 
    tagName:"li",
 
    template:_.template($('#work-list-item').html()),

    render:function (eventName) {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
    }
 
});


 
// Router
var AppRouter = Backbone.Router.extend({
 
    routes:{
      "":"list",
      "works/:id":"workDetails"
    },
 
 
    list:function () {
      this.workSet = new WorkSet();
      var v = this.workSetView = new WorkSetView({model:this.workSet});

      this.workSet.fetch({reset: true});

      /*
      this.workSet.fetch({
        success: function(collection, response, options){
          //alert(collection.models);
          //v.reset();
          v.render();


        }, 
        error: function(){
          alert("error");
        }
      });
      */

    },
 
    workDetails:function (id) {
      alert("Details");
    }
 
});
 
var app = new AppRouter();
Backbone.history.start();

$('#refresh').click(function(){
  app.workSet.fetch({reset: true});
})
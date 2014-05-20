var explain = function(){
  var s = ">";
  for (prop in this){
    s += prop + "\n";
  }
  console.log(s);
}

window.Backbone.Model.prototype.explain = explain;
window.Backbone.View.prototype.explain = explain;

// Router
var AppRouter = Backbone.Router.extend({
  
  routes:{
  "":"default_set",
  "categories/":"getCategories",
  "categories/:slug":"getCategory"
  },

  initialize: function(){
    this.subsetPanel = new SubsetPanel();
    this.subsetPanel.stopListening();

  },

  default_set:function () {
    this.subsetPanel.empty();
    this.subsetPanel.render(new WelcomeView().render({message: 'Hello', link: "#categories/sculpture"}).el);


  },

  getCategories:function () {
    alert('categories');

  },

  getCategory:function (slug) {
    this.subsetPanel.empty();

    this.category = new Category({slug: slug});
    this.categoryView = new CategoryView({model:this.category});
    

    this.subsetPanel.setView(this.categoryView);

    this.subsetPanel.listenTo(
      this.category, 
      "change", 
      this.subsetPanel.render
    );

    this.category.fetch({
      success: function(model, response, options){
        // console.log(model.toJSON());
      }
    });

  }
 
});
 
var app = new AppRouter();
Backbone.history.start();
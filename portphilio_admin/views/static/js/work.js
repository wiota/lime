
// Models

window.Work = Backbone.Model.extend();

window.Category = Backbone.Model.extend();

window.Tag = Backbone.Model.extend


// Views
window.SubsetPanel = Backbone.View.extend({
  el: $('#subset_panel'),

  empty: function () {
    $(this.el).html();
  },

  change_border_color: function(color){
  
    $(this.el).css({'border-color': color});
  },

  render: function (el) {
    $(this.el).html(el);
  }


});

window.CategoryView = Backbone.View.extend({
  tagName: 'ul',

  template:_.template($('#category_summary').html()),

  initialize: function(){
    
  },

  render: function(slug){
    $(this.el).html(this.template({_id:'537226708b4f7325f20004c3',display_name:"SCULPTURE"}));
    return this;
  }



});

window.CategoryViewItem = Backbone.View.extend({
  tagName: 'li',

});

window.WelcomeView = Backbone.View.extend({
 
    template:_.template($('#welcome_summary').html()),

    render:function (content) {
        $(this.el).html(this.template(content));
        return this;
    }
 
});

// Router
var AppRouter = Backbone.Router.extend({
  
  routes:{
  "":"default_set",
  "categories/:slug":"categories"
  },

  initialize: function(){
    this.subsetPanel = new SubsetPanel();

  },

  default_set:function () {

    this.subsetPanel.empty();
    this.subsetPanel.change_border_color("#0ff");
    this.subsetPanel.render(new WelcomeView().render({message: 'Hello', link: "#categories/sculpture"}).el);


  },

  categories:function (slug) {
    this.subsetPanel.empty();

    //this.category = 
    this.subsetPanel.change_border_color("#ff0");
    this.subsetPanel.render(new CategoryView().render(slug).el);
    

  }
 
});
 
var app = new AppRouter();
Backbone.history.start();
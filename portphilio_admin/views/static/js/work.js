var examine = function(){
  var s = ">";
  for (prop in this){
    s += prop + "\n";
  }
  console.log(s);
}

window.Backbone.Model.prototype.examine = examine;
window.Backbone.View.prototype.examine = examine;


// Router
var AppRouter = Backbone.Router.extend({
  
  routes:{
  "":"portfolio",
  
  "category":"categoryList",
  "category/":"categoryList",
  "category/:id":"getCategory",

  "work":"workList",
  "work/":"workList",
  "work/:id":"getWork"

  },

  initialize: function(){
    this.subsetPanel = new SubsetPanel();
    this.subsetPanel.stopListening();

  },

  // Body of work
  portfolio: function() {

    this.welcome = new WelcomeView();
    this.welcome.message = {message: 'Hello'}

    this.subsetPanel.empty();
    this.subsetPanel.setView(this.welcome);

    this.subsetPanel.render();
  },

  // Category
  categoryList: function() {
    this.subsetPanel.empty();
    this.subsetPanel.text("categoryList");

  },

  getCategory: function(id) {

    // Do we assume the category archtype? Or do we wait for the 

    this.category = new Category({slug: id, archtype: 'category'});
    this.defaultListingView = new DefaultListingView({model:this.category});
    
    this.subsetPanel.empty();
    this.subsetPanel.setView(this.defaultListingView);

    this.subsetPanel.listenTo(
      this.category, 
      "change", 
      this.subsetPanel.render
    );

    this.category.fetch({
      success: function(model, response, options){
        //console.log(model.toJSON());
      }
    });
  },

  // Work

  workList: function(){
    this.subsetPanel.empty();
    this.subsetPanel.text("workList");

  },

  getWork: function(id){
    this.subsetPanel.empty();
    
    this.work = new Work({
      "_id": "537226708b4f7325f20004c3", 
      "archtype": "work",
      "title": "Work 1", 
      "slug": "work-1", 
      "media": [
        {
          "_id":"328u3897932", 
          "archtype": "photo", 
          "href": "https://s3.amazonaws.com/portphilio/TrainFromTurmoilToHappyClouds.jpg"
        }
      ]
    })

    this.defaultListingView = new DefaultListingView({model:this.work});

    this.subsetPanel.empty();
    this.subsetPanel.setView(this.defaultListingView);

    this.subsetPanel.render();


  }

 
});
 
var app = new AppRouter();
Backbone.history.start();
var examine = function(){
  var s = ">";
  for (prop in this){
    s += prop + "\n";
  }
  console.log(s);
}

Backbone.Model.prototype.examine = examine;
Backbone.View.prototype.examine = examine;



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

    // Set up body of work
    
    // Set up collection based storage of fetched objects
    this.categoryStorage = new CategoryCollection();
    this.workStorage = new CategoryCollection();

  },

  // Body of work
  portfolio: function() {

    this.portfolioArchtype = 'Subset.Portfolio';
    this.portfolio = new Portfolio({archtype: this.portfolioArchtype});


    this.listclass = 'subset portfolio listing'

    this.defaultListingView = new DefaultListingView({model:this.portfolio, className: this.listclass});

    this.subsetPanel.empty();
    this.subsetPanel.setView(this.defaultListingView);

    this.subsetPanel.listenTo(
      this.portfolio, 
      "change", 
      this.subsetPanel.render
    );

    this.portfolio.fetch({
      success: this.portfolio.fetchSuccess
    });

  },

  // Category
  categoryList: function() {
    this.subsetPanel.empty();
    

  },

  getCategory: function(id) {

    // Do we assume the category archtype? Or do we wait for the 
    this.archtype = 'Subset.Category';
    this.listclass = 'subset category listing'

    this.category = new Category({_id: id, archtype: this.archtype},{collection:this.categoryStorage});
    this.defaultListingView = new DefaultListingView({model:this.category, className: this.listclass});
    
    this.subsetPanel.empty();
    this.subsetPanel.setView(this.defaultListingView);

    this.subsetPanel.listenTo(
      this.category, 
      "change", 
      this.subsetPanel.render
    );


    this.category.fetch({
      success: this.category.fetchSuccess
    });
  },

  // Work

  workList: function(){
    this.subsetPanel.empty();
    this.subsetPanel.text("workList");

  },

  getWork: function(id){

    this.archtype = 'Subset.Work';
    this.listclass = 'subset work listing'
    
    this.work = new Work({_id: id, archtype: this.archtype},{collection:this.workStorage});
    this.defaultListingView = new DefaultListingView({model:this.work, className: this.listclass});
    
    this.subsetPanel.empty();
    this.subsetPanel.setView(this.defaultListingView);

    this.subsetPanel.listenTo(
      this.work, 
      "change", 
      this.subsetPanel.render
    );

    /*
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
    */
  
    this.work.fetch({
      success: this.work.fetchSuccess
    });


  }

 
});
 
var app = new AppRouter();
Backbone.history.start();
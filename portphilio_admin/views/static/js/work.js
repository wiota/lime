var examine = function(){
  var s = ">";
  for (prop in this){
    s += prop + "\n";
  }
  console.log(s);
}

Backbone.Model.prototype.examine = examine;
Backbone.View.prototype.examine = examine;

/* ------------------------------------------------------------------- */
// Router
// for admin
/* ------------------------------------------------------------------- */

var AppRouter = Backbone.Router.extend({
  
  routes:{
  "":"getPortfolio",
  
  "category":"categoryList",
  "category/":"categoryList",
  "category/:id":"getCategory",

  "work":"workList",
  "work/":"workList",
  "work/:id":"getWork"

  },

  initialize: function(){

    
    // Collection-based storage
    // this.portfolioStorage = new PortfolioCollection();
    this.portfolioStorage = portfolioStorage.initialize();
    this.categoryStorage = new CategoryCollection();
    this.workStorage = new WorkCollection();

    // Panel for Listings
    this.subsetPanel = new SubsetPanel();

  },

  list: function(collection, id){
    console.log(collection + " " + id);
  },

  // Body of work
  getPortfolio: function() {

    var portfolio = this.portfolioStorage.lookup();

    this.listclass = 'subset portfolio listing'
    this.listingView = new listingView({model:portfolio, className: this.listclass});

    this.subsetPanel.setModel(portfolio);
    this.subsetPanel.setView(this.listingView);
    this.subsetPanel.refresh();

  },

  // Category
  categoryList: function() {
    this.subsetPanel.empty();
  },

  getCategory: function(id) {

    var category = this.categoryStorage.lookup(id);

    this.listclass = 'subset category listing'
    this.listingView = new listingView({model:category, className: this.listclass});
    
    this.subsetPanel.setModel(category);
    this.subsetPanel.setView(this.listingView);
    this.subsetPanel.refresh();
    
  },

  // Work
  workList: function(){
    this.subsetPanel.empty();
  },

  getWork: function(id){

    var work = this.workStorage.lookup(id);

    this.listclass = 'subset work listing'
    this.listingView = new listingView({model:work, className: this.listclass});
    
    this.subsetPanel.setModel(work);
    this.subsetPanel.setView(this.listingView);
    this.subsetPanel.refresh();

  }

 
});
 
var app = new AppRouter();
Backbone.history.start();
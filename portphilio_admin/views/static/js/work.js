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
    this.portfolioStorage = portfolioStorage.initialize();
    this.categoryStorage = new CategoryCollection();
    this.workStorage = new WorkCollection();

    // Panel for Listings
    this.listingPanel = new ListingPanel();

  },

  list: function(collection, id){
    console.log(collection + " " + id);
  },

  // Body of work
  getPortfolio: function() {

    var portfolio = this.portfolioStorage.lookup();
    this.listingPanel.list(portfolio);
  },

  // Category
  categoryList: function() {
    this.subsetPanel.empty();
  },

  getCategory: function(id) {
    var category = this.categoryStorage.lookup(id);
    this.listingPanel.list(category);
  },

  // Work
  workList: function(){
    this.subsetPanel.empty();
  },

  getWork: function(id){
    var work = this.workStorage.lookup(id);
    this.listingPanel.list(work);
  }

 
});
 
var app = new AppRouter();
Backbone.history.start();
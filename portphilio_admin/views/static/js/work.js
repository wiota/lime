

/* ------------------------------------------------------------------- */
// Router
// for admin
/* ------------------------------------------------------------------- */

App.Router = Backbone.Router.extend({

  routes:{

  "":"getPortfolio",
  "category/:id":"getCategory",
  "work/:id":"getWork"

  },

  initialize: function(){
    // Panel for Listings
    App.listingPanel = new App.ListingPanel();
    App.actionPanel = new App.ActionPanel();

  },

  // Body of work
  getPortfolio: function() {
    var portfolio = App.portfolioStorage.lookup();
    App.listingPanel.list(portfolio);
  },

  // Category

  getCategory: function(id) {
    var category = App.categoryStorage.lookup(id);
    App.listingPanel.list(category);
  },

  // Work

  getWork: function(id){
    var work = App.workStorage.lookup(id);
    App.listingPanel.list(work);
  }

 
});
 
$(document).ready(function() {
  App.router = new App.Router();

  App.typeDictionary = {
    'Vertex.Body': {
      'model': App.Portfolio,
      'collection': App.portfolioStorage,
      'summaryView': App.PortfolioSummaryView,
      'listingView': App.ListingView
    },
    'Vertex.Category': {
      'model': App.Category,
      'collection': App.categoryStorage,
      'summaryView': App.CategorySummaryView,
      'listingView': App.ListingView,
      'successorListItemView': App.CategorySuccessorItemView
    },
    'Vertex.Work': {
      'model': App.Work,
      'collection': App.workStorage,
      'summaryView': App.WorkSummaryView,
      'listingView': App.ListingView,
      'successorListItemView': App.WorkSuccessorItemView
    },
    'Vertex.Medium.Photo': {
      'model': App.Photo,
      'collection': App.photoStorage,
      'successorListItemView': App.PhotoSuccessorItemView,
      'formView': App.PhotoUploadForm
    }
  }

  Backbone.history.start();


  /* TODO
  App.Factories.Models = {

    'category': App.Subset.extend({
      urlRoot: "api/v1/category/",
    }),

    'work': App.Subset.extend({
      urlRoot: "api/v1/work/",
    }),

  }

  new App.Factories['category']();

  App.Factories = {
    "Subset.Work": function(){alert("hi");}
  }

  App.Factories['Subset.Work']();

  */


});

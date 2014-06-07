

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

  // Collection-based storage
  App.portfolioStorage.initialize();
  App.categoryStorage = new App.CategoryCollection();
  App.workStorage = new App.WorkCollection();

  App.typeDictionary = {
    'Portfolio': {
      'model': App.Portfolio,
      'listingView': App.ListingView,
      'summaryView': App.PortfolioSummaryView,
      'listItemView': App.PortfolioChildItemView,
      'summaryView': App.PortfolioSummaryView
    },
    'Subset.Category': {
      'collection': App.categoryStorage,
      'model': App.Category,
      'listingView': App.ListingView,
      'summaryView': App.CategorySummaryView,
      'listItemView': App.CategoryChildItemView,
      'summaryView': App.CategorySummaryView
    },
    'Subset.Work': {
      'model': App.Work,
      'collection': App.workStorage,
      'listingView': App.ListingView,
      'summaryView': App.WorkSummaryView,
      'listItemView': App.WorkChildItemView,
      'summaryView': App.WorkSummaryView
    },
    'Subset.Medium.Photo': {
      'model': App.Medium,
      'collection': App.mediumStorage,
      'listItemView': App.MediumChildItemView,
      'summaryView': App.MediumSummaryView
    },
    'Medium.Video': {},
    'Medium.Audio': {},
    'Medium.Text': {},
    'Medium.Material': {}
  }

  Backbone.history.start();
});

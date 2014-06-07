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


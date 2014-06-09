// Portphillio Admin Backbone Views


/* ------------------------------------------------------------------- */
// Listings
/* ------------------------------------------------------------------- */




/* ------------------------------------------------------------------- */
// ChildItems
/* ------------------------------------------------------------------- */

App.ChildItemView = Backbone.View.extend({ // Abstract class - do not instantiate!
  tagName: 'li',
  className: 'listItem',

  events:{
    'click .delete':'delete',
    'click .update':'updateForm'
  },

  initialize: function(options){
    _.bindAll(this, 'destroySuccess', 'destroyError');
    this.bind('destroy', this.destroySuccess, this);
    this.predecessor = options.predecessor;
  },

  delete: function(){
    this.model.destroy({
      success: this.destroySuccess,
      error: this.destroyError
    });
  },

  updateForm: function(){
    App.actionPanel.loadForm(this.model, this.predecessor);
  },

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    this.delegateEvents();
    return this
  },

  destroySuccess: function(){
    console.log('Delete Success!');
    this.remove();
  },

  destroyError: function(model, response, options){
    console.log("Destroy Error " +response);
  }

})

App.CategoryChildItemView = App.ChildItemView.extend({
  className: 'category_in_set listItem',
  template:_.template($('#category_in_set').html())
});

App.WorkChildItemView = App.ChildItemView.extend({
  className: 'work_in_set listItem',
  template:_.template($('#work_in_set').html())
});

App.PhotoChildItemView = App.ChildItemView.extend({
  className: 'photo_in_set listItem',
  template:_.template($('#photo_in_set').html())
});

App.emptyListItem = Backbone.View.extend({
  tagName: 'li'
});


/* ------------------------------------------------------------------- */
// ChildLists
/* ------------------------------------------------------------------- */

// what to render if listing has no subsetItems (possibly in subsetItems view)

App.SubsetListView = Backbone.View.extend({
  tagName: 'ol',
  className: 'subset_list',

  initialize: function(){
    this.listenToOnce(this.model, 'referenced', this.listenToModel);
  },

  listenToModel: function(){
    this.render();
    this.listenTo(this.model, 'change:subset', this.render)
  },

  render: function(){
    // should be referenced subset, check if deep
    if(!this.model.isDeep()){return false;}
    console.log("Rendering SubsetList");
    subsetItems = this.model.get('subset');
    this.$el.empty();

    _.each(subsetItems, function(subsetItem, index){
      var viewFactory = App.typeDictionary[subsetItem._cls]['listItemView'];
      var listItemView = new viewFactory({'model':subsetItem, 'predecessor': this.model});

      this.$el.append(listItemView.render().el);
      listItemView.listenTo(subsetItem, 'change', listItemView.render);

    }, this);

    return this;
  }
});

App.PortfolioSubsetListView = App.SubsetListView.extend({});

App.CategorySubsetListView = App.SubsetListView.extend({});

App.WorkSubsetListView = App.SubsetListView.extend({});


/* ------------------------------------------------------------------- */
// Summaries
/* ------------------------------------------------------------------- */

App.SummaryView = Backbone.View.extend({ // Abstract class - do not instantiate!
  tagName: 'div',
  className: 'summary',

  events:{
    'click .update':'updateForm',
    'click .save_order':'saveSubset',
    'click .add_work':'addWorkForm',
    'click .add_photo':'addPhotoForm'
  },

  initialize: function(){
    this.listenTo(this.model, 'summaryChanged', this.render)
  },

  render: function(){
    console.log("Rendering Summary");
    this.$el.html(this.template(this.model.toJSON()));
    this.delegateEvents();
    return this;
  },

  updateForm: function(){
    App.actionPanel.loadForm(this.model, null);
  },

  addWorkForm: function(){
    var newWork = new App.Work();
    App.actionPanel.loadForm(newWork, this.model);
  },

  addPhotoForm: function(){
    var newPhoto = new App.Photo();
    App.actionPanel.loadForm(newPhoto, this.model);
  },

  saveSubset: function(){
    this.model.saveSubset();
  }

});

App.PortfolioSummaryView = App.SummaryView.extend({
  template:_.template($('#portfolio_summary').html()),
});

App.CategorySummaryView = App.SummaryView.extend({
  template:_.template($('#category_summary').html()),
});

App.WorkSummaryView = App.SummaryView.extend({
  template:_.template($('#work_summary').html()),
});

/* ------------------------------------------------------------------- */
// Listings
/* ------------------------------------------------------------------- */

App.ListingView = Backbone.View.extend({ // Akin to FormView
  tagName: 'div',
  _cls: null,
  summary: null,
  list: null,

  initialize: function(){
    var _cls = this.model.get('_cls');

    // I would love to do this:
    // App.Factories.Views[_cls]['summaryView']
    // see work.js for implementation

    var viewFactory = App.typeDictionary[_cls]['summaryView'];
    this.summary = new viewFactory({model:this.model}),
    this.list = new App.SubsetListView({model:this.model})

    this.appendElements();

    // No longer render from this view, instead
    // append subViews and have them listen to
    // the models

  },

  appendElements: function(){
    this.$el.append(this.summary.el);
    this.$el.append(this.list.el);
  }

})

App.PortfolioListingView = App.ListingView.extend({})

App.CategoryListingView = App.ListingView.extend({})

App.WorkListingView = App.ListingView.extend({})

/* ------------------------------------------------------------------- */
// Listing Panel
// This panel should be the startpoint for all listings
/* ------------------------------------------------------------------- */

App.ListingPanel = Backbone.View.extend({
  el: $('#listing_panel'),
  view: null,
  listed_model: null,

  list: function(model){
    this.listed_model = model;
    var _cls = this.listed_model.get('_cls');
    var className = _cls.toLowerCase().split('.').join(' ') + ' listing';

    if(this.view){
      this.view.remove();
    }

    this.view = new App.ListingView({'model':this.listed_model, 'className': className});
    this.$el.html(this.view.el);
  }

});


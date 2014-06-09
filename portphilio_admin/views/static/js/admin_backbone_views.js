// Portphillio Admin Backbone Views

/* ------------------------------------------------------------------- */
// Successors
/* ------------------------------------------------------------------- */

App.SuccessorItemView = Backbone.View.extend({ // Abstract class - do not instantiate!
  tagName: 'li',
  className: 'successorItem',

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

App.CategorySuccessorItemView = App.SuccessorItemView.extend({
  className: 'category_in_set successorItem',
  template:_.template($('#category_in_set').html())
});

App.WorkSuccessorItemView = App.SuccessorItemView.extend({
  className: 'work_in_set successorItem',
  template:_.template($('#work_in_set').html())
});

App.PhotoSuccessorItemView = App.SuccessorItemView.extend({
  className: 'photo_in_set successorItem',
  template:_.template($('#photo_in_set').html())
});

App.emptyListItem = Backbone.View.extend({
  tagName: 'li'
});


/* ------------------------------------------------------------------- */
// Successor Set List
/* ------------------------------------------------------------------- */

// Render what if vertex has no successors?

App.SuccsetListView = Backbone.View.extend({
  tagName: 'ol',
  className: 'succset_list',

  initialize: function(){

    this.listenTo(this.model, 'change:succset', this.cons);
    this.listenTo(this.model, 'change:succset', this.render);
    if(!this.model.isDeep()){
      this.listenToOnce(this.model, 'referenced', this.render);
    }
  },

  cons: function(){
    console.log('change:succset');
  },

  render: function(){
    // check if deep
    if(!this.model.isDeep()){
      console.log('failed, not deep');
      return false;
    }

    console.log("Rendering SuccsetList");
    successors = this.model.get('succset');
    this.$el.empty();

    _.each(successors, function(successor, index){
      var viewFactory = App.typeDictionary[successor._cls]['successorListItemView'];
      var successorListItemView = new viewFactory({'model':successor, 'predecessor': this.model});

      this.$el.append(successorListItemView.render().el);
      successorListItemView.listenTo(successor, 'change', successorListItemView.render);

    }, this);

    return this;
  }
});

App.PortfolioSubsetListView = App.SuccsetListView.extend({});

App.CategorySubsetListView = App.SuccsetListView.extend({});

App.WorkSubsetListView = App.SuccsetListView.extend({});


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
    if(!this.model.isFetched()){ // set up sync handler to render after success function is called
      this.listenToOnce(this.model, 'sync', this.render);
    }
    this.listenTo(this.model, 'summaryChanged', this.render)
  },

  render: function(){
    if(!this.model.isFetched()){
      console.log('failed, not fetched');
      return false;
    }
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
    this.list = new App.SuccsetListView({model:this.model})

    this.appendElements();

    // No longer render from this view, instead
    // append subViews and have them listen to
    // the models

  },

  render: function(){
    this.summary.render();
    this.list.render();
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
    this.view.render();
  }

});


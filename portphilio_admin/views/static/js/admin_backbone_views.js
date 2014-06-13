/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Views
/* ------------------------------------------------------------------- */

App.View = {};

/* ------------------------------------------------------------------- */
// Successor Item View (SuccsetItemView?)
/* ------------------------------------------------------------------- */

App.View.SuccessorItemView = {};

App.View.SuccessorItemView['Vertex'] = App.SuccessorItemView = Backbone.View.extend({ // Abstract class - do not instantiate!
  tagName: 'li',
  className: 'successorItem',

  events:{
    'click .delete':'delete',
    'click .update':'updateForm'
  },

  initialize: function(options){
    // destroy should really only update the succset
    _.bindAll(this, 'destroySuccess', 'destroyError');
    this.bind('destroy', this.destroySuccess, this);
    this.predecessor = options.predecessor;
    this.listenTo(this.model, 'outofsync', this.flashOut);
    this.listenTo(this.model, 'resynced', this.flash);
  },

  delete: function(){
    // update the succset of predecessor
    // problem - does not update the succset at all
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

  flashOut: function(){
    this.$el.addClass('outofsync');
  },

  // This function seems to reveal that there are leftover
  // views with event handlers laying around. See issue #20
  flash: function(){
    console.log('flash ' + this.model.get('title'));
    this.$el.css({'opacity': '0.3'});
    this.$el.removeClass('outofsync');
    this.$el.animate({'opacity': '1'});
  },

  destroySuccess: function(){
    console.log('Delete Success!');
    this.$el.fadeOut();
  },

  destroyError: function(model, response, options){
    console.log("Destroy Error " +response);
  }


});

App.View.SuccessorItemView['Vertex.Category'] = App.CategorySuccessorItemView = App.SuccessorItemView.extend({
  className: 'category_in_set successorItem',
  template:_.template($('#category_in_set').html())
});

App.View.SuccessorItemView['Vertex.Work'] = App.WorkSuccessorItemView = App.SuccessorItemView.extend({
  className: 'work_in_set successorItem',
  template:_.template($('#work_in_set').html())
});

App.View.SuccessorItemView['Vertex.Medium.Photo'] = App.PhotoSuccessorItemView = App.SuccessorItemView.extend({
  className: 'photo_in_set successorItem',
  template:_.template($('#photo_in_set').html())
});

App.View.SuccessorItemView['empty'] = App.emptyListItem = Backbone.View.extend({
  tagName: 'li',
  initialize: function(){
    this.$el.html('Empty');
  }
});


/* ------------------------------------------------------------------- */
// Successor Set List
/* ------------------------------------------------------------------- */
// Render what if vertex has no successors?

App.View.SuccsetListView = {};

App.View.SuccsetListView['Vertex'] = App.SuccsetListView = Backbone.View.extend({
  tagName: 'ol',
  className: 'succset_list',

  initialize: function(){
    this.listenTo(this.model, 'change:succset', this.render);
    if(!this.model.isDeep()){
      this.listenToOnce(this.model, 'sync', this.render);
    }
  },

  render: function(){
    // check if deep
    if(!this.model.isDeep()){
      return false;
    }

    msg.log("Rendering Succset", 'render');
    msg.log(this.model._cls + " " + this.model.get('title'), 'render');
    successors = this.model.get('succset');
    this.$el.empty();

    _.each(successors, function(successor, index){
      msg.log(successor._cls, 'render');
      var viewFactory = App.View.SuccessorItemView[successor._cls];
      var successorItemView = new viewFactory({'model':successor, 'predecessor': this.model});

      this.$el.append(successorItemView.render().el);
      successorItemView.listenTo(successor, 'change', successorItemView.render);

    }, this);

    return this;
  }
});


/* ------------------------------------------------------------------- */
// Summaries
/* ------------------------------------------------------------------- */

App.View.SummaryView = {};

App.View.SummaryView['Vertex'] = App.SummaryView = Backbone.View.extend({
  tagName: 'div',
  className: 'summary',
  template:_.template($('#default_summary').html()),

  events:{
    'click .update':'updateForm',
    'click .save_order':'saveSuccset',
    'click .add_work':'addWorkForm',
    'click .add_photo':'addPhotoForm'
  },

  initialize: function(){
    // set up sync handler to render anytime model is synced
    // Seems sloppy to set up a sync handler and a summary changed
    // handler. This is done here because summaryChanged is fired before
    // fetchSuccess callback. Deep and Fetched are set there, and when
    // sync is called, it rerenders after those variables are set
    // possible option, put it in the parse function, however this
    // creates difficulties because the model is not created yet
    // Another option would be to override the fetch function.
    this.listenTo(this.model, 'sync', this.render);
    this.listenTo(this.model, 'summaryChanged', this.render)
    this.listenTo(this.model, 'outofsync', this.flashOut);
    this.listenTo(this.model, 'resynced', this.flash);
  },

  render: function(){
    if(!this.model.isFetched()){
      msg.log("Rendering Summary Failed", 'render');
      return false;
    }
    msg.log("Rendering Summary", 'render');
    this.$el.html(this.template(this.model.toJSON()));
    this.delegateEvents();
    return this;
  },

  flashOut: function(){
    this.$el.addClass('outofsync');
  },

  // This function seems to reveal that there are leftover
  // views with event handlers laying around. See issue #20
  flash: function(){
    console.log('flash ' + this.model.get('title'));
    this.$el.css({'opacity': '0.3'});
    this.$el.removeClass('outofsync');
    this.$el.animate({'opacity': '1'});
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

  saveSuccset: function(){
    this.model.saveSuccset();
  }

});

App.View.SummaryView['Vertex.Body'] = App.PortfolioSummaryView = App.SummaryView.extend({
  template:_.template($('#portfolio_summary').html()),
});

App.View.SummaryView['Vertex.Category'] = App.CategorySummaryView = App.SummaryView.extend({
  template:_.template($('#category_summary').html()),
});

App.View.SummaryView['Vertex.Work'] = App.WorkSummaryView = App.SummaryView.extend({
  template:_.template($('#work_summary').html()),
});

/* ------------------------------------------------------------------- */
// Listings
/* ------------------------------------------------------------------- */

App.View.ListingView = {};

App.View.ListingView['Vertex'] = App.ListingView = Backbone.View.extend({ // Akin to FormView
  tagName: 'div',
  _cls: null,
  summary: null,
  list: null,

  initialize: function(){
    var _cls = this.model.get('_cls');

    var viewFactory = App.View.SummaryView[_cls];
    this.summary = new viewFactory({model:this.model}),
    this.list = new App.SuccsetListView({model:this.model})

    this.appendElements();
    // View does not render on initialize
    // Must be explicitly rendered by ListingPanel
  },

  render: function(){
    this.summary.render();
    this.list.render();
  },

  appendElements: function(){
    this.$el.append(this.summary.el);
    this.$el.append(this.list.el);
  }

});

App.View.ListingView['Vertex.Body'] = App.PortfolioListingView = App.ListingView.extend({});

App.View.ListingView['Vertex.Category'] = App.CategoryListingView = App.ListingView.extend({});

App.View.ListingView['Vertex.Work'] = App.WorkListingView = App.ListingView.extend({});

/* ------------------------------------------------------------------- */
// Listing Panel
// This panel should be the startpoint for all listings
/* ------------------------------------------------------------------- */

App.ListingPanel = Backbone.View.extend({
  el: $('#listing_panel'),
  view: null,
  listed_model: null,

  list: function(model){
    msg.log('- List '+model.id+ ' ' + model.deep + ' ------------------','model')
    msg.log('- List '+model.id+' ------------------','render')
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
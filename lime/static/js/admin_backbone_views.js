/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Views
/* ------------------------------------------------------------------- */

App.View = {};

/* ------------------------------------------------------------------- */
// App Model Overrides
/* ------------------------------------------------------------------- */

Backbone.View.prototype.flashOut = function(){
  this.$el.addClass('outofsync');
},

// This function seems to reveal that there are leftover
// views with event handlers laying around. See issue #20
Backbone.View.prototype.flash = function(){
  msg.log('flash ' + this.model.get('_id'));
  this.$el.css({'opacity': '0'});
  this.$el.removeClass('outofsync');
  this.$el.animate({'opacity': '1'},2000);
},

Backbone.View.prototype.close = function(){
  //console.log(this.className + ' close');
  if(this.children){
    _.each(this.children, function(childView){
      childView.close();
    })
  }
  this.children = [];
  this.stopListening();
  this.unbind();
  this.remove();
}

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
    this.predecessor = options.predecessor;
    this.listenTo(this.model, 'outofsync', this.flashOut);
    this.listenTo(this.model, 'resynced', this.flash);
    this.$el.attr('id', "_id_"+this.model.id);
  },

  delete: function(){
    this.predecessor.removeFromSuccset(this.model);
  },

  updateForm: function(){
    App.actionPanel.loadVertexForm(this.model, this.predecessor);
  },

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    this.delegateEvents();
    return this
  }

});

App.View.SuccessorItemView['Vertex.Apex.Body'] = App.CategorySuccessorItemView = App.SuccessorItemView.extend({
  className: 'body successorItem',
  template:_.template($('#body_in_set').html())
});

App.View.SuccessorItemView['Vertex.Category'] = App.CategorySuccessorItemView = App.SuccessorItemView.extend({
  className: 'category successorItem',
  template:_.template($('#category_in_set').html())
});

App.View.SuccessorItemView['Vertex.Work'] = App.WorkSuccessorItemView = App.SuccessorItemView.extend({
  className: 'work successorItem',
  template:_.template($('#work_in_set').html())
});

App.View.SuccessorItemView['Vertex.Medium.Photo'] = App.PhotoSuccessorItemView = App.SuccessorItemView.extend({
  className: 'photo successorItem',
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
  sortFunction: null,

  initialize: function(){
    this.listenTo(this.model, 'change:succset', this.render);
    if(!this.model.isDeep()){
      this.listenToOnce(this.model, 'sync', this.render);
    }

    this.children = [];

    _.bindAll(this, 'update');
    this.sortInit();
  },

  sortInit: function(){
    this.sortFunction = this.$el.sortable({
      axis:'y',
      cursor: 'move',
      opacity: 0.8,
      distance: 0,
      handle: '.drag_handle',
      update: this.update,
      forcePlaceholderSize: true,
      helper: 'original',
      start: function(e, ui){
        var s = ui.helper.height()+2;
        var e = ui.helper.height()+5;
        ui.placeholder.height(s);
        ui.placeholder.animate({'height':e+'px'}, 50, 'linear');
      }
    });
  },

  update: function(event, ui){
    var ids = [];
    var lis = this.$el.children();
    lis.each(function(){
      ids.push($(this)[0].id.slice(4));
    })
    this.model.setSuccset(ids);
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
      this.children.push(successorItemView);
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
    'click .add_category':'addCategoryForm',
    'click .add_work':'addWorkForm',
    'click .add_photo':'addPhotoForm',
    'click .set_cover':'setCoverForm'
  },

  initialize: function(){
    this._cls = this.model.get('_cls');

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
    this.$covers = this.$el.children('.cover');
    _.each(this.model.get('cover'), function(coverItem){
      this.$covers.append("<img src='"+coverItem.get('href')+"?w=500' alt='' />")
    }, this);
    this.delegateEvents();
    return this;
  },

  updateForm: function(){
    App.actionPanel.loadVertexForm(this.model, null);
  },

  addCategoryForm: function(){
    var newCategory = new App.Model['Vertex.Category']();
    App.actionPanel.loadVertexForm(newCategory, this.model);
  },

  addWorkForm: function(){
    var newWork = new App.Model['Vertex.Work']();
    App.actionPanel.loadVertexForm(newWork, this.model);
  },

  addPhotoForm: function(){
    console.log("No longer functional");
  },

  setCoverForm: function(){
    App.actionPanel.loadCoverForm(this.model);
  },

  saveSuccset: function(){
    this.model.saveSuccset();
  }

});

App.View.SummaryView['Vertex.Apex.Body'] = App.PortfolioSummaryView = App.SummaryView.extend({
  template:_.template($('#portfolio_summary').html())
});

App.View.SummaryView['Vertex.Category'] = App.CategorySummaryView = App.SummaryView.extend({
  template:_.template($('#category_summary').html())
});

App.View.SummaryView['Vertex.Work'] = App.WorkSummaryView = App.SummaryView.extend({
  template:_.template($('#work_summary').html())
});

App.View.SummaryView['Vertex.Happening'] = App.WorkSummaryView = App.SummaryView.extend({
  template:_.template($('#happening_summary').html())
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

    this.children = [this.summary, this.list];

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
  },

});

App.View.ListingView['Vertex.Apex.Body'] = App.PortfolioListingView = App.ListingView.extend({});

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

    // View
    if(this.view){
      this.view.close();
    }

    this.view = new App.ListingView({'model':this.listed_model, 'className': className});
    this.$el.html(this.view.el);
    this.view.render();

  },



});
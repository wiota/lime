// Portphillio Admin Backbone Views

/* ------------------------------------------------------------------- */
// ChildItems
/* ------------------------------------------------------------------- */

window.ChildItemView = Backbone.View.extend({ // Abstract class - do not instantiate! 
  tagName: 'li',
  className: 'child',

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    return this
  }
})

window.CategoryChildItemView = ChildItemView.extend({
  className: 'category_in_set child',
  template:_.template($('#category_in_set').html()),
});

window.WorkChildItemView = ChildItemView.extend({
  className: 'work_in_set child',
  template:_.template($('#work_in_set').html()),
});

window.MediumChildItemView = ChildItemView.extend({
  className: 'photo_in_set child',
  template:_.template($('#photo_in_set').html())
});

window.emptyListItem = Backbone.View.extend({
  tagName: 'li'
});


/* ------------------------------------------------------------------- */
// ChildLists
/* ------------------------------------------------------------------- */

// what to render if listing has no children (possibly in children view)

window.ChildListView = Backbone.View.extend({
  tagName: 'ul',
  className: 'childlist',
  typeViewDictionary: {
    'Subset.Category': CategoryChildItemView,
    'Subset.Work': WorkChildItemView,
    'Subset.Medium.Photo': MediumChildItemView 
  },
  typeWorkDictionary: {
    'Subset.Category': Category,
    'Subset.Work': Work,
    'Subset.Medium.Photo': Photo
  },

  render: function(){
    children = this.model.get('subset');
    //console.log(children.length);
    _.each(children, function(child, index){
      var _cls = child['_cls'];
      var viewFactory = this.typeViewDictionary[_cls];
      var modelFactory = this.typeWorkDictionary[_cls];
      
      // children should be stored and retrieved in collection
      // then they should be looked up
      // is the view the appropriate place to do this? No
      // This should be done in the Model upon parsing
      // In addition to isFetched, isDereferenced

      // Here we should make a call to the collection that matches the type
      // One dictionary!!!!!!!!!!!!!!!!!!!!!!!!!!
      var model = new modelFactory(child);
      
      //console.log("Child Item "+index+" type: " + _cls);
      
      var childItemView = new viewFactory({'model':model});
      this.$el.append(childItemView.render().el);
      

      //this.$el.append(new CategoryChildItemView({model: new Work(child)}).render().el);  
    }, this);
    return this;
  }
});

window.PortfolioChildListView = ChildListView.extend({});

window.CategoryChildListView = ChildListView.extend({});

window.WorkChildListView = ChildListView.extend({});


/* ------------------------------------------------------------------- */
// Summaries
/* ------------------------------------------------------------------- */

window.SummaryView = Backbone.View.extend({ // Abstract class - do not instantiate! 
  tagName: 'div',
  className: 'summary',

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  }, 
  events:{
    "click .delete":"delete"
  },
  delete: function(){
    this.model.destroy({
      success: function(){
        console.log('Delete Success!');
      },
      error: function(model, response, options){
        console.log(response);
      }
    });
  }

});

window.PortfolioSummaryView = SummaryView.extend({
  template:_.template($('#portfolio_summary').html()),
});

window.CategorySummaryView = SummaryView.extend({
  template:_.template($('#category_summary').html()),
});

window.WorkSummaryView = SummaryView.extend({
  template:_.template($('#work_summary').html()),
});

/* ------------------------------------------------------------------- */
// Listings
/* ------------------------------------------------------------------- */

window.ListingView = Backbone.View.extend({ // Abstract class - do not instantiate! 
  
  tagName: 'div',
  _cls: null,

  initialize: function(){
    this.subViews = []; 
  },

  render: function(){
    _.each(this.subViews, function(subView){
      this.$el.append(subView.render().el);
    }, this)
    return this;
  }
})

window.PortfolioListingView = ListingView.extend({
  initialize: function(){
    ListingView.prototype.initialize.apply(this, arguments);
    this.subViews.push(new PortfolioSummaryView({model:this.model}));
    this.subViews.push(new ChildListView({model:this.model}));
  }
})

window.CategoryListingView = ListingView.extend({
  initialize: function(){
    ListingView.prototype.initialize.apply(this, arguments);
    this.subViews.push(new CategorySummaryView({model:this.model}));
    this.subViews.push(new ChildListView({model:this.model}));
  }
})

window.WorkListingView = ListingView.extend({
  initialize: function(){
    ListingView.prototype.initialize.apply(this, arguments);
    this.subViews.push(new WorkSummaryView({model:this.model}));
    this.subViews.push(new ChildListView({model:this.model}));
  }
})

/* ------------------------------------------------------------------- */
// Listing Panel
/* ------------------------------------------------------------------- */

window.ListingPanel = Backbone.View.extend({
  el: $('#listing_panel'),
  view: null,
  model: null,
  typeViewDictionary: {
    'Portfolio': PortfolioListingView,
    'Subset.Category': CategoryListingView,
    'Subset.Work': WorkListingView
  },

  list: function(model){
    this.model = model;
    var _cls = model.get('_cls');
    var className = _cls.toLowerCase().split('.').join(' ') + ' listing';
    
    if(this.view){
      this.view.remove();
    }

    var viewFactory = this.typeViewDictionary[_cls];
    this.view = new viewFactory({'model':this.model, 'className': className});
    this.refresh();
  
  },

  refresh: function(){
    this.stopListening();
    this.empty();

    // Listening may require more granularity
    this.listenTo(
      this.model, 
      'change', 
      this.render
    );

    if(this.model.isFetched()){
      this.render();
    }

  },

  empty: function() {
    this.$el.html('');
  },

  render: function() {
    this.$el.html(this.view.render().el);
  }

});

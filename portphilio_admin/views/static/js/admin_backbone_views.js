// Portphillio Admin Backbone Views

/* ------------------------------------------------------------------- */
// Listings
/* ------------------------------------------------------------------- */

window.ListingView = Backbone.View.extend({ // Abstract class - do not instantiate! 
  
  tagName: 'div',
  archetype: null,

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
    this.subViews.push(new PortfolioChildListView({model:this.model}));
  }
})

window.CategoryListingView = ListingView.extend({
  initialize: function(){
    ListingView.prototype.initialize.apply(this, arguments);
    this.subViews.push(new CategorySummaryView({model:this.model}));
    this.subViews.push(new CategoryChildListView({model:this.model}));
  }
})

window.WorkListingView = ListingView.extend({
  initialize: function(){
    ListingView.prototype.initialize.apply(this, arguments);
    this.subViews.push(new WorkSummaryView({model:this.model}));
    this.subViews.push(new WorkChildListView({model:this.model}));
  }
})

/* ------------------------------------------------------------------- */
// Summaries
/* ------------------------------------------------------------------- */

window.SummaryView = Backbone.View.extend({
  tagName: 'div',
  className: 'summary',

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    return this;
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
// Children
/* ------------------------------------------------------------------- */

// what to render if listing has no children (possibly in children view)
window.ChildListView = Backbone.View.extend({
  tagName: 'ul',
  className: 'childlist',

  render: function(){
    var subset = this.model.get("subset");
    var list_el = this.$el;
    _.each(subset, function(subset){
      list_el.append(new CategoryChildItemView({model: new Work(subset)}).render().el);  
    });
    return this;
  }
});


window.PortfolioChildListView = Backbone.View.extend({
  tagName: 'ul',
  className: 'childlist',

  render: function(){
    var subset = this.model.get("subset");
    var list_el = this.$el;
    _.each(subset, function(subset){
      list_el.append(new CategoryChildItemView({model: new Work(subset)}).render().el);  
    });
    return this;
  }
});

window.CategoryChildListView = Backbone.View.extend({
  tagName: 'ul',
  className: 'childlist',

  render: function(){
    var subset = this.model.get("subset");
    var list_el = this.$el;
    _.each(subset, function(subset){
      list_el.append(new WorkChildItemView({model: new Work(subset)}).render().el);  
    });
    return this;
  }
});

window.WorkChildListView = Backbone.View.extend({
  tagName: 'ul',
  className: 'childlist',

  render: function(){
    var media = this.model.get("media")
    var list_el = this.$el;
    _.each(media, function(medium){
      list_el.append(new MediaChildItemView({model: new Media(medium)}).render().el);  
    });
    return this;
  }
});

/* ------------------------------------------------------------------- */
// Children Items
/* ------------------------------------------------------------------- */

window.emptyListItem = Backbone.View.extend({
  tagName: 'li',
});

window.CategoryChildItemView = Backbone.View.extend({
  tagName: 'li',
  className: 'category_in_set child',

  template:_.template($('#category_in_set').html()),

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    return this
  }
});

window.WorkChildItemView = Backbone.View.extend({
  tagName: 'li',
  className: 'work_in_set child',

  template:_.template($('#work_in_set').html()),

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    return this
  }
});

window.MediaChildItemView = Backbone.View.extend({
  tagName: 'li',
  className: 'photo_in_set child',

  template:_.template($('#photo_in_set').html()),

  render: function(){
    //console.log(this.model.get("slug"));
    this.$el.html(this.template(this.model.toJSON()));
    return this
  }
});


/* ------------------------------------------------------------------- */
// Listing Panel
/* ------------------------------------------------------------------- */

window.ListingPanel = Backbone.View.extend({
  el: $('#listing_panel'),
  view: null,
  model: null,
  archetype: null,
  dictionary: {
    "Portfolio": PortfolioListingView,
    "Subset.Category": CategoryListingView,
    "Subset.Work": WorkListingView,
  },

  list: function(model){
    // archetype/view dictionary?

    this.model = model;
    var archetype = model.get("archetype");
    var className = archetype.toLowerCase().split(".").join(" ") + " listing";
    
    if(this.view){
      this.view.remove();
    }

    var factory = this.dictionary[archetype];
    this.view = new factory({"model":this.model, "className": className});
    this.refresh();
  
  },

  empty: function() {
    this.$el.html("");
  },

  refresh: function(){
    this.stopListening();
    this.empty();
    
    // Set up panel to listen to model and render on change
    // Could be more granular, automatically setting up 
    // event handlers for each child
    this.listenTo(
      this.model, 
      "change", 
      this.render
    );

    if(this.model.isFetched()){
      this.render();
    }
    

  },

  render: function() {
    this.$el.html(this.view.render().el);
  },

  renderError: function() {
    this.$el.html(this.view.render("Unsupported Type").el);
    
  }

});

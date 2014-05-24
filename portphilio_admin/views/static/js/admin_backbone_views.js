// Portphillio Admin Backbone Views

/* ------------------------------------------------------------------- */
// Subset Panel
/* ------------------------------------------------------------------- */

window.SubsetPanel = Backbone.View.extend({
  el: $('#subset_panel'),
  view: null,
  currentModelReference: null,

  setView: function(view){
    this.view = view;
  },

  setModel: function(model){
    this.model = model;
  },

  empty: function() {
    $(this.el).html("");
  },

  refresh: function(){
    //console.log(this.model);
    this.stopListening();
    this.empty();
    
    this.listenTo(
      this.model, 
      "change", 
      this.render
    );

    //alert(this.model.isFetched());

    if(this.model.isFetched()){
      this.render();
    }
    

  },

  text: function(text){
    $(this.el).html(text);
  },

  render: function() {
    // Summary
    if(!this.view) {
      console.log('Error: no view set')
    } else {
      $(this.el).html(this.view.render().el);
    }
  }

});

/* ------------------------------------------------------------------- */
// Listings
/* ------------------------------------------------------------------- */

window.listingView = Backbone.View.extend({
  // type aware

  tagName: 'div',
  archtype: null,

  initialize: function(){
    this.archtype = this.model.get("archtype") || null;

    //alert(this.archtype);

    switch (this.archtype){
      case 'Portfolio':
        this.summary = new PortfolioSummaryView({model:this.model});
        this.list = new PortfolioChildrenView({model:this.model});
        break;
      case 'Subset.Category':
        this.summary = new CategorySummaryView({model:this.model});
        this.list = new CategoryChildrenView({model:this.model});
        break;
      
      case 'Subset.Work':
        this.summary = new WorkSummaryView({model:this.model});
        this.list = new WorkChildrenView({model:this.model});
        break;
    }

    // what to do if object requested is not of a valid type?
    // what to render if listing has no children (possibly in children view)
    
    $(this.el).append(this.summary.el)
    $(this.el).append(this.list.el);
  },

  // should happen only when data exists
  render: function(){
    this.summary.render();
    this.list.render();
    return this;
  },

  renderEmpty: function(){

  }

})

window.CategoryListingView = Backbone.View.extend({
  tagName: 'div',
  className: 'listing',

  initialize: function(){
    this.summary = new CategorySummaryView({model:this.model})
    this.list = new CategoryChildrenView({model:this.model});

    $(this.el).append(this.summary.el)
    $(this.el).append(this.list.el);
  },

  render: function(){
    this.summary.render();
    this.list.render();
    return this;
  }

})

/* ------------------------------------------------------------------- */
// Summaries
/* ------------------------------------------------------------------- */

window.PortfolioSummaryView = Backbone.View.extend({
  tagName: 'div',
  className: 'summary',
  template:_.template($('#portfolio_summary').html()),

  render: function(){
    //console.log(this.model.toJSON());
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  }

});

window.CategorySummaryView = Backbone.View.extend({
  tagName: 'div',
  className: 'summary',

  template:_.template($('#category_summary').html()),

  render: function(){
    //console.log(this.model.toJSON());
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  }

});

window.WorkSummaryView = Backbone.View.extend({
  tagName: 'div',
  className: 'work summary',

  template:_.template($('#work_summary').html()),

  render: function(){
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  }

});

/* ------------------------------------------------------------------- */
// Children
/* ------------------------------------------------------------------- */

window.PortfolioChildrenView = Backbone.View.extend({
  tagName: 'ul',
  className: 'childlist',

  render: function(){
    var subset = this.model.get("subset");
    var list_el = $(this.el);
    _.each(subset, function(subset){
      list_el.append(new CategoryChildItemView({model: new Work(subset)}).render().el);  
    });

  }
});

window.CategoryChildrenView = Backbone.View.extend({
  tagName: 'ul',
  className: 'childlist',

  render: function(){
    var subset = this.model.get("subset");
    var list_el = $(this.el);
    _.each(subset, function(subset){
      list_el.append(new WorkChildItemView({model: new Work(subset)}).render().el);  
    });

  }
});

window.WorkChildrenView = Backbone.View.extend({
  tagName: 'ul',
  className: 'childlist',

  render: function(){
    var media = this.model.get("media")
    var list_el = $(this.el);
    _.each(media, function(medium){
      list_el.append(new MediaChildItemView({model: new Media(medium)}).render().el);  
    });

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
    $(this.el).html(this.template(this.model.toJSON()));
    return this
  }
});

window.WorkChildItemView = Backbone.View.extend({
  tagName: 'li',
  className: 'work_in_set child',

  template:_.template($('#work_in_set').html()),

  render: function(){
    $(this.el).html(this.template(this.model.toJSON()));
    return this
  }
});

window.MediaChildItemView = Backbone.View.extend({
  tagName: 'li',
  className: 'photo_in_set child',

  template:_.template($('#photo_in_set').html()),

  render: function(){
    //console.log(this.model.get("slug"));
    $(this.el).html(this.template(this.model.toJSON()));
    return this
  }
});

/* ------------------------------------------------------------------- */
// Welcome
/* ------------------------------------------------------------------- */


window.WelcomeView = Backbone.View.extend({
 
    tagName: "div",
    className: "welcome summary",

    template:_.template($('#welcome_summary').html()),

    message: {message: 'Default message'},

    render:function () {
        $(this.el).html(this.template(this.message));
        return this;
    }
 
});

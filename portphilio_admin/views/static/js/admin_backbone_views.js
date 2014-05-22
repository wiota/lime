// Portphillio Admin Backbone Views

/* ------------------------------------------------------------------- */
// Subset Panel
/* ------------------------------------------------------------------- */

window.SubsetPanel = Backbone.View.extend({
  el: $('#subset_panel'),

  view: null,

  empty: function() {
    $(this.el).html("");
  },

  text: function(text){
    $(this.el).html(text);
  },

  setView: function(view){
    this.view = view;

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

window.DefaultListingView = Backbone.View.extend({
  // type aware

  tagName: 'div',
  archtype: null,

  initialize: function(){
    this.archtype = this.model.get("archtype") || null;

    switch (this.archtype){
      case 'Subset.Category':
        this.summary = new CategorySummaryView({model:this.model});
        this.list = new CategoryChildrenView({model:this.model});
        break;
      
      case 'Subset.Work':
        this.summary = new WorkSummaryView({model:this.model});
        this.list = new WorkChildrenView({model:this.model});
        break;
    }

    
    $(this.el).append(this.summary.el)
    $(this.el).append(this.list.el);
  },

  render: function(){
    this.summary.render();
    this.list.render();
    return this;
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

window.CategorySummaryView = Backbone.View.extend({
  tagName: 'div',
  className: 'summary',

  template:_.template($('#category_summary').html()),

  render: function(){
    console.log(this.model.toJSON());
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

window.WorkChildItemView = Backbone.View.extend({
  tagName: 'li',
  className: 'work_in_set',

  template:_.template($('#work_in_set').html()),

  render: function(){
    $(this.el).html(this.template(this.model.toJSON()));
    return this
  }
});

window.MediaChildItemView = Backbone.View.extend({
  tagName: 'li',
  className: 'photo_in_set',

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

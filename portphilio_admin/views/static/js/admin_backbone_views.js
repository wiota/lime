// Portphillio Admin Backbone Views

// Subset Panel

window.SubsetPanel = Backbone.View.extend({
  el: $('#subset_panel'),

  view: null,

  empty: function () {
    $(this.el).html();
  },

  setView: function(view){
    this.view = view;

  },

  render: function () {
    // Summary
    if(!this.view) {console.log('Error: no view set')}
    $(this.el).html(this.view.render().el);
  }

});

// Category

window.CategoryView = Backbone.View.extend({
  tagName: 'div',

  template:_.template($('#listing').html()),

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

window.CategorySummaryView = Backbone.View.extend({
  tagName: 'div',

  template:_.template($('#category_summary').html()),

  initialize: function(){
    
  },

  render: function(){
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  }

});

window.CategoryChildrenView = Backbone.View.extend({
  tagName: 'ul',
  className: 'childlist',

  render: function(){
    var works = this.model.get("works")
    var list_el = $(this.el);
    _.each(works, function(work){
      //var w = new Work(work);
      //console.log(w.get("title"));
      list_el.append(new WorkChildrenItemView({model: new Work(work)}).render().el);
      
    });

  }
});

window.WorkChildrenItemView = Backbone.View.extend({
  tagName: 'li',

  template:_.template($('#work_in_set').html()),

  render: function(){
    //console.log(this.model.get("slug"));
    $(this.el).html(this.template(this.model.toJSON()));
    return this
  }
});

// Welcome (temporary)

window.WelcomeView = Backbone.View.extend({
 
    template:_.template($('#welcome_summary').html()),

    render:function (content) {
        $(this.el).html(this.template(content));
        return this;
    }
 
});

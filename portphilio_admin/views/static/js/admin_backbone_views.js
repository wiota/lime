// Portphillio Admin Backbone Views


/* ------------------------------------------------------------------- */
// Listings
/* ------------------------------------------------------------------- */




/* ------------------------------------------------------------------- */
// ChildItems
/* ------------------------------------------------------------------- */

App.ChildItemView = Backbone.View.extend({ // Abstract class - do not instantiate! 
  tagName: 'li',
  className: 'child',

  events:{
    "click .delete":"delete",
    "click .update":"updateForm"
  },

  initialize: function(){
    _.bindAll(this, "destroySuccess", "destroyError");
    this.bind('destroy', this.destroySuccess, this);
  },

  delete: function(){

    this.model.destroy({
      success: this.destroySuccess,
      error: this.destroyError
    });
  
  },

  updateForm: function(){
    App.actionPanel.loadForm('update', this.model);
  },

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    return this
  },

  destroySuccess: function(){
    console.log('Delete Success!');
    this.remove();
  },

  destroyError: function(model, response, options){
    console.log(response);
  }

})

App.CategoryChildItemView = App.ChildItemView.extend({
  className: 'category_in_set child',
  template:_.template($('#category_in_set').html()),
});

App.WorkChildItemView = App.ChildItemView.extend({
  className: 'work_in_set child',
  template:_.template($('#work_in_set').html()),
});

App.MediumChildItemView = App.ChildItemView.extend({
  className: 'photo_in_set child',
  template:_.template($('#photo_in_set').html())
});

App.emptyListItem = Backbone.View.extend({
  tagName: 'li'
});


/* ------------------------------------------------------------------- */
// ChildLists
/* ------------------------------------------------------------------- */

// what to render if listing has no children (possibly in children view)

App.ChildListView = Backbone.View.extend({
  tagName: 'ul',
  className: 'childlist',
  typeViewDictionary: {
    'Subset.Category': App.CategoryChildItemView,
    'Subset.Work': App.WorkChildItemView,
    'Subset.Medium.Photo': App.MediumChildItemView 
  },
  typeWorkDictionary: {
    'Subset.Category': App.Category,
    'Subset.Work': App.Work,
    'Subset.Medium.Photo': App.Photo
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

App.PortfolioChildListView = App.ChildListView.extend({});

App.CategoryChildListView = App.ChildListView.extend({});

App.WorkChildListView = App.ChildListView.extend({});


/* ------------------------------------------------------------------- */
// Summaries
/* ------------------------------------------------------------------- */

App.SummaryView = Backbone.View.extend({ // Abstract class - do not instantiate! 
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

App.ListingView = Backbone.View.extend({ // Abstract class - do not instantiate! 
  
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

App.PortfolioListingView = App.ListingView.extend({
  initialize: function(){
    App.ListingView.prototype.initialize.apply(this, arguments);
    this.subViews.push(new App.PortfolioSummaryView({model:this.model}));
    this.subViews.push(new App.ChildListView({model:this.model}));
  }
})

App.CategoryListingView = App.ListingView.extend({
  initialize: function(){
    App.ListingView.prototype.initialize.apply(this, arguments);
    this.subViews.push(new App.CategorySummaryView({model:this.model}));
    this.subViews.push(new App.ChildListView({model:this.model}));
  }
})

App.WorkListingView = App.ListingView.extend({
  initialize: function(){
    App.ListingView.prototype.initialize.apply(this, arguments);
    this.subViews.push(new App.WorkSummaryView({model:this.model}));
    this.subViews.push(new App.ChildListView({model:this.model}));
  }
})

/* ------------------------------------------------------------------- */
// Listing Panel
/* ------------------------------------------------------------------- */

App.ListingPanel = Backbone.View.extend({
  el: $('#listing_panel'),
  view: null,
  model: null,
  typeViewDictionary: {
    'Portfolio': App.PortfolioListingView,
    'Subset.Category': App.CategoryListingView,
    'Subset.Work': App.WorkListingView
  },

  list: function(model){
    this.model = model;
    var _cls = model.get('_cls');
    var className = _cls.toLowerCase().split('.').join(' ') + ' listing';
    
    if(this.view){
      this.view.remove();
    }

    var viewFactory = App.typeDictionary[_cls]['listingView'];
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



/* ------------------------------------------------------------------- */
// Action Forms
/* ------------------------------------------------------------------- */

App.Form = Backbone.View.extend({
  tagName: 'form',
  templates: {
    "text": _.template($('#text').html()),
    "textarea": _.template($('#textarea').html())
  },

  events : {
    "change input" :"changed",
    "change textarea" :"changed"
  },

  initialize: function () {
    _.bindAll(this, "changed");
  },

  changed: function(evt){
    var changed = evt.currentTarget;
    var value = $(evt.currentTarget).val();
    var obj = {};
    obj[changed.id] = value;
    this.model.set(obj);
    this.model.save();
  },

  render: function(){  
    console.log(this.model.formSerialization.formFields);
    _.each(this.model.formSerialization.formFields, function(field, key){

      // Set value from model
      // Is this a good solution to populating fields
      // Can it be used to prevent template errors?
      value = this.model.get(key) || '';

      // Select template based on field.type
      // Causes a problem if the field type does not have a template
      var templateFunction = this.templates[field.type];

      // Pass key, field, and value to form input template function and append result
      var formInput = $(templateFunction({'key':key, "field":field, "value": value}));
      formInput.appendTo(this.$el);

    
    }, this);

    return this;
  }

})

App.updateWorkForm = App.Form.extend({
  
  
})

/* ------------------------------------------------------------------- */
// Action Panel
/* ------------------------------------------------------------------- */

App.ActionPanel = Backbone.View.extend({
  el: $('#action_panel'),
  form: null,
  model: null,
  
  formDictionary: {
    
  },

  initialize: function(){
    this.$el.html('');
  },

  loadForm: function(formtype, model){
    this.model = model;
    var _cls = model.get('_cls');
    var className = _cls.toLowerCase().split('.').join(' ') + ' form';


    if(formtype == 'update' && model.get("_cls") == 'Subset.Work'){
      this.form = new App.updateWorkForm({model: this.model, 'className': className});
    }

    if(this.model.hasForm()){
      this.render();  
    } else {
      this.model.fetchForm();
      this.listenTo(
        this.model,
        'hasForm',
        this.render
      )
    }
    
    //this.render(model.get('title'))
  },

  refresh: function(){
    this.stopListening();
    this.empty();

    this.listenTo(
      this.model, 
      'change', 
      this.render
    );

    this.render();
  },

  empty: function() {
    this.$el.html('');
  },

  render: function() {
    this.$el.html(this.form.render().el);
  }

});

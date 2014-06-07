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
    'click .delete':'delete',
    'click .update':'updateForm'
  },

  initialize: function(){
    _.bindAll(this, 'destroySuccess', 'destroyError');
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
    this.delegateEvents();
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

// what to render if listing has no listItems (possibly in listItems view)

App.SubsetListView = Backbone.View.extend({
  tagName: 'ol',
  className: 'subset_list',

  render: function(){
    listItems = this.model.get('subset');
    this.$el.empty();

    _.each(listItems, function(listItem, index){

      // Could I make this accept both models or objects
      var _cls = listItem['_cls']; // || listItem.get('_cls');
      var viewFactory = App.typeDictionary[_cls]['listItemView'];;
      var modelFactory = App.typeDictionary[_cls]['model'];

      // children should be stored and retrieved in collection
      // then they should be looked up
      // is the view the appropriate place to do this? No
      // This should be done in the Model upon parsing
      // In addition to isFetched, isDereferenced

      // Here we should make a call to the collection that matches the type
      // One dictionary!!!!!!!!!!!!!!!!!!!!!!!!!!
      var model = new modelFactory(listItem);

      //console.log('Child Item '+index+' type: ' + _cls);

      var childItemView = new viewFactory({'model':model});
      this.$el.append(childItemView.render().el);

      childItemView.listenTo(
      model,
      'change',
      childItemView.render
    );


      //this.$el.append(new CategoryChildItemView({model: new Work(child)}).render().el);
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

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    this.delegateEvents();
    return this;
  },

  events:{
    'click .update':'updateForm',
    'click .save_order':'saveSubset',
    'click .add_work':'addForm'
  },

  updateForm: function(){
    App.actionPanel.loadForm('update', this.model);
  },

  addForm: function(){
    var newWork = new App.Work({'_cls': 'Subset.Work'});
    App.actionPanel.loadForm('add', newWork);
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

  initialize: function(){
    var _cls = this.model.get('_cls');
    var viewFactory = App.typeDictionary[_cls]['summaryView'];

    this.subViews = [
      new viewFactory({model:this.model}),
      new App.SubsetListView({model:this.model})
    ]

    this.listenTo(
      this.model,
      'change',
      this.render
    );

    if(this.model.isFetched()){
      this.render();
    }
  },

  render: function(){
    _.each(this.subViews, function(subView){
      this.$el.append(subView.render().el);
    }, this)
    return this;
  }
})

App.PortfolioListingView = App.ListingView.extend({})

App.CategoryListingView = App.ListingView.extend({})

App.WorkListingView = App.ListingView.extend({})

/* ------------------------------------------------------------------- */
// Listing Panel
/* ------------------------------------------------------------------- */

App.ListingPanel = Backbone.View.extend({
  el: $('#listing_panel'),
  view: null,
  model: null,

  list: function(model){
    this.model = model;
    var _cls = model.get('_cls');
    var className = _cls.toLowerCase().split('.').join(' ') + ' listing';

    if(this.view){
      this.view.remove();
    }

    this.view = new App.ListingView({'model':this.model, 'className': className});
    this.$el.html(this.view.el)

  },

  render: function() {
    this.view.render();
  }

});



/* ------------------------------------------------------------------- */
// Action Forms
/* ------------------------------------------------------------------- */

App.FormView = Backbone.View.extend({ // Akin to ListingView
  tagName: 'form',
  templates: {
    'text': _.template($('#text').html()),
    'textarea': _.template($('#textarea').html()),
    'button': _.template($('#button').html())
  },

  events : {
    'keyup input' :'changed',
    'keyup textarea' :'changed',
    'click .save': 'save',
    'click .cancel': 'close'
  },

  initialize: function () {
    _.bindAll(this, 'changed');

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



  },

  changed: function(evt){
    var changed = evt.currentTarget;
    var value = $(evt.currentTarget).val();
    var obj = {};
    obj[changed.id] = value;
    this.model.set(obj);
    //this.model.save();

    console.log('changed '+ this.model.get('title'));
  },

  save: function(){
    this.model.save();
    return false;
  },

  close: function(){
    this.remove();
  },

  render: function(){
    _.each(this.model.formSerialization.formFields, function(field, key){

      // Set value from model
      // Is this a good solution to populating fields
      // Can it be used to prevent template errors?
      value = this.model.get(key) || '';

      // Select template based on field.type
      // Causes a problem if the field type does not have a template
      var templateFunction = this.templates[field.type];

      // Pass key, field, and value to form input template function and append result
      var formInput = $(templateFunction({'id':key, 'label':field.label, 'value': value}));
      formInput.appendTo(this.$el);


    }, this);

    $(this.templates['button']({'label':'Save', 'cls': 'save'})).appendTo(this.$el);
    $(this.templates['button']({'label':'Cancel', 'cls': 'cancel'})).appendTo(this.$el);


    return this;
  }

})

App.updateWorkForm = App.FormView.extend({


})

/* ------------------------------------------------------------------- */
// Action Panel
/* ------------------------------------------------------------------- */

App.ActionPanel = Backbone.View.extend({
  el: $('#action_panel'),
  form: null,
  model: null,

  initialize: function(){
    this.$el.html('');
  },

  loadForm: function(formtype, model){
    console.log(formtype);
    this.model = model;
    var _cls = model.get('_cls');
    var className = _cls.toLowerCase().split('.').join(' ') + ' form';

    this.form = new App.FormView({model: this.model, 'className': className});
    this.$el.html(this.form.el);
  },

  render: function() {
    this.form.render();
  }

});

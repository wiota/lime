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

  initialize: function(options){
    _.bindAll(this, 'destroySuccess', 'destroyError');
    this.bind('destroy', this.destroySuccess, this);
    this.referencer = options.referencer;
  },

  delete: function(){

    this.model.destroy({
      success: this.destroySuccess,
      error: this.destroyError
    });

  },

  updateForm: function(){
    App.actionPanel.loadForm(this.model, this.referencer);
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

App.CategoryChildItemView = App.ChildItemView.extend({
  className: 'category_in_set child',
  template:_.template($('#category_in_set').html()),
});

App.WorkChildItemView = App.ChildItemView.extend({
  className: 'work_in_set child',
  template:_.template($('#work_in_set').html()),
});

App.PhotoChildItemView = App.ChildItemView.extend({
  className: 'photo_in_set child',
  template:_.template($('#photo_in_set').html())
});

App.emptyListItem = Backbone.View.extend({
  tagName: 'li'
});


/* ------------------------------------------------------------------- */
// ChildLists
/* ------------------------------------------------------------------- */

// what to render if listing has no subsetItems (possibly in subsetItems view)

App.SubsetListView = Backbone.View.extend({
  tagName: 'ol',
  className: 'subset_list',

  render: function(){
    subsetItems = this.model.get('subset'); // should be referenced subset
    this.$el.empty();

    _.each(subsetItems, function(subsetItem, index){
      var viewFactory = App.typeDictionary[subsetItem._cls]['listItemView'];
      var childItemView = new viewFactory({'model':subsetItem, 'referencer': this.model});

      this.$el.append(childItemView.render().el);
      childItemView.listenTo(subsetItem, 'change', childItemView.render);

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
    'click .add_work':'addWorkForm',
    'click .add_photo':'addPhotoForm'
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
    //console.log(this.model.get('_cls'));
    // SummaryView and ListView subviews

    // I would love to do this:
    // App.Factories.Views[_cls]['summaryView']
    // see work.js for implementation

    var viewFactory = App.typeDictionary[_cls]['summaryView'];
    this.summary = new viewFactory({model:this.model}),
    this.list = new App.SubsetListView({model:this.model})

    // handler - maybe should be in the context of subviews
    // need 2 new events at the subset level that will fire
    // when subset is updated and when summary is updated

    this.listenTo(this.model, 'change', this.renderAll);

    this.renderAll();
  },

  renderAll: function(){
    if(this.model.isFetched()){
      this.renderSummary();
    }
    if(this.model.isDeep()){
      this.renderList();
    }
    return this;
  },

  renderSummary: function(){
    this.$el.append(this.summary.render().el);
    return this;
  },

  renderList: function(){
    this.$el.append(this.list.render().el);
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

App.imageUploadView = Backbone.View.extend({


})

App.FormView = Backbone.View.extend({ // Akin to ListingView
  tagName: 'form',
  templates: {
    'text': _.template($('#text').html()),
    'textarea': _.template($('#textarea').html()),
    'button': _.template($('#button').html()),
    's3_image': _.template($('#s3_image').html())
  },

  events : {
    'keyup input' :'changed',
    'keyup textarea' :'changed',
    'click .save': 'save',
    'click .cancel': 'close',
    'change #files': 's3_image'
  },

  initialize: function (options) {
    _.bindAll(this, 'changed');
    this.referencer = options.referencer;

    if(this.model.hasForm()){
      this.render();
    } else {
      this.model.fetchForm();
      this.listenTo(this.model, 'hasForm', this.render);
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

    this.renderActions();
    return this;
  },

  renderActions: function(){
    $(this.templates['button']({'label':'Save', 'cls': 'save'})).appendTo(this.$el);
    $(this.templates['button']({'label':'Cancel', 'cls': 'cancel'})).appendTo(this.$el);
  }

})

App.PhotoUploadForm = App.FormView.extend({
  s3_upload: null,

  initialize: function(options){
    _.bindAll(this, 'uploadProgress', 'uploadFinish', 'photoSynced');
    this.referencer = options.referencer;
    this.render();
    this.progress_bar = this.$el.find('.progress_bar');
  },

  close: function(){
    // abort image uploads
    this.remove();
  },

  renderActions: function(){
    //$(this.templates['button']({'label':'Cancel', 'cls': 'cancel'})).appendTo(this.$el);
  },

  s3_image: function(){
    console.log('Upload function called');
    this.s3_upload = new S3Upload({
      file_dom_selector: '#files',
      s3_sign_put_url: 'upload/sign_s3/',
      onProgress: this.uploadProgress,
      onFinishS3Put: this.uploadFinish,
      onError: this.uploadError
    });
  },

  uploadProgress: function(percent, message){
    this.progress_bar.css({'width':percent + '%'});
  },

  uploadFinish: function(href){
    this.progress_bar.css({'width':'0%'});

    var collection = App.typeDictionary['Subset.Medium.Photo']['collection'];
    var photo = collection.create({"href": href})

    this.listenTo(collection, 'sync', this.photoSynced);

  },

  uploadError: function(status){
    $('#status').html('Upload error: ' + status);
  },

  photoSynced: function(photo, response, options){
    var subset = this.referencer.get('subset');
    subset.unshift(photo);
    console.log(subset);
    this.referencer.trigger('change');
    this.referencer.saveSubset();
  }

})

/* ------------------------------------------------------------------- */
// Action Panel
/* ------------------------------------------------------------------- */

App.ActionPanel = Backbone.View.extend({
  el: $('#action_panel'),
  form: null,
  model: null,
  referencer: null,

  initialize: function(){
    this.$el.html('');
  },

  loadForm: function(model, referencer){
    this.model = model;
    this.referencer = referencer;
    var _cls = model.get('_cls');
    var className = _cls.toLowerCase().split('.').join(' ') + ' form';
    var formFactory = App.typeDictionary[_cls]['formView'] || App.FormView;
    this.form = new formFactory({model: this.model, 'referencer': this.referencer, 'className': className});
    this.$el.html(this.form.el);
  },

  render: function() {
    this.form.render();
  }

});

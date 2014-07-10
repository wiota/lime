/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Forms
/* ------------------------------------------------------------------- */

App.Form = {};

/* ------------------------------------------------------------------- */
// Events
/* ------------------------------------------------------------------- */

App.Form.events = {};

App.Form.events['changes'] = {
  'keyup input' :'changed',
  'keyup textarea' :'changed'
};

App.Form.events['actions'] = {
  'click .save': 'save',
  'click .cancel': 'cancel'
};

/* ------------------------------------------------------------------- */
// Templates
/* ------------------------------------------------------------------- */

App.Form.templates = {};

App.Form.templates['serialized'] = {
  'text': _.template($('#text').html()),
  'textarea': _.template($('#textarea').html()),
  'button': _.template($('#button').html())
};

App.Form.templates['photo'] = {
  's3_image': _.template($('#s3_image').html())
};

/* ------------------------------------------------------------------- */
// Upload Bar - Individual Upload Views
/* ------------------------------------------------------------------- */

App.Form.uploadView = Backbone.View.extend({
  percent: 0,
  label: null,
  tagName: 'div',
  className: 'progress_bar',
  template: _.template($('#progress_bar').html()),

  initialize: function(file, formView){
    this.formView = formView;
    this.file = file;
    this.label = file.name;
    this.percent = 0;
    _.bindAll(this, 'update', 'success', 'close', 'cancel', 'error');
    this.render();
    this.startUpload();
  },

  render: function(){
    this.$el.html(this.template({'label':this.label, 'width': this.percent}));
    this.$bar = this.$el.find('.progress_bar_fill');
    return this;
  },

  update: function(percent){
    this.$bar.width(percent + "%");
  },

  cancel: function(){
    this.uploader.abort();
    this.close();
  },

  close: function(){
    this.unbind();
    this.remove();
  },

  // view actions

  startUpload: function(){
    // S3 uploader
    this.uploader = new App.Uploader();
    this.listenTo(this.uploader, 'progress', this.update);
    this.listenTo(this.uploader, 'complete', this.success); // passes href through event
    this.listenTo(this.uploader, 'uploadError', this.error);
    this.uploader.uploadFile(this.file);
  },

  success: function(href){
    this.formView.removeUpload(this);
    this.formView.collection.createAndAddTo({"href": href}, this.formView.predecessor);
    this.close();
  },

  error: function(){
    console.log('Upload error called');
    this.$el.css({'background-color':'#f00'})
    //this.$el.fadeOut(2000, this.close);
  },

})

/* ------------------------------------------------------------------- */
// Serialized Form - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

App.Form['serialized'] = Backbone.View.extend({ // Akin to ListingView
  tagName: 'form',
  serialization: null, // Form serialization should be in a model
  templates: _.extend({},
    App.Form.templates['serialized']
  ),

  events: _.extend({},
    App.Form.events['changes'],
    App.Form.events['actions']
  ),

  initialize: function (options) {

    options = options || {};
    this.predecessor = options.predecessor || null;

    if(!this.collection.hasForm()){
      this.collection.lookupForm();
      this.listenTo(this.collection, 'hasForm', this.render);
    }

    _.bindAll(this, 'changed');
  },

  changed: function(evt){
    var changed = evt.currentTarget;
    var value = $(evt.currentTarget).val();
    var obj = {};
    obj[changed.id] = value;
    this.model.set(obj);
    //this.model.save();
  },

  save: function(){
    if(this.model.isNew()){
      this.collection.createAndAddTo(this.model, this.predecessor);
    } else {
      this.model.save();
    }

    // Prevent default action of form
    // Do some research into this
    return false;
  },

  cancel: function(){
    if(!this.model.isNew()){
      this.model.outOfSync();
    }
    this.close();
  },

  close: function(){
    this.stopListening(); // Memory Leak solution?
    this.remove();
  },

  render: function(){
    if(!this.collection.hasForm()){
      return false;
    }
    this.collection.formSerialization.result.forEach(function(field){
      value = this.model.get(field.name) || '';

      // Select template based on field.type
      // Causes a problem if the field type does not have a template
      var templateFunction = this.templates[field.type];

      // Pass key, field, and value to form input template function and append result
      var formInput = $(templateFunction({'id':field.name, 'label':field.label, 'value': value}));
      formInput.appendTo(this.$el);
    }, this);

    this.renderActions();
    this.$el.children('input').first().focus();
    return this;
  },

  renderActions: function(){
    $(this.templates['button']({'label':'Save', 'cls': 'save'})).appendTo(this.$el);
    $(this.templates['button']({'label':'Cancel', 'cls': 'cancel'})).appendTo(this.$el);
  }

})

/* ------------------------------------------------------------------- */
// Vertex - Default
/* ------------------------------------------------------------------- */

App.Form['Vertex'] = App.Form['serialized'].extend({

});

/* ------------------------------------------------------------------- */
// Photo
/* ------------------------------------------------------------------- */

App.Form['Vertex.Medium.Photo'] = App.Form['serialized'].extend({
  s3_upload: null,
  uploadsInProgress: null,
  files: null,
  className: 's3_image',

  initialize: function(options){
    options = options || {};
    this.predecessor = options.predecessor || null;
    this.uploadsInProgress = [];
  },

  events: _.extend({
      'change .files': 'handleFiles'
    },
    App.Form.events['changes'],
    App.Form.events['actions']
  ),

  templates: _.extend({},
    App.Form.templates['serialized'],
    App.Form.templates['photo']
  ),

  close: function(){
    this.cancelAllUploads();
    //this.stopListening();
    //this.remove();
  },

  renderActions: function(){
    $(this.templates['button']({'label':'Cancel', 'cls': 'cancel'})).appendTo(this.$el);
  },

  // View actions

  handleFiles: function(){
    // must happen after form is rendered
    this.$files_input = this.$el.find('.files');
    this.$files_container = this.$el.find('.files_container');

    var files = this.$files_input[0].files;
    _.each(files, function(file){
      this.initUpload(file);
    }, this);
  },

  initUpload: function(file){
    var upload = new App.Form.uploadView(file, this);
    this.$files_container.append(upload.render().el);
    this.uploadsInProgress.push(upload);
  },

  cancelAllUploads: function(){
    console.log('cancelling All Uploads');
    console.log('number of currentUploads: ' + this.uploadsInProgress.length)
    _.each(this.uploadsInProgress, function(upload, index){
      console.log(upload.file.name);
      upload.cancel();
    });
    this.uploadsInProgress = [];
  },

  removeUpload: function(upload){
    index = this.uploadsInProgress.indexOf(upload);
    if ((index = this.uploadsInProgress.indexOf(upload)) > -1) {
      this.uploadsInProgress.splice(index, 1);
    }
  }

})

/* ------------------------------------------------------------------- */
// Action Panel
// This panel should be the startpoint for all forms
/* ------------------------------------------------------------------- */

App.ActionPanel = Backbone.View.extend({
  el: $('#action_panel'),
  forms: [],
  model: null,
  predecessor: null,

  initialize: function(){
    this.$el.html('');
  },

  loadForm: function(model, predecessor){
    var _cls = model.get('_cls');
    var className = _cls.toLowerCase().split('.').join(' ') + ' form';
    // Which form?
    var formFactory = App.Form[_cls] || App.Form['Vertex'];
    var collection = App.collection[model._cls];

    var form = new formFactory({model: model, collection: collection, 'predecessor': predecessor, 'className': className});
    this.$el.append(form.el);
    form.render();
  }

});

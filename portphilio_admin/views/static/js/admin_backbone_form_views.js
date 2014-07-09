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
// Upload Bar
/* ------------------------------------------------------------------- */

App.Form.progressBar = Backbone.View.extend({
  percent: 0,
  label: null,
  tagName: 'div',
  className: 'progress_bar',
  template: _.template($('#progress_bar').html()),

  initialize: function(label){
    this.label = label;
    this.percent = 0;
    _.bindAll(this, 'update', 'close', 'error');
    this.render();
  },

  render: function(){
    this.$el.html(this.template({'label':this.label, 'width': this.percent}));
    this.$bar = this.$el.find('.progress_bar_fill');
    return this;
  },

  update: function(percent){
    this.$bar.width(percent + "%");
  },

  close: function(){
    console.log('remove');
    this.unbind();
    this.remove();
  },

  error: function(){
    console.log('progress bar error');
    this.$el.css({'background-color':'#f00'})
    //this.$el.fadeOut(2000, this.close);
  }


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

  initialize: function(options){
    options = options || {};
    this.predecessor = options.predecessor || null;
    this.uploadsInProgress = [];
    _.bindAll(this, 'uploadSuccess');
  },

  events: _.extend({
      'change #files': 'handleFiles'
    },
    App.Form.events['changes'],
    App.Form.events['actions']
  ),

  templates: _.extend({},
    App.Form.templates['serialized'],
    App.Form.templates['photo']
  ),

  close: function(){
    this.abort();
    this.stopListening();
    this.remove();
  },

  abort: function(){
    console.log('abort');
    _.each(this.uploadsInProgress, function(upload, index){
      upload.progress.close();
      console.log(upload.file.name);
    })
  },

  renderActions: function(){
    $(this.templates['button']({'label':'Cancel', 'cls': 'cancel'})).appendTo(this.$el);
  },

  handleFiles: function(){
    // must happen after form is rendered
    this.$files_input = this.$el.find('#files');
    this.$files_container = this.$el.find('.files_container');

    var files = this.$files_input[0].files;
    _.each(files, function(file){
      this.uploadsInProgress.push(this.initUpload(file));
    }, this);
  },

  initUpload: function(file){
    var up = {};
    up.file = file;
    _.extend(up, Backbone.Events);

    up.progress = new App.Form.progressBar(file.name);
    this.$files_container.append(up.progress.render().el);

    // S3 uploader
    up.uploader = new App.Uploader();
    up.listenTo(up.uploader, 'progress', up.progress.update);
    up.listenTo(up.uploader, 'complete', up.progress.close);
    up.listenTo(up.uploader, 'complete', this.uploadSuccess); // passes href through event
    up.listenTo(up.uploader, 'uploadError', up.progress.error);
    up.listenTo(up.uploader, 'uploadError', this.uploadError);
    up.uploader.uploadFile(up.file);
    return up;
  },

  uploadSuccess: function(href){
    console.log(href);
    this.collection.createAndAddTo({"href": href}, this.predecessor);
  },

  uploadError: function(status){
    console.log('Error');
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

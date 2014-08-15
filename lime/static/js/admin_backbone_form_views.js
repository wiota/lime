/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Forms
/* ------------------------------------------------------------------- */

App.FormView = {};

// This section of the app is getting bloated. I need to break off
// parts of it into actions which can be floated above the forms
// themselves. Pending actions are also going to need to be
// kept track of as well.

/* ------------------------------------------------------------------- */
// Templates
/* ------------------------------------------------------------------- */

App.FormView.templates = {
  'text': _.template($('#text').html()),
  'textarea': _.template($('#textarea').html()),
  'button': _.template($('#button').html()),
  'file_upload': _.template($('#html5_file_upload').html())
};

/* ------------------------------------------------------------------- */
// Serialized Fields triggers change event and passes change object
/* ------------------------------------------------------------------- */

App.FormView.SerialFieldsView = Backbone.View.extend({
  tagName: 'fieldset',
  className: 'serial_fields',
  serialization: null,
  templates: {
    'text': _.template($('#text').html()),
    'textarea': _.template($('#textarea').html()),
    'button': _.template($('#button').html()),
    'file_upload': _.template($('#html5_file_upload').html())
  },

  events: {
    'blur input':'focusEnd',
    'blur textarea':'focusEnd'
  },

  initialize: function(){
    this.isRendered = false;
    if(!this.collection.hasForm()){
      this.collection.lookupForm();
      this.listenToOnce(this.collection, 'hasForm', this.render);
    }
  },

  render: function(){
    if(!this.collection.hasForm()){return false;}
    // parse out RESULT
    _.each(this.collection.formSerialization.result, function(field){

      var hasExistingValue = this.model && this.model.get(field.name);
      value = hasExistingValue || '';
      var templateFunction = this.templates[field.type];

      // Pass key, field, and value to form input template function and append result
      var formInput = $(templateFunction({'id':field.name, 'label':field.label, 'value': value}));
      formInput.appendTo(this.$el);
    }, this);

    this.focusStart();
    this.delegateEvents();
    //this.$el.children('input').on('blur', function(){console.log('blur')})
    this.isRendered = true;
    this.trigger('rendered');
    return this;
  },

  focusStart: function(){
    this.$el.children('input').first().focus().select();
  },

  focusEnd: function(){
    console.log('focusEnd');
    //this.focusStart();
  },

  events: {
    'input input' :'attributeChange',
    'input textarea' :'attributeChange',
  },

  attributeChange: function(evt){
    var inputId = evt.currentTarget.id;
    var value = $(evt.currentTarget).val();
    var changeObject = {}
    changeObject[inputId] = value;
    this.trigger('change', changeObject);
  }

});

/* ------------------------------------------------------------------- */
// Upload Field - triggers change event and passes files to handlers
/* ------------------------------------------------------------------- */

App.FormView.FileUploadView = Backbone.View.extend({
  tagName: 'fieldset',
  className: 'file_upload',
  template: App.FormView.templates['file_upload'],

  events: {
    'changed .files': 'filesChange',
    'click .files_container': 'click',
    'dragover .files_container': 'dragover',
    'dragleave .files_container': 'dragleave',
    'drop .files_container': 'drop'
  },

  initialize: function(options){
    options = options || {};
    this.predecessor = options.predecessor || null;
    this.nesting = options.nesting || [];
    this.uploadLabel = options.uploadLabel || 'Drop files here';
    _.bindAll(this, 'render');
  },

  render: function(){
    var obj = {'label':this.uploadLabel};
    this.$el.html(this.template(obj));
    this.$fileInput = this.$el.find('.files');
    return this;
  },

  // drag and drop

  dragover: function(event){
    this.$el.addClass('over');
    this.cancelEvent(event);
  },

  dragleave: function(event){
    this.$el.removeClass('over');
    this.cancelEvent(event);
  },

  cancelEvent: function(event){
    event.preventDefault();
  },

  drop: function(event){
    this.change(event.originalEvent.dataTransfer.files);
    this.$el.removeClass('over');
    this.cancelEvent(event);
  },


  // form input

  filesChange: function(event){
    this.change(this.$fileInput[0].files);
    this.cancelEvent(event);
  },

  click: function(event){
    this.$fileInput.click();
  },

  reset: function(){
    this.render();
  },

  change: function(files){
    this.trigger('change', files)
    this.reset();
  }

})

/* ------------------------------------------------------------------- */
// Saved
/* ------------------------------------------------------------------- */

App.FormView.SaveView = Backbone.View.extend({
  tagName: 'div',
  className: 'save_status',

  template: _.template($('#button').html()),

  initialize: function(options){
    this.listenTo(this.model, 'saved', this.saved);
    this.listenTo(this.model, 'unsaved', this.unsaved);
    _.bindAll(this, 'render', 'statusUnpersisted', 'statusUnsaved', 'statusError', 'statusSaving', 'statusSaved', 'triggerSave', 'triggerClose');
  },

  statusUnpersisted: function(){
    this.$savebutton.attr('class', 'input save unpersisted');
  },

  statusUnsaved: function(){
    this.$savebutton.attr('class', 'input save unsaved');
    this.$savebutton.val('Save Now');
    this.$savebutton.attr('disabled', false);
    this.$savebutton.off();
    this.$savebutton.on('click', this.triggerSave);
  },

  statusSaving: function(){
    this.$savebutton.attr('class', 'input save saving');
    this.$savebutton.val('Saving');
    this.$savebutton.attr('disabled', true);
    this.$savebutton.off();

  },

  statusSaved: function(){
    this.$savebutton.attr('class', 'input save saved');
    this.$savebutton.val('Saved');
    this.$savebutton.attr('disabled', true);
    this.$savebutton.children('.conjugate').css({position:'relative', top: '20px'});
    this.$savebutton.children('.conjugate').animate({position:'relative', top: '0px'});
    this.$savebutton.off();

  },

  statusError: function(){
    this.$savebutton.attr('class', 'input save error');
    this.$savebutton.val('Not Saved');
    this.$savebutton.on('click', this.triggerSave);

  },

  render: function(message){
    this.$savebutton = $(this.template({'label':'&nbsp;','cls': 'save'}));
    this.$closebutton = $(this.template({'label':'Close','cls': 'close'}));

    if(this.model.isNew()){
      this.statusUnpersisted();
    } else {
      this.statusSaved();
    }

    this.$el.html('');
    this.$el.append(this.$savebutton);
    this.$el.append(this.$closebutton);

    this.$closebutton.on('click', this.triggerClose);
  },

  triggerSave: function(){
    this.trigger('save');
  },

  triggerClose: function(){
    this.trigger('close');
  }

})

/* ------------------------------------------------------------------- */
// Vertex - Attribute form
/* ------------------------------------------------------------------- */

App.FormView['Vertex'] = Backbone.View.extend({

  passableOptions: ['model', 'predecessor', 'collection'],
  tagName: 'form',

  events: {
    'submit' :'submit',
    'keypress input' :'keyCheck',
  },

  initialize: function(options){
    this.options = options || {};
    this.predecessor = options.predecessor || null;
    this.allowPhotos = options.allowPhotos || true;
    this.newPhotoNesting = options.newPhotoNesting || [];

    this.children = [];
    this.childOptions = _.pick(this.options, this.passableOptions);

    if(this.allowPhotos){
      this.appendFileUpload();
    }
    this.appendAtrributeFields();

    this.appendSaveView();
    this.listenTo(this.model, 'sync', this.saveView.statusSaved);
    this.listenTo(this.model, 'error', this.saveView.statusError);

    _.bindAll(this, 'close', 'collapse');

  },

  appendFileUpload: function(){
    this.fileUpload = new App.FormView.FileUploadView(this.childOptions),
    this.$el.append(this.fileUpload.el);
    this.listenTo(this.fileUpload, 'change', this.filesChanged);
    this.children.push(this.fileUpload);
  },

  appendAtrributeFields: function(){
    this.attributeFields = new App.FormView.SerialFieldsView(this.childOptions)
    this.$el.append(this.attributeFields.el);
    this.listenTo(this.attributeFields, 'change', this.attributesChanged);
    this.children.push(this.attributeFields);
  },

  appendSaveView: function(){
    this.saveView = new App.FormView.SaveView(this.childOptions);
    this.$el.append(this.saveView.el);
    this.listenTo(this.saveView, 'save', this.save)
    this.listenTo(this.saveView, 'close', this.collapse)
    this.children.push(this.saveView);
  },

  render: function(){
    this.listenToOnce(this.attributeFields, 'rendered', this.fileUpload.render);
    this.listenToOnce(this.attributeFields, 'rendered', this.saveView.render)
    this.attributeFields.render();
    return this;
  },

  collapse: function(){
    console.log('collapse');
    if(this.model.isModified()){
      this.save();
    }
    this.close();
    // if animated, need to call stop listening on serialized attribute forms
    //this.$el.animate({'height': 0, 'opacity':.3}, 300, 'linear', this.close);
  },

  // Events

  filesChanged: function(files){

    file = files[0];

    this.model;
    this.newPhotoNesting;
    this.predecessor;

    var a = function(msg){
      console.log(msg);
      console.log(_.rest(arguments));
      this.trigger('complete', this);
    }

    var r = App.requestPanel.serial([
      {'func': 'batchPhotosToVertex', 'args': [files, this.newPhotoNesting, this.model, this.predecessor]},
    ]);

    /*
    App.actionPanel.addBatch(files, this.model, this.newPhotoNesting);
    if(this.model.isNew()){
      console.log(this.model.get('title') + ' Saving before Batch');
      this.collection.createAndAddTo(this.model, this.predecessor);
    }
    */
  },

  attributesChanged: function(changeObject){
    this.saveView.statusUnsaved();
    this.model.set(changeObject);
    this.savePeriodically();
  },

  submit: function(evt){
    this.collapse();
    console.log('Submit');
    return false;
  },

  keyCheck: function(evt){
    if(evt.which == 13){
      this.collapse();
      console.log('Enter pressed');
      return false;
    }
  },

  save: function(){
    if(!this.model.isModified()){
      return false;
    }
    this.saveView.statusSaving();

    if(this.model.isNew()){
      console.log(this.model.get('title') + ' New Saving');
      // Use Request Manager Here
      this.collection.createAndAddTo(this.model, this.predecessor);
    } else {
      this.model.saveAttributes();
    }
    return false;
  },

  savePeriodically: _.debounce(function(){
    this.save();
  }, 1000),

  cancel: function(){
    if(!this.model.isNew() && this.model.isModified()){
      this.model.outOfSync();
    }
    this.close();
  }


});

/* ------------------------------------------------------------------- */
// Cover Photo Form
/* ------------------------------------------------------------------- */

App.FormView['Cover'] = Backbone.View.extend({

  passableOptions: ['model'],
  tagName: 'form',

  events: {},

  initialize: function(options){
    this.options = options || {};

    this.children = [];
    this.childOptions = _.pick(this.options, this.passableOptions);

    this.appendFileUpload();
    this.appendSaveView();

    this.listenTo(this.model, 'sync', this.saveView.statusSaved);
    this.listenTo(this.model, 'error', this.saveView.statusError);

    _.bindAll(this, 'close', 'collapse');

  },

  appendFileUpload: function(){
    this.fileUpload = new App.FormView.FileUploadView(this.childOptions),
    this.$el.append(this.fileUpload.el);
    this.listenTo(this.fileUpload, 'change', this.filesChanged);
    this.children.push(this.fileUpload);
  },

  appendSaveView: function(){
    this.saveView = new App.FormView.SaveView(this.childOptions);
    this.$el.append(this.saveView.el);
    this.listenTo(this.saveView, 'save', this.save)
    this.listenTo(this.saveView, 'close', this.collapse)
    this.children.push(this.saveView);
  },

  render: function(){
    this.fileUpload.render();
    this.saveView.render();
    return this;
  },

  collapse: function(){
    console.log('collapse');
    if(this.model.isModified()){
      this.save();
    }
    this.close();
    // if animated, need to call stop listening on serialized attribute forms
    //this.$el.animate({'height': 0, 'opacity':.3}, 300, 'linear', this.close);
  },

  // Events

  filesChanged: function(files){

    file = files[0];
    this.model;
    App.requestPanel.serial([
      {'func': 'uploadCoverPhoto', 'args': [file, this.model]},
    ]);

  },

  attributesChanged: function(changeObject){
    this.saveView.statusUnsaved();
    this.model.set(changeObject);
    this.savePeriodically();
  },

  submit: function(evt){
    this.collapse();
    console.log('Submit');
    return false;
  },

  save: function(){
    if(!this.model.isModified()){
      return false;
    }
    this.saveView.statusSaving();

    if(this.model.isNew()){
      console.log(this.model.get('title') + ' New Saving');
      this.collection.createAndAddTo(this.model, this.predecessor);
    } else {
      console.log(this.model.get('title') + ' Old Saving');
      this.model.save();
    }
    return false;
  },

  savePeriodically: _.debounce(function(){
    this.save();
  }, 1000),

  cancel: function(){
    if(!this.model.isNew() && this.model.isModified()){
      this.model.outOfSync();
    }
    this.close();
  }


});



/* ------------------------------------------------------------------- */
// Action Panel
// This panel should be the startpoint for all forms
/* ------------------------------------------------------------------- */

/* ------------------------------------------------------------------- */
// Templates
/* ------------------------------------------------------------------- */

App.ActionPanel = Backbone.View.extend({
  el: $('#action_panel'),
  forms: [],
  batches: [],
  model: null,
  predecessor: null,

  initialize: function(){
    this.$el.html('');

    // Where should this go?
    window.addEventListener('dragover', function(e){
      e.preventDefault();
    })
    window.addEventListener('drop', function(e){
      e.preventDefault();
    })

  },

  loadVertexForm: function(model, predecessor){
    this.closeForms();
    var _cls = model.get('_cls');
    var className = App.clsToClass(_cls) + ' form';

    if(_cls == 'Vertex.Work'){
      var newPhotoNesting = [];
    } else if (_cls == 'Vertex.Category'){
      var newPhotoNesting = ['Vertex.Work'];
    }

    var form = new App.FormView['Vertex']({
      'predecessor': predecessor,
      'model': model,
      'collection': App.collection[_cls],
      'newPhotoNesting': newPhotoNesting,
      'className': className
    });

    this.$el.css({'right': '-100%'});

    this.$el.append(form.el);
    form.render();
    this.forms.push(form);
    this.$el.animate({'right': '0'}, 200);
  },

  loadCoverForm: function(model){
    this.closeForms();
    var _cls = model.get('_cls');
    var className = 'cover form';

    var form = new App.FormView['Cover']({
      'model': model
    });

    this.$el.css({'right': '-100%'});

    this.$el.append(form.el);
    form.render();
    this.forms.push(form);
    this.$el.animate({'right': '0'}, 200);
  },

  /*
  batchToManyCategory: function(predecessor){
    var form = new App.FormView['Vertex.Medium.Photo']({
      'collection': App.collection['Vertex.Medium.Photo'],
      'predecessor': predecessor,
      'nesting': ['Vertex.Work', 'Vertex.Category'],
      'className': 'many_categories file_upload',
      'uploadLabel': "Many categories"
    });

    this.$el.append(form.el);
    form.render();
    this.forms.push(form);
  },

  batchToManyWork: function(predecessor){
    var form = new App.FormView['Vertex.Medium.Photo']({
      'collection': App.collection['Vertex.Medium.Photo'],
      'predecessor': predecessor,
      'nesting': [],
      'className': 'many_works file_upload',
      'uploadLabel': "Many works"
    });

    this.$el.append(form.el);
    form.render();
    this.forms.push(form);
  },

  batchToManyPhoto: function(predecessor){
    var form = new App.FormView['Vertex.Medium.Photo']({
      'collection': App.collection['Vertex.Medium.Photo'],
      'predecessor': predecessor,
      'nesting': [],
      'className': 'many_photos file_upload',
      'uploadLabel': "Many photos"
    });

    this.$el.append(form.el);
    form.render();
    this.forms.push(form);
  },

  loadBatchForms: function(predecessor){
    var _cls = predecessor.get('_cls');

    // This form loading needs to be improved and expanded on
    // including the ability to add all items to a single pred

    if(_cls == 'Vertex.Category' || _cls == 'Vertex.Body'){
      this.batchToManyCategory(predecessor);
      this.batchToManyWork(predecessor);
    }

    if(_cls == 'Vertex.Work'){
      // Photos
      this.batchToManyPhoto(predecessor);
    }
  },
  */

  closeForms: function(){
    _.each(this.forms, function(form, index){
      form.collapse();
    });
    this.forms = [];
  },

  /*
  addBatch: function(files, predecessor, nesting){
    // hopefully get rid of this function
    var _cls = nesting[0] || 'Vertex.Medium.Photo';
    var className = App.clsToClass(_cls) + ' batch';
    var batch = new App.Upload.batchView({'className': className, 'files':files, 'predecessor':predecessor, 'nesting':nesting});
    this.$el.prepend(batch.render().el);
    batch.upload();
    this.batches.push(batch);
  }
  */

});

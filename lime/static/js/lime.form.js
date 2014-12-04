/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Forms
/* ------------------------------------------------------------------- */

LIME.FormView = {};

/* ------------------------------------------------------------------- */
// Templates
/* ------------------------------------------------------------------- */

LIME.FormView.templates = {
  'text': _.template($('#text').html()),
  'textarea': _.template($('#textarea').html()),
  'button': _.template($('#button').html()),
  'file_upload': _.template($('#html5_file_upload').html()),
  'cover_display': _.template($('#cover_display').html()),
  'datetime-local': function(){return false}

};

/* ------------------------------------------------------------------- */
// Serialized Fields triggers change event and passes change object
/* ------------------------------------------------------------------- */

LIME.FormView.SerialFieldsView = Backbone.View.extend({
  tagName: 'fieldset',
  className: 'serial_fields',
  serialization: null,
  templates: LIME.FormView.templates,

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
    'input textarea' :'attributeChange'
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
// God attributes - features not available to casual users
/* ------------------------------------------------------------------- */

LIME.FormView.GodAttributes = Backbone.View.extend({
  tagName: 'fieldset',
  className: 'god_attributes god',
  template: _.template($('#god_attributes').html()),

  events: {
    'input change' :'attributeChange'
  },

  initialize: function(options){
    _.bindAll(this, 'render', 'attributeChange');
  },

  render: function(){
    var deletable = this.model.get('deletable')
    var obj = {'deletable':""};
    if(this.model.get('deletable')){
      obj.deletable = "checked='checked'";
    }
    this.$el.html(this.template(obj));
    this.$el.find('#deletable').change(this.attributeChange);
    return this;
  },

  attributeChange: function(evt){
    var inputId = evt.currentTarget.id;
    var value = $(evt.currentTarget).is(':checked');

    var changeObject = {}
    changeObject[inputId] = value;
    console.log(this);
    this.trigger('change', changeObject);
  }
})

/* ------------------------------------------------------------------- */
// Upload Field - triggers change event and passes files to handlers
/* ------------------------------------------------------------------- */

LIME.FormView.FileUploadView = Backbone.View.extend({
  tagName: 'fieldset',
  className: 'file_upload',
  template: LIME.FormView.templates['file_upload'],

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
    this.uploadLabel = options.uploadLabel || '';
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
    console.log('over');
    //this.cancelEvent(event);
  },

  dragleave: function(event){
    this.$el.removeClass('over');
    console.log('leave');
    //this.cancelEvent(event);
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
    console.log('change')
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

LIME.FormView.SaveView = Backbone.View.extend({
  tagName: 'div',
  className: 'save_view',

  template: _.template($('#button').html()),

  initialize: function(options){
    this.listenTo(this.model, 'saved', this.saved);
    this.listenTo(this.model, 'unsaved', this.unsaved);
    _.bindAll(this, 'render', 'statusUnpersisted', 'statusUnsaved', 'statusError', 'statusSaving', 'statusSaved', 'triggerSave', 'triggerClose');
  },

  statusUnpersisted: function(){
    this.$el.attr('class', this.className + ' unpersisted');
  },

  statusUnsaved: function(){
    this.$el.attr('class', this.className + ' unsaved');
    this.$savebutton.val('save now');
    this.$closebutton.val('save and close');
    this.$savebutton.attr('disabled', false);
    this.$savebutton.off();
    this.$savebutton.on('click', this.triggerSave);
  },

  statusSaving: function(){
    this.$el.attr('class', this.className + ' saving');
    this.$savebutton.val('saving');
    this.$savebutton.attr('disabled', true);
    this.$savebutton.off();

  },

  statusSaved: function(){
    this.$el.attr('class', this.className + ' saved');
    this.$savebutton.val('saved');
    this.$closebutton.val('close');
    this.$savebutton.attr('disabled', true);
    this.$savebutton.off();

  },

  statusError: function(){
    this.$el.attr('class', this.className + ' error');
    this.$savebutton.val('not saved!');
    this.$savebutton.on('click', this.triggerSave);

  },

  render: function(message){
    this.$savebutton = $(this.template({'label':' ','cls': 'save'}));
    this.$closebutton = $(this.template({'label':'Close','cls': 'close'}));

    if(this.model.isNew()){
      this.statusUnpersisted();
    } else {
      this.statusSaved();
    }

    this.$el.html('');
    this.$el.append(this.$closebutton);
    this.$el.append(this.$savebutton);

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

LIME.FormView['Vertex'] = Backbone.View.extend({

  passableOptions: ['model', 'predecessor', 'collection'],
  tagName: 'form',

  events: {
    'submit' :'submit',
    'keypress input' :'keyCheck',
  },

  initialize: function(options){
    this.options = options || {};
    this.predecessor = options.predecessor || null;
    this.photoNesting = options.photoNesting || [];

    this.children = [];
    this.childOptions = _.pick(this.options, this.passableOptions);

    //this.appendFileUpload();
    this.appendSaveView();
    this.appendGodAttributes();
    this.appendAtrributeFields();


    this.listenTo(this.model, 'sync', this.saveView.statusSaved);
    this.listenTo(this.model, 'error', this.saveView.statusError);

    _.bindAll(this, 'collapse');

  },

  appendGodAttributes: function(){
    this.godAttributes = new LIME.FormView.GodAttributes(this.childOptions)
    this.$el.append(this.godAttributes.el);
    this.listenTo(this.godAttributes, 'change', this.attributesChanged);
    this.children.push(this.godAttributes);
  },


  appendAtrributeFields: function(){
    this.attributeFields = new LIME.FormView.SerialFieldsView(this.childOptions)
    this.$el.append(this.attributeFields.el);
    this.listenTo(this.attributeFields, 'change', this.attributesChanged);
    this.children.push(this.attributeFields);
  },

  appendSaveView: function(){
    this.saveView = new LIME.FormView.SaveView(this.childOptions);
    this.$el.append(this.saveView.el);
    this.listenTo(this.saveView, 'save', this.save)
    this.listenTo(this.saveView, 'close', this.collapse)
    this.children.push(this.saveView);
  },

  render: function(){
    //this.listenToOnce(this.attributeFields, 'rendered', this.fileUpload.render);
    this.listenToOnce(this.attributeFields, 'rendered', this.saveView.render)
    this.listenToOnce(this.attributeFields, 'rendered', this.godAttributes.render)
    this.attributeFields.render();
    return this;
  },

  collapse: function(){
    if(this.model.isModified()){
      this.save();
    }
    this.close();
    LIME.actionPanel.rollUp();
  },

  // Events

  attributesChanged: function(changeObject){
    this.saveView.statusUnsaved();
    this.model.set(changeObject);
    //this.savePeriodically();
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
    this.model.modified = false;
    // Lets use a different form for new models
    if(this.model.isNew()){
      LIME.requestPanel.one([
        {'func': 'graphRequest', 'args': [
          [this.model],
          [[this.predecessor, this.model]]
        ]},
      ]);
      //this.collection.createAndAddTo(this.model, this.predecessor);
    } else {
      LIME.requestPanel.one([
        {'func': 'updateVertexRequest', 'args': [this.model]},
      ]);
      //this.model.saveAttributes();
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
    LIME.actionPanel.rollUp();
  }


});

/* ------------------------------------------------------------------- */
// Cover Photo Form
/* ------------------------------------------------------------------- */

LIME.FormView['Cover'] = Backbone.View.extend({

  passableOptions: ['model'],
  tagName: 'form',
  events: {},

  initialize: function(options){
    this.options = options || {};

    this.children = [];
    this.childOptions = _.pick(this.options, this.passableOptions);

    this.listenTo(this.model, 'summaryChanged', this.render)
    _.bindAll(this, 'close', 'collapse', 'noCover');
  },

  appendFileUpload: function(){
    this.fileUpload = new LIME.FormView.FileUploadView(this.childOptions),
    this.$el.append(this.fileUpload.el);
    this.listenTo(this.fileUpload, 'change', this.filesChanged);
    this.children.push(this.fileUpload);
  },

  appendSaveView: function(){
    this.saveView = new LIME.FormView.SaveView(this.childOptions);
    this.$el.append(this.saveView.el);
    this.listenTo(this.saveView, 'save', this.save)
    this.listenTo(this.saveView, 'close', this.collapse)
    this.children.push(this.saveView);
  },

  appendCover: function(covers){
    console.log('covering');
    this.$cover = $(LIME.FormView.templates['cover_display']());
    this.$removebutton = $(LIME.FormView.templates['button']({'label':'remove cover','cls': 'remove_cover delete'}));
    // add cover images
    _.each(this.model.get('cover'), function(coverItem){
      this.$cover.append("<img src='"+coverItem.href+"?w=500' alt='' />");
    }, this);

    // append
    this.$cover.append(this.$removebutton);
    this.$el.append(this.$cover);

    // events
    this.$removebutton.on('click', this.noCover);
  },

  render: function(){
    this.$el.html('')
    this.appendSaveView();
    this.appendFileUpload();
    var cover = this.model.get('cover');
    if(cover && cover.length > 0){
      this.appendCover(cover);
    }
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
    LIME.actionPanel.rollUp();
  },

  // Events

  filesChanged: function(files){
    file = files[0];
    this.model;
    LIME.requestPanel.serial([
      {'func': 'uploadCoverPhoto', 'args': [file, this.model]},
    ]);
  },

  noCover: function(){
    console.log(this);
    LIME.requestPanel.serial([
      {'func': 'removeCover', 'args': [this.model]},
    ]);
  }

});

/* ------------------------------------------------------------------- */
// Succset Form
/* ------------------------------------------------------------------- */


LIME.FormView['Succset'] = Backbone.View.extend({
  passableOptions: ['model', 'uploadLabel'],
  tagName: 'form',

  initialize: function(options){
    this.options = options || {};
    this.photoNesting = options.photoNesting || [];
    this.children = [];
    this.childOptions = _.pick(this.options, this.passableOptions);
    this.appendFileUpload();
    _.bindAll(this, 'close', 'collapse');
  },

  appendFileUpload: function(){
    this.fileUpload = new LIME.FormView.FileUploadView(this.childOptions),
    this.$el.append(this.fileUpload.el);
    this.listenTo(this.fileUpload, 'change', this.filesChanged);
    this.children.push(this.fileUpload);
  },

  render: function(){
    this.fileUpload.render();
    return this;
  },

  collapse: function(){
    console.log('collapse');
    if(this.model.isModified()){
      this.save();
    }
    this.close();
    LIME.actionPanel.rollUp();
  },

  // Events

  filesChanged: function(files){
    console.log('changed')
    this.model;
    this.photoNesting;
    this.predecessor;

    LIME.requestPanel.one([
      {'func': 'batchPhotosToVertex', 'args': [files, this.photoNesting, this.model, null]},
    ]);

  }

});



/* ------------------------------------------------------------------- */
// Action Panel
// This panel should be the startpoint for all forms
/* ------------------------------------------------------------------- */

/* ------------------------------------------------------------------- */
// Templates
/* ------------------------------------------------------------------- */

LIME.ActionPanel = Backbone.View.extend({
  el: $('#action_panel'),
  form: null,
  batches: [],
  model: null,
  predecessor: null,

  initialize: function(){
    this.$el.html('');
  },

  loadVertexForm: function(model, predecessor){

    this.closeForms();
    if(this.form && model === model){
      this.form = null;
      return false;
    }
    var _cls = model.get('_cls');
    var className = model.cssClass() + ' form';

    this.form = new LIME.FormView['Vertex']({
      'predecessor': predecessor,
      'model': model,
      'collection': LIME.collection[_cls],
      'className': className
    });

    this.$el.html(this.form.el);
    this.form.render();
    this.rollDown();
  },

  loadCoverForm: function(model){
    this.closeForms();
    var _cls = model.get('_cls');
    var className = 'cover form';

    this.form = new LIME.FormView['Cover']({
      'model': model
    });

    this.$el.append(this.form.el);
    this.form.render();
    this.rollDown();
  },

  rollUp: function(){
    this.$el.removeClass('show');
    //this.$el.css({'bottom': '100%'}, 200);
  },

  rollDown: function(){
    this.$el.addClass('show');
    //this.$el.css({'bottom': '0'}, 200);
  },

  closeForms: function(){
    if(this.form){
      this.form.collapse();
      this.form = null;
    }
  }

});

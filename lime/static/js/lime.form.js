/* ------------------------------------------------------------------- */
// Form Views
/* ------------------------------------------------------------------- */

LIME.Forms = {};

LIME.Forms.ENTERKEY = 13;

/* ------------------------------------------------------------------- */
// Fields - Should be replaced by views
/* ------------------------------------------------------------------- */

LIME.Forms.templates = {
  'text': _.template($('#text').html()),
  'textarea': _.template($('#textarea').html()),
  'button': _.template($('#button').html()),
  'file_upload': _.template($('#html5_file_upload').html()),
  'cover_display': _.template($('#cover_display').html()),
  'datetime-local': function(){return false}

};

/* ------------------------------------------------------------------- */
// Fieldsets
/* ------------------------------------------------------------------- */


/* ------------------------------------------------------------------- */
// Schema Fieldset - triggers change event and passes change object
/* ------------------------------------------------------------------- */

LIME.Forms.Attributes = Backbone.View.extend({
  tagName: 'fieldset',
  className: 'serial_fields',
  templates: LIME.Forms.templates,

  events: {
    'blur input':'focusEnd',
    'blur textarea':'focusEnd',
    'input input' :'attributeChange',
    'input textarea' :'attributeChange'
  },

  initialize: function(){
    this.fieldSchema = LIME.host.vertexSchema[this.model.vertexType];
    this.render();
    this.keys = null;
  },

  render: function(){
    if(!this.fieldSchema){return false;}
    this.$el.empty();

    // Use field schema to generate form
    this.keys = _.map(this.fieldSchema, function(field, key){

      // TODO, migrate to field views
      var templateFunction = this.templates[field.type];

      // Use defaults within the view for this
      var formData = {
        'name':field.name,
        'label':field.label,
        'value': (this.model && this.model.get(field.name)) || '',
        'tabindex': (key+1)
      }

      // Pass key, field, and value to form input template function and append result
      $(templateFunction(formData)).appendTo(this.$el);

      return key;
    }, this);

    this.focusStart();
    this.delegateEvents();
    return this;
  },

  focusStart: function(){
    this.$el.children('input').first().focus().select();
  },

  // try focus guarding - also, may want to move this to form level
  focusEnd: function(evt){
    if($(evt.currentTarget).attr('tabindex') == this.keys.length){
      this.focusStart();
    }
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
// God fieldset - features not available to casual users
/* ------------------------------------------------------------------- */

LIME.Forms.GodAttributes = Backbone.View.extend({
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
    var obj = {'deletable':"", 'pub':''};
    if(this.model.get('deletable')){
      obj.deletable = "checked='checked'";
    }
    if(this.model.get('public')){
      obj.pub = "checked='checked'";
    }
    obj.layout = this.model.get('layout') || '';
    obj.slug = this.model.get('slug') || '';
    this.$el.html(this.template(obj));
    this.$el.find('#deletable').change(this.attributeChange);
    return this;
  },

  attributeChange: function(evt){
    var inputId = evt.currentTarget.id;
    var value = $(evt.currentTarget).is(':checked');

    var changeObject = {}
    changeObject[inputId] = value;
    this.trigger('change', changeObject);
  }
})

/* ------------------------------------------------------------------- */
// Upload Fieldset - triggers change event and passes files to handlers
/* ------------------------------------------------------------------- */

LIME.Forms.FileUploadView = Backbone.View.extend({
  tagName: 'fieldset',
  className: 'file_upload',
  template: LIME.Forms.templates['file_upload'],

  events: {
    'changed .files': 'filesChange',
    'click .files_container': 'click',
    'dragover .files_container': 'dragover',
    'dragleave .files_container': 'dragleave',
    'drop .files_container': 'drop'
  },

  initialize: function(options){
    options = options || {};
    this.label = options.label || '';
    _.bindAll(this, 'render');
  },

  render: function(){
    var obj = {'label':this.label};
    this.$el.html(this.template(obj));
    this.$fileInput = this.$el.find('.files');
    return this;
  },

  // drag and drop

  dragover: function(event){
    this.$el.addClass('over');
    //this.cancelEvent(event);
  },

  dragleave: function(event){
    this.$el.removeClass('over');
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
// Save Fieldset - tagName should become fieldset - Dumb view
/* ------------------------------------------------------------------- */

LIME.Forms.SaveView = Backbone.View.extend({
  tagName: 'div',
  className: 'save_view',
  template: _.template($('#button').html()),

  initialize: function(options){
    _.bindAll(this, 'render', 'unpersisted', 'unsaved', 'saving', 'saved', 'error', 'triggerSave', 'triggerClose', 'triggerSaveClose');
    this.flashTimer = null;
    this.setClass('saved');
  },

  unpersisted: function(){
    this.setClass('unpersisted');
    this.setClose('close', this.triggerClose);
    this.setSave('', null);
  },

  unsaved: function(){
    this.setClass('unsaved');
    this.setClose('save and close', this.triggerSaveClose);
    this.setSave('save now', this.triggerSave);
  },

  saving: function(){
    this.setClass('saving', 'close', 'saving...');
    this.setClose(null, null);
    this.setSave('saving...', null);
  },

  saved: function(){
    this.setClass('saved');
    this.setClose('close', this.triggerClose);
    this.setSave('saved!');
  },

  error: function(){
    this.setClass('error');
    this.setClose('close without saving', this.triggerClose);
    this.setSave('not saved!', this.triggerSave);
    this.flashTimer = setTimeout(_.bind(this.setSave, this, 'save now', this.triggerSave), 1000);
  },

  // Used to modify buttons

  setClass: function(cls){
    this.$el.attr('class', this.className + ' ' + cls);
    clearInterval(this.flashTimer);
  },

  setSave: function(text, action){
    this.setButtonText(this.$savebutton, text);
    this.setButtonAction(this.$savebutton, action);
  },

  setClose: function(text, action){
    this.setButtonText(this.$closebutton, text);
    this.setButtonAction(this.$closebutton, action);
  },

  setButtonText: function(button, text){
    if(text){
      button.val(text);
    } else {
      button.val(' ');
    }
  },

  setButtonAction: function(button, action){
    button.off();
    if(_.isFunction(action)){
      button.on('click', action)
      // this.$savebutton.attr('disabled', false);
    } else {
      // this.$savebutton.attr('disabled', true);
    }
  },

  // Render

  render: function(state){
    this.$savebutton = $(this.template({'label':'','cls': 'save'}));
    this.$closebutton = $(this.template({'label':'','cls': 'close'}));

    this.$el.empty();
    this.$el.append(this.$closebutton);
    this.$el.append(this.$savebutton);

    return this;
  },

  triggerSave: function(){
    this.trigger('save');
  },

  triggerClose: function(){
    this.trigger('close');
  },

  triggerSaveClose: function(){
    this.trigger('saveclose');
  }

})

/* ------------------------------------------------------------------- */
// Forms
/* ------------------------------------------------------------------- */

/* ------------------------------------------------------------------- */
// Vertex - Attribute form
/* ------------------------------------------------------------------- */

LIME.Forms['Vertex'] = Backbone.View.extend({
  tagName: 'form',
  events: {
    'keypress input' :'keyCheck',
  },

  initialize: function(options){
    this.options = options || {};
    this.predecessor = options.predecessor || null; // can be removed if new form is separate
    this.children = [];

    // children
    this.saveView = new LIME.Forms.SaveView();
    this.attributeFields = new LIME.Forms.Attributes({model: this.model});
    this.godAttributes = new LIME.Forms.GodAttributes({model: this.model})

  },

  initSaveEvents: function(){
    // listen for model events and pass to saveView
    this.listenTo(this.model, 'sync', this.saveView.saved);
    this.listenTo(this.model, 'error', this.saveView.error);
    this.listenTo(this.model, 'change', this.saveView.unsaved)
    // listen for form actions and handle
    this.listenTo(this.saveView, 'save', this.save);
    this.listenTo(this.saveView, 'close', this.forceClose);
    this.listenTo(this.saveView, 'saveclose', this.saveAndClose);
    // initial saveView state based on model
    if(this.model.isNew()){
      this.saveView.unpersisted();
    } else if (this.model.modified){
      this.saveView.error();
    } else {
      this.saveView.saved();
    }
  },

  appendChildView: function(view){
    view.$el.appendTo(this.$el);
    this.children.push(view);
    return view;
  },

  render: function(){
    _.each(this.children, function(child){child.close()});

    // In order
    this.appendChildView(this.saveView).render();
    this.appendChildView(this.godAttributes).render();
    this.appendChildView(this.attributeFields).render();

    // Interface
    this.listenTo(this.godAttributes, 'change', this.attributesChanged);
    this.listenTo(this.attributeFields, 'change', this.attributesChanged);
    this.initSaveEvents(this.saveView);
    return this;
  },

  saveAndClose: function(){
    if(this.model.modified){
      this.save();
      this.listenToOnce(this.model, 'sync', this.forceClose);
    } else {
      this.forceClose();
    }
  },

  forceClose: function(){
    this.trigger('closed');
    this.close();
  },

  attributesChanged: function(changes){
    LIME.stack.modifyVertex(this.model, changes);
  },

  keyCheck: function(evt){
    if(evt.which == LIME.Forms.ENTERKEY){
      this.saveAndClose();
      return false;
    }
  },

  save: function(){
    if(!this.model.modified){
      return false;
    }
    this.saveView.saving();

    // Should use a different form for new models here
    if(this.model.isNew()){
      LIME.stack.addToGraph([this.model],[[this.predecessor, this.model]])
    } else {
      LIME.stack.updateVertex(this.model);
    }
  },

});

/* ------------------------------------------------------------------- */
// Cover Photo Form
/* ------------------------------------------------------------------- */

LIME.Forms['Cover'] = Backbone.View.extend({
  tagName: 'form',

  initialize: function(options){
    this.options = options || {};
    this.children = [];

    this.fileUpload = new LIME.Forms.FileUploadView({model: this.model});
    this.saveView = new LIME.Forms.SaveView();

    this.listenTo(this.model, 'summaryChanged', this.render)
    _.bindAll(this, 'close', 'noCover');
  },

  appendChildView: function(view){
    view.$el.appendTo(this.$el);
    this.children.push(view);
    return view;
  },

  appendCover: function(cover){

    this.$cover = $(LIME.Forms.templates['cover_display']());
    this.$removebutton = $(LIME.Forms.templates['button']({'label':'remove cover','cls': 'remove_cover delete'}));
    this.$cover.append(this.$removebutton);
    this.$el.append(this.$cover);

    // add cover images
    _.each(cover, function(coverItem){
      this.$cover.append("<img src='"+coverItem.href+"?w=500' alt='' />");
    }, this);


  },

  render: function(){
    this.$el.html('');

    this.appendChildView(this.saveView).render();
    this.appendChildView(this.fileUpload).render();

    // raw markup should be views
    var cover = this.model.get('cover')
    if(cover && cover.length > 0){
      this.appendCover(cover);
    }

    this.listenTo(this.fileUpload, 'change', this.filesChanged);
    this.listenTo(this.saveView, 'close', this.forceClose);
    // request process saves in a different place
    this.$removebutton.on('click', this.noCover);

    this.saveView.unpersisted();

    return this;
  },

  forceClose: function(){
    this.trigger('closed');
    this.close();
  },

  filesChanged: function(files){
    file = files[0];
    this.model;
    LIME.requestPanel.serial([
      {'func': 'uploadCoverPhoto', 'args': [file, this.model]},
    ]);
  },

  noCover: function(){
    LIME.requestPanel.serial([
      {'func': 'removeCover', 'args': [this.model]},
    ]);
  }

});

/* ------------------------------------------------------------------- */
// Succset Form
/* ------------------------------------------------------------------- */


LIME.Forms['Succset'] = Backbone.View.extend({
  passableOptions: ['model', 'uploadLabel'],
  tagName: 'form',

  initialize: function(options){
    this.options = options || {};
    this.photoNesting = options.photoNesting || [];
    this.children = [];
    this.childOptions = _.pick(this.options, this.passableOptions);
    this.appendFileUpload();
    _.bindAll(this, 'close');
  },

  appendFileUpload: function(){
    this.fileUpload = new LIME.Forms.FileUploadView(this.childOptions),
    this.$el.append(this.fileUpload.el);
    this.listenTo(this.fileUpload, 'change', this.filesChanged);
    this.children.push(this.fileUpload);
  },

  render: function(){
    this.fileUpload.render();
    return this;
  },

  // Events

  filesChanged: function(files){
    LIME.stack.batchMedia(files);
  }

});


/* ------------------------------------------------------------------- */
// Action Panel
// This panel is the startpoint for all forms
// It may be better to load the forms into the same container the
// Vertex view is in and swap them when editing.
/* ------------------------------------------------------------------- */

LIME.ActionPanel = Backbone.View.extend({
  el: $('#action_panel'),
  batches: [],
  model: null,
  predecessor: null,

  initialize: function(){
    this.$el.html('');
    this.form = null;
  },

  loadVertexForm: function(model, predecessor){
    this.closeForm();

    this.form = new LIME.Forms['Vertex']({
      'predecessor': predecessor,
      'model': model,
      'className': model.vertexType + ' vertex form'
    });

    this.listenTo(this.form, 'closed', this.collapseActionPanel);

    this.$el.html(this.form.el);
    this.form.render();
    this.rollDown();
  },

  loadCoverForm: function(model){
    this.closeForm();

    this.form = new LIME.Forms['Cover']({
      'className': 'cover form',
      'model': model
    });

    this.listenTo(this.form, 'closed', this.collapseActionPanel);

    this.$el.append(this.form.el);
    this.form.render();
    this.rollDown();
  },

  collapseActionPanel: function(){
    if(this.form){
      this.form = null;
    }
    this.rollUp();
  },

  rollUp: function(){
    LIME.focus.$el.removeClass('form_open');
    this.$el.removeClass('show');
  },

  rollDown: function(){
    LIME.focus.$el.addClass('form_open');
    this.$el.addClass('show');
  },

  closeForm: function(){
    if(this.form){
      this.form.saveAndClose();
    }
  }

});

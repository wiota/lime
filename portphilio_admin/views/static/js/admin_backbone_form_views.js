/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Forms
/* ------------------------------------------------------------------- */

App.Form = {};

App.Form.events = {};

App.Form.events['changes'] = {
  'keyup input' :'changed',
  'keyup textarea' :'changed'
};

App.Form.events['actions'] = {
  'click .save': 'save',
  'click .cancel': 'close'
};

App.Form.events['photo'] = {
  'change #files': 'handle_files'
};

App.Form.templates = {};

App.Form.templates['serialized'] = {
  'text': _.template($('#text').html()),
  'textarea': _.template($('#textarea').html()),
  'button': _.template($('#button').html())
};

App.Form.templates['photo'] = {
  's3_image': _.template($('#s3_image').html())
};


App.Form['serialized'] = Backbone.View.extend({ // Akin to ListingView
  tagName: 'form',
  serialization: null, // Form serialization should be in a model
  formUrl: null,
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
    this.serialization = options.serialization || null;
    this.formUrl = options.formUrl || this.model.urlRoot + "form/";

    if(!this.hasForm()){
      this.fetchForm();
      this.listenTo(this, 'hasForm', this.render);
    }

    _.bindAll(this, 'changed');
  },

  hasForm: function(){
    if(!this.serialization){
      return false;
    } else {
      return true;
    }
  },

  // timeouts? What to do if form does not load?
  fetchForm: function(){
    msg.log("Fetching Form " + this.formUrl);
    $.ajax({
      type: 'GET',
      url: this.formUrl,
      // type of data we are expecting in return:
      dataType: 'json',
      timeout: 1000,
      context: this,
      success: function(data){
        this.serialization = data;
        this.trigger("hasForm");
      },
      error: function(){
        console.log('Form get error');
      }

    })
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
    this.model.save();
    return false;
  },

  close: function(){
    this.remove();
  },

  render: function(){
    if(!this.hasForm()){
      return false;
    }
    _.each(this.serialization.formFields, function(field, key){
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

App.Form['Vertex'] = App.Form['serialized'].extend({

});

App.Form['Vertex.Medium.Photo'] = App.Form['serialized'].extend({
  s3_upload: null,
  serialization: {
    "formFields": {
      "s3_image": {
        "required": true,
        "type": "s3_image",
        "label": "Photo"
      }
    }
  },

  initialize: function(options){
    options = options || {};
    this.predecessor = options.predecessor || null;

    this.progress_bar = this.$el.find('.progress_bar');
    _.bindAll(this, 'uploadProgress', 'uploadFinish', 'photoSynced');
  },

  events: _.extend({},
    App.Form.events['changes'],
    App.Form.events['actions'],
    App.Form.events['photo']
  ),

  templates: _.extend({},
    App.Form.templates['serialized'],
    App.Form.templates['photo']
  ),

  close: function(){
    // abort image uploads
    this.remove();
  },

  renderActions: function(){
    $(this.templates['button']({'label':'Cancel', 'cls': 'cancel'})).appendTo(this.$el);
  },

  handle_files: function(){
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

    // I should not be hard coding the cls here
    var _cls = 'Vertex.Medium.Photo';
    var collection = App.collection[_cls];
    var photo = collection.create({"href": href})

    this.listenTo(collection, 'sync', this.photoSynced);

  },

  uploadError: function(status){
    $('#status').html('Upload error: ' + status);
  },

  photoSynced: function(photo, response, options){
    var succset = _.clone(this.predecessor.get('succset'));

    succset.unshift(photo);
    this.predecessor.set({'succset':succset});
    this.predecessor.saveSuccset();
  }

})

/* ------------------------------------------------------------------- */
// Action Panel
// This panel should be the startpoint for all forms
/* ------------------------------------------------------------------- */

App.ActionPanel = Backbone.View.extend({
  el: $('#action_panel'),
  form: null,
  model: null,
  predecessor: null,

  initialize: function(){
    this.$el.html('');
  },

  loadForm: function(model, predecessor){
    this.model = model;
    this.predecessor = predecessor;
    var _cls = model.get('_cls');
    var className = _cls.toLowerCase().split('.').join(' ') + ' form';
    var formFactory = App.Form[_cls] || App.Form['Vertex'];

    if(this.form){
      this.form.remove();
    }

    this.form = new formFactory({model: this.model, 'predecessor': this.predecessor, 'className': className});
    this.$el.html(this.form.el);
    this.form.render();
  }

});
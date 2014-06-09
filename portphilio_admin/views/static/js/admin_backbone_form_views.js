/* ------------------------------------------------------------------- */
// Action Forms
/* ------------------------------------------------------------------- */

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
    this.predecessor = options.predecessor;

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
    this.predecessor = options.predecessor;
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
    var succset = _.clone(this.predecessor.get('succset'));

    succset.unshift(photo);
    this.predecessor.set({'succset':succset});
    this.predecessor.saveSubset();
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
    var formFactory = App.typeDictionary[_cls]['formView'] || App.FormView;

    this.form = new formFactory({model: this.model, 'predecessor': this.predecessor, 'className': className});
    this.$el.html(this.form.el);
  },

  render: function() {
    this.form.render();
  }

});
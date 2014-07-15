/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Forms
/* ------------------------------------------------------------------- */

App.Form = {};

// This section of the app is getting bloated. I need to break off
// parts of it into actions which can be floated above the forms
// themselves. Pending actions are also going to need to be
// kept track of as well.

/* ------------------------------------------------------------------- */
// Templates
/* ------------------------------------------------------------------- */

App.Form.templates = {};

App.Form.templates['serialized'] = {
  'text': _.template($('#text').html()),
  'textarea': _.template($('#textarea').html()),
  'button': _.template($('#button').html())
};

App.Form.templates['file_upload'] = {
  'file_upload': _.template($('#html5_file_upload').html())
};

/* ------------------------------------------------------------------- */
// Upload Bar - Individual Upload Views
/* ------------------------------------------------------------------- */

App.Form.batchItemView = Backbone.View.extend({
  percent: 0,
  label: null,
  tagName: 'div',
  className: 'batch_item',
  template: _.template($('#batch_item').html()),
  uploaded: false,
  wrapped: false,
  href: null,

  events: {
    'click .cancel': 'collapse'
  },

  initialize: function(file, formView){
    this.formView = formView;
    this.file = file;
    this.label = file.name;
    this.percent = 0;
    this.errorThrown = false;
    // these function names need work
    _.bindAll(this, 'update', 'success', 'close', 'collapse', 'cancel', 'error');
    this.render();
    this.startUpload();
  },

  render: function(){
    this.$el.html(this.template({'label':this.label, 'width': this.percent}));
    this.$bar = this.$el.find('.progress_bar_fill');
    return this;
  },

  update: function(percent){
    this.percent = percent;
    this.$bar.animate({'width': this.percent+"%"});
  },

  // for the upload to s3
  cancel: function(){
    this.trigger('cancel', this);
    this.uploader.abort();
    this.close();
  },

  // removes element
  close: function(){
    this.unbind();
    this.remove();
  },

  // animates element closed
  collapse: function(){
    this.$el.animate({'height': 0}, 200, 'linear', this.cancel);
  },

  shrink: function(){
    this.$el.addClass('uploaded');
    this.$bar.fadeOut(100);
  },

  setLabel: function(string){
    this.label = string;
    this.render();
  },

  noteVertexCreation: function(className){
    vertex = $('<a></a>').addClass('vertex_note '+className).appendTo(this.$el);
    return vertex
  },

  noteVertexSync: function(vertex){
    vertex.addClass('synced');
  },

  noteEdges: function(){
    this.$el.addClass('edges');
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
    this.href = href;
    this.uploaded = true;
    this.formView.wrapUpload(href, this);
    this.shrink();
  },

  error: function(){
    if(this.errorThrown){
      return false;
    }
    this.errorThrown = true;
    this.$el.addClass('error');
    this.$bar.show();
    this.$bar.css({'opacity': 1, 'width': '100%'});
    // This animation does not work
    // Can't figure out why
    this.$bar.animate({'width': '0%'}, 3000);

    //this.$el.fadeOut(2000, this.close);
    // This is where the refresh function goes
  },

});

/* ------------------------------------------------------------------- */
// Upload batch
/* ------------------------------------------------------------------- */

App.Form.batchView = Backbone.View.extend({
  tagName: 'div',
  template: _.template($('#batch').html()),

  initialize: function(options){
    options = options || {};
    this.files = options.files || null;
    this.predecessor = options.predecessor || null;
    this.nesting = options.nesting || [];
    this.batchItems = []
    _.bindAll(this, 'close');
  },

  render: function(){
    this.$el.html(this.template({'batch_count': this.batchItems.length ,'predecessor': this.predecessor.get('title'), 'nesting': this.nesting.join(' : ')}))
    this.$batchItems = this.$el.find('.batch_items');
    this.$batchCount = this.$el.find('.batch_count');
    return this;
  },

  close: function(){
    if(!this.batchItemsComplete()){
      this.cancelAllBatchItems();
      console.log('closed premature');
    }
    this.unbind();
    this.remove()
  },

  collapse: function(){
    if(this.batchItemsComplete()){
      this.$el.animate({'height': 0}, 200, 'linear', this.close);
    }
  },

  upload: function(){
    _.each(this.files, function(file){
      this.addBatchItem(file);
    }, this);
  },

  addBatchItem: function(file){
    var batchItem = new App.Form.batchItemView(file, this);
    this.$batchItems.append(batchItem.render().el);
    this.batchItems.push(batchItem);
    this.listenTo(batchItem, 'cancel', this.removeBatchItem);
    this.setBatchNumber();
  },

  setBatchNumber: function(){
    var i = this.batchItems.length;
    this.$batchCount.css({'font-size': i*24 + "px"})
    this.$batchCount.text(this.batchItems.length);
  },

  cancelAllBatchItems: function(){
    console.log('canceling ' + this.batchItems.length + ' uploads');

    _.each(this.batchItems, function(batchItem, index){
      console.log(batchItem.file.name);
      batchItem.cancel();
    });
    this.batchItems = [];
  },

  removeBatchItem: function(batchItemView){

    index = this.batchItems.indexOf(batchItemView);
    if ((index = this.batchItems.indexOf(batchItemView)) > -1) {
      this.batchItems.splice(index, 1);
    }

    this.setBatchNumber();
    console.log(this.batchItems.length);

    if(this.batchItemsComplete()){
      this.collapse();
    }

  },

  batchItemsComplete: function(){
    if(this.batchItems.length > 0){
      console.log('test false');
      return false;
    } else {
      console.log('test true');
      return true;
    }
  },


  // Once per batchItem
  // Need a try again?
  wrapUpload: function(href, batchItemView){
    // Clean name
    batchItemView.setLabel(App.fileToName(batchItemView.file.name));

    // Generate vertex-edge batch list
    var vertices = [];
    var edges = [];

    var succModel = new App.Model['Vertex.Medium.Photo']({"href": href});
    var predModel = null;

    _.each(this.nesting, function(nesting){
      if(nesting == 'Vertex.Category'){
        var title = 'Category';
      } else {
        var title = batchItemView.label;
      }
      predModel = new App.Model[nesting]({'title':title});
      vertices.push(succModel);
      edges.push([predModel, succModel]);
      succModel = predModel;
    })

    vertices.push(succModel);
    edges.push([this.predecessor, succModel]);

    // implement vertex-edge batch list
    // Verticies are created, edges are not
    this.persistVerticesCreateEdges(vertices, edges, batchItemView);

  // This is a first stab at a batch list and a mechanism to link them up
  // and check for broken links. Edges should be entered Pred -> Succ

  // If an error exists, it can be listed and then checked and then repaired

  },

  persistVerticesCreateEdges: function(vertices, edges, batchItemView){
    this.persistBatchedVertices(vertices, edges, batchItemView);
  },

  persistBatchedVertices: function(vertices, edges, batchItemView){
    var unidentified_vertices = 0;
    var complete = function(){
      console.log('vertices complete test')
      if(unidentified_vertices <= 0){
        console.log('tested true');
        return true;
      }
      return false;
    }

    // add vertices
    _.each(vertices, function(model){
      unidentified_vertices++;
      var vertex = batchItemView.noteVertexCreation(App.clsToClass(model.get('_cls')));
      model.save();
      // sync
      this.listenToOnce(model, 'sync', function(){
        batchItemView.noteVertexSync(vertex);
        unidentified_vertices--;
        if(complete()){
          this.addBatchEdges(vertices, edges, batchItemView);
        }
      }, this);
      // error
      this.listenToOnce(model, 'error', function(){
        batchItemView.error();
        console.log('vertex save error' + model.get('title'));
      }, this);
    }, this)
    // this.addBatchEdges(vertices, edges, batchItemView);

  },

  addBatchEdges: function(vertices, edges, batchItemView){
    // batchItem visual update
    batchItemView.$el.addClass('edges');
    var missing_edges = 0;
    var edgesComplete = function(callback){
      if(missing_edges <= 0){
        return true;
      }
      return false;
    }

    // add edges
    _.each(edges, function(set){
      missing_edges++;
      var model = set[0];
      model.addToSuccset(set[1]);
      console.log('added '+ model.get('_cls') + ' to ' + set[1].get('_cls'));
      // sync
      this.listenToOnce(model, 'sync', function(){
        missing_edges--;
        this.removeBatchItem(batchItemView);
        if(edgesComplete()){
          batchItemView.collapse();
        }
      }, this);
      // error
      this.listenToOnce(model, 'error', function(){
        console.log('edge save error' + model.get('title'));
        batchItemView.error();
      }, this);
    }, this);
  }

});

/* ------------------------------------------------------------------- */
// Serialized Form - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

App.Form['serialized'] = Backbone.View.extend({ // Akin to ListingView
  tagName: 'form',
  serialization: null, // Form serialization should be in a model
  templates: _.extend({},
    App.Form.templates['serialized']
  ),

  initialize: function (options) {
    options = options || {};
    this.predecessor = options.predecessor || null;

    if(!this.collection.hasForm()){
      this.collection.lookupForm();
      this.listenTo(this.collection, 'hasForm', this.render);
    }
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
      // check whether or not a value is exisiting
      var hasExistingValue = this.model && this.model.get(field.name);
      value = hasExistingValue || '';

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

  renderActions: function(){}

})

/* ------------------------------------------------------------------- */
// Vertex - Attribute form
/* ------------------------------------------------------------------- */

App.Form['Vertex'] = App.Form['serialized'].extend({

  formType: 'attribute',

  events: {
    'keyup input' :'attribute_changed',
    'keyup textarea' :'attribute_changed',
    'click .save': 'save',
    'click .cancel': 'cancel'
  },

  attribute_changed: function(evt){
    var changedInput = evt.currentTarget;
    var value = $(evt.currentTarget).val();
    var obj = {};
    obj[changedInput.id] = value;
    this.model.set(obj);
  },

  renderActions: function(){
    $(this.templates['button']({'label':'Save', 'cls': 'save'})).appendTo(this.$el);
    $(this.templates['button']({'label':'Cancel', 'cls': 'cancel'})).appendTo(this.$el);
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

});

/* ------------------------------------------------------------------- */
// Vertex.Medium.Photo - Batch form
/* ------------------------------------------------------------------- */

App.Form['Vertex.Medium.Photo'] = App.Form['serialized'].extend({

  formType: 'batch',

  initialize: function(options){
    options = options || {};
    this.predecessor = options.predecessor || null;
    this.nesting = options.nesting || [];
    this.uploadLabel = options.uploadLabel || 'Drop files here';
  },

  events: {
    'changedInputnge .files': 'inputChange',
    'click .files_container': 'click',
    'dragover .files_container': 'cancelEvent',
    'dragover .files_container': 'dragover',
    'dragleave .files_container': 'dragleave',
    'drop .files_container': 'drop'
  },

  templates: _.extend({},
    App.Form.templates['serialized'],
    App.Form.templates['file_upload']
  ),

  render: function(){
    var obj = {'label':this.uploadLabel};
    this.$el.html(this.templates['file_upload'](obj));
    this.$fileInput = this.$el.find('.files');
    return this;
  },

  // drag box

  dragover: function(event){
    this.$el.addClass('over');
    event.preventDefault();
  },

  dragleave: function(event){
    this.$el.removeClass('over');
    event.preventDefault();
  },

  drop: function(event){
    this.handleFiles(event.originalEvent.dataTransfer.files);
    this.$el.removeClass('over');
    event.preventDefault();
  },

  cancelEvent: function(event){
    event.preventDefault();
  },

  // form input

  inputChange: function(event){
    this.handleFiles(this.$fileInput[0].files);
    event.preventDefault();
  },

  click: function(event){
    this.$fileInput.click();
  },

  reset: function(){
    this.render();
  },

  handleFiles: function(files){
    App.actionPanel.addBatch(files, this.predecessor, this.nesting);
    this.reset();
  }

})

/* ------------------------------------------------------------------- */
// Action Panel
// This panel should be the startpoint for all forms
/* ------------------------------------------------------------------- */

App.ActionPanel = Backbone.View.extend({
  el: $('#action_panel'),
  forms: [],
  batches: [],
  model: null,
  predecessor: null,

  initialize: function(){
    this.$el.html('');

    window.addEventListener('dragover', function(e){
      e.preventDefault();
    })
    window.addEventListener('drop', function(e){
      e.preventDefault();
    })

  },

  loadAttributeForm: function(model, predecessor){
    var _cls = model.get('_cls');
    var className = App.clsToClass(_cls) + ' form';
    // Which form?
    var formFactory = App.Form[_cls] || App.Form['Vertex'];
    var collection = App.collection[model._cls];

    var form = new formFactory({model: model, collection: collection, 'predecessor': predecessor, 'className': className});
    this.$el.append(form.el);
    form.render();
    this.forms.push(form);
  },

  loadBatchForms: function(predecessor){
    var _cls = predecessor.get('_cls');

    // This form loading needs to be improved and expanded on
    // including the ability to add all items to a single pred

    if(_cls == 'Vertex.Category' || _cls == 'Vertex.Body'){
      // Works
      var form = new App.Form['Vertex.Medium.Photo']({
        'collection': App.collection['Vertex.Medium.Photo'],
        'predecessor': predecessor,
        'nesting': ['Vertex.Work'],
        'className': 'many_works file_upload',
        'uploadLabel': "Many works"
      });

      this.$el.append(form.el);
      form.render();
      this.forms.push(form);

      var form = new App.Form['Vertex.Medium.Photo']({
        'collection': App.collection['Vertex.Medium.Photo'],
        'predecessor': predecessor,
        'nesting': ['Vertex.Work', 'Vertex.Category'],
        'className': 'many_categories file_upload',
        'uploadLabel': "Many categories"
      });

      this.$el.append(form.el);
      form.render();
      this.forms.push(form);
    }

    if(_cls == 'Vertex.Work'){
      // Photos
      var form = new App.Form['Vertex.Medium.Photo']({
        'collection': App.collection['Vertex.Medium.Photo'],
        'predecessor': predecessor,
        'nesting': [],
        'className': 'many_photos file_upload',
        'uploadLabel': "Many photos"
      });

      this.$el.append(form.el);
      form.render();
      this.forms.push(form);
    }

  },

  closeForms: function(){
    _.each(this.forms, function(form, index){
      form.close();
    });
    this.forms = [];
  },

  addBatch: function(files, predecessor, nesting){
    var _cls = nesting[0] || 'Vertex.Medium.Photo';
    var className = App.clsToClass(_cls) + ' batch';
    var batch = new App.Form.batchView({'className': className, 'files':files, 'predecessor':predecessor, 'nesting':nesting});
    this.$el.prepend(batch.render().el);
    batch.upload();
    this.batches.push(batch);
  }

});

/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Uploads
/* ------------------------------------------------------------------- */

LIME.Upload = {};

// This section of the app is getting bloated. I need to break off
// parts of it into actions which can be floated above the forms
// themselves. Pending actions are also going to need to be
// kept track of as well.



/* ------------------------------------------------------------------- */
// Batch Item Progress View
/* ------------------------------------------------------------------- */

LIME.Upload.batchItemProgressView = Backbone.View.extend({
  percent: 0,
  label: null,
  tagName: 'div',
  className: 'batch_item',
  template: _.template($('#batch_item').html()),

  initialize: function(file){
    this.file = file;
    this.label = file.name;
    this.percent = 0;
    this.errorThrown = false;
    // these function names need work
    _.bindAll(this, 'update', 'success', 'close', 'collapse', 'cancel', 'error');
    this.render();
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

  statusUploaded: function(){
    this.$el.addClass('uploaded');
    this.$bar.fadeOut(100);
  },

  setLabel: function(string){
    this.label = string;
    this.render();
  }

});


/* ------------------------------------------------------------------- */
// Upload Bar - Individual Upload Views
/* ------------------------------------------------------------------- */

LIME.Upload.batchItemView = Backbone.View.extend({
  percent: 0,
  label: null,
  tagName: 'div',
  className: 'batch_item',
  template: _.template($('#batch_item').html()),
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

  statusUploaded: function(){
    this.$el.addClass('uploaded');
    this.$bar.fadeOut(100);
  },

  setLabel: function(string){
    this.label = string;
    this.render();
  },

  // view actions

  startUpload: function(){
    // S3 uploader
    this.uploader = new LIME.Uploader();
    this.listenTo(this.uploader, 'progress', this.update);
    this.listenTo(this.uploader, 'complete', this.success); // passes href through event
    this.listenTo(this.uploader, 'uploadError', this.error);
    this.uploader.uploadFile(this.file);
  },

  success: function(href){
    this.href = href;
    this.formView.wrapUpload(href, this);
    this.statusUploaded();
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
// Batch Progress View
/* ------------------------------------------------------------------- */

LIME.Upload.batchProgressView = Backbone.View.extend({
  tagName: 'div',
  template: _.template($('#batch').html()),

  initialize: function(options){
    options = options || {};
    this.batchItems = [];
  },

  render: function(){
    this.$el.html(this.template({'batch_count': this.batchItems.length}))
    this.$batchItems = this.$el.find('.batch_items');
    this.$batchCount = this.$el.find('.batch_count');
    return this;
  },

  setBatchNumber: function(){
    var i = this.batchItems.length;
    this.$batchCount.css({'font-size': i*24 + "px"})
    this.$batchCount.text(this.batchItems.length);
  },

  addBatchItem: function(file){
    var batchItem = new LIME.Upload.batchItemProgressView(file, this);
    this.$batchItems.append(batchItem.render().el);
    //this.listenTo(batchItem, 'cancel', this.removeBatchItem);
    this.setBatchNumber();
  },

  removeBatchItem: function(batchItemView){

  }

});


/* ------------------------------------------------------------------- */
// Upload batch
/* ------------------------------------------------------------------- */

LIME.Upload.batchView = Backbone.View.extend({
  tagName: 'div',
  template: _.template($('#batch').html()),

  initialize: function(options){
    options = options || {};
    this.files = options.files || null;
    this.predecessor = options.predecessor || null;
    this.nesting = options.nesting || [];
    this.batchItems = [];
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

  setBatchNumber: function(){
    var i = this.batchItems.length;
    this.$batchCount.css({'font-size': i*24 + "px"})
    this.$batchCount.text(this.batchItems.length);
  },

  addBatchItem: function(file){
    var batchItem = new LIME.Upload.batchItemView(file, this);
    this.$batchItems.append(batchItem.render().el);
    this.batchItems.push(batchItem);
    this.listenTo(batchItem, 'cancel', this.removeBatchItem);
    this.setBatchNumber();
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
      return false;
    } else {
      return true;
    }
  },


  // Once per batchItem
  // Need a try again?
  wrapUpload: function(href, batchItemView){
    // Clean name
    batchItemView.setLabel(LIME.fileToName(batchItemView.file.name));

    // Generate vertex-edge batch list
    var vertices = [];
    var edges = [];

    var succModel = new LIME.Model['Vertex.Medium.Photo']({"href": href});
    var predModel = null;

    _.each(this.nesting, function(nesting){
      if(nesting == 'Vertex.Category'){
        var title = 'Category';
      } else {
        var title = batchItemView.label;
      }
      console.log(title);
      predModel = new LIME.Model[nesting]({'title':title});
      vertices.push(succModel);
      edges.push([predModel, succModel]);
      succModel = predModel;
    })

    vertices.push(succModel);
    if(this.predecessor.isNew()){
      vertices.push(this.predecessor);
    }
    edges.push([this.predecessor, succModel]);

    console.log(vertices);
    console.log(edges);

    // implement vertex-edge batch list
    // Verticies are created, edges are not
    LIME.requestPanel.batchRequest(vertices, edges, batchItemView);


  }

});

/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Uploads
/* ------------------------------------------------------------------- */

App.Upload = {};

// This section of the app is getting bloated. I need to break off
// parts of it into actions which can be floated above the forms
// themselves. Pending actions are also going to need to be
// kept track of as well.


/* ------------------------------------------------------------------- */
// Upload Bar - Individual Upload Views
/* ------------------------------------------------------------------- */

App.Upload.batchItemView = Backbone.View.extend({
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

App.Upload.batchView = Backbone.View.extend({
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
    var batchItem = new App.Upload.batchItemView(file, this);
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
      return false;
    } else {
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
      console.log(title);
      predModel = new App.Model[nesting]({'title':title});
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
    App.requestPanel.batchRequest(vertices, edges, batchItemView);

  // This is a first stab at a batch list and a mechanism to link them up
  // and check for broken links. Edges should be entered Pred -> Succ

  // If an error exists, it can be listed and then checked and then repaired

  }

});

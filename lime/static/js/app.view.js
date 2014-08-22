/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Views
/* ------------------------------------------------------------------- */

App.View = {};

/* ------------------------------------------------------------------- */
// App Model Overrides
/* ------------------------------------------------------------------- */

// Close Function to clean up views
Backbone.View.prototype.close = function(){
  if(this.children){_.invoke(this.children, 'close')};
  this.children = null;
  this.stopListening();
  this.unbind();
  this.remove();
}

/* ------------------------------------------------------------------- */
// Successor Item View
/* ------------------------------------------------------------------- */

App.View.SuccessorItemView = {};

App.View.SuccessorItemView['Vertex'] = App.SuccessorItemView = Backbone.View.extend({ // Abstract class - do not instantiate!
  tagName: 'li',
  className: 'successorItem',
  events:{
    'click .delete':'delete',
    'click .update':'updateForm'
  },

  initialize: function(options){
    this.predecessor = options.predecessor;
    this.$el.attr('id', "_id_"+this.model.id);
  },

  delete: function(){
    App.requestPanel.one([
      {'func': 'removeEdgeRequest', 'args': [[this.predecessor, this.model]]},
    ]);
    //this.predecessor.removeEdge(this.model);
  },

  updateForm: function(){
    App.actionPanel.loadVertexForm(this.model, this.predecessor);
  },

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    this.$cover = this.$el.children('.cover');
    _.each(this.model.get('cover'), function(coverItem){
      // use template
      this.$cover.append("<img src='"+coverItem.href+"?w=500' alt='' />")
    }, this);
    this.delegateEvents();
    return this;
  }
});

App.View.SuccessorItemView['Vertex.Apex.Body'] = App.View.SuccessorItemView['Vertex'].extend({
  className: 'body successorItem',
  template:_.template($('#body_in_set').html())
});

App.View.SuccessorItemView['Vertex.Category'] = App.View.SuccessorItemView['Vertex'].extend({
  className: 'category successorItem',
  template:_.template($('#category_in_set').html())
});

App.View.SuccessorItemView['Vertex.Work'] = App.View.SuccessorItemView['Vertex'].extend({
  className: 'work successorItem',
  template:_.template($('#work_in_set').html())
});

App.View.SuccessorItemView['Vertex.Medium.Photo'] = App.View.SuccessorItemView['Vertex'].extend({
  className: 'photo successorItem',
  template:_.template($('#photo_in_set').html())
});

App.View.SuccessorItemView['empty'] = Backbone.View.extend({
  tagName: 'li',
  initialize: function(){
    this.$el.html('Empty');
  }
});


/* ------------------------------------------------------------------- */
// Successor Set List
/* ------------------------------------------------------------------- */
// Render what if vertex has no successors?

App.View.SuccsetListView = {};

App.View.SuccsetListView['Vertex'] = Backbone.View.extend({
  tagName: 'ol',
  className: 'succset_list',
  idName: 'succset_list',
  sortFunction: null,

  events: {
    'mousedown': 'startScrolling',
    'mouseup': 'stopScrolling'
  },

  initialize: function(){
    // Should be listening to add event and appending element
    this.listenTo(this.model, 'change:succset', this.render);
    if(!this.model.isDeep()){
      this.listenToOnce(this.model, 'sync', this.render);
    }

    this.children = [];

    _.bindAll(this, 'update');
    this.sortInit();
  },

  startScrolling: function(){
    //var h = this.$el.height() + 50;
    //this.$el.css({'height': h+'px', 'max-height': h+'px'});
    //$('#listing_panel').css({'max-height': h+'px'});
    this.scrollTimer = null;
    var tolerance = 100;
    var exponent = 40;
    var initialSpeed = 1;
    var container = $('#listing_panel');
    var windowHeight = $(window).height();
    var scrollLimit = this.$el.height() - windowHeight;

    $(document).on('mousemove', function(event){
      var y = event.pageY;
      var h = windowHeight;
      var sb = 0;

      if(y < tolerance){
        sb = (y - tolerance)/tolerance;
      } else if (y > (h-tolerance)){
        sb = (y - (h-tolerance))/tolerance;
      }

      sb = sb*exponent;

      var scrollTo = $('#listing_panel').scrollTop()+sb;
      if(scrollTo > scrollLimit){scrollTo = scrollLimit}
      $('#listing_panel').scrollTop(scrollTo);

      var list = $(this)
      clearInterval(this.scrollTimer);
      if(sb != 0){
        this.scrollTimer = setInterval(function(){
          //var e = jQuery.Event("mousemove", event);
          list.trigger(event)
        }, 30)
      }

    })
  },

  stopScrolling: function(){
    clearInterval(this.scrollTimer);
    $(document).off('mousemove');
  },

  sortInit: function(){
    var view = this;

    var jqueryui_opt = {
      axis:'y',
      cursor: 'move',
      opacity: 1,
      distance: 0,
      delay: 100,
      containment: 'parent',
      scrollSensitivity: 20,
      scrollSpeed: 20,
      tolerance: "pointer",
      //handle: '.drag_handle',
      update: this.update,
      forcePlaceholderSize: true,
      helper: 'original',
      start: function(e, ui){
        var s = ui.helper.height()+2;
        var e = ui.helper.height()+5;
        ui.placeholder.height(s);
        ui.placeholder.animate({'height':e+'px'}, 50, 'linear');
      }
    }

    var sortable_opt = {
      distance: 1,
      delay: 100,
      tolerance: -100,
      placeholder: $('<li class="placeholder succsetItem"/>'),
      onDrag: function ($item, position, _super, event) {
        position.left = 0;
        position.top -= $item.yOff;
        $item.css(position)
      },
      onDragStart: function ($item, container, _super, event) {
        // mouse grab offset
        $item.xOff = event.offsetX;
        $item.yOff = event.offsetY;

        // cache item dimensions
        var itemDim = {
          height: $item.height(),
          width: $item.width()
        }

        // set placeholder and item dimensions
        this.placeholder.css(itemDim);
        $item.css(itemDim);

        // add classes
        $item.addClass("dragged");
        $("body").addClass("dragging");
      },
      onDrop: function ($item, container, _super, event) {
        $item.removeClass("dragged").removeAttr("style");
        $("body").removeClass("dragging");
        view.update();
      }
    }

    this.$el.sortable(sortable_opt);

    //this.sortFunction = this.$el.sortable(sortable_opt);
  },

  // See sorting comment above
  update: function(event, ui){
    var ids = _.map(this.$el.children(), function(li){return li.id.slice(4)})
    this.model.setSuccset(ids);
  },

  render: function(){
    // if model needs to be refetched for dereferenced succset
    if(!this.model.isDeep()){return false;}

    successors = this.model.get('succset');
    this.$el.empty();

    _.each(successors, function(successor, index){
      var viewFactory = App.View.SuccessorItemView[successor._cls];
      var successorItemView = new viewFactory({'model':successor, 'predecessor': this.model});
      this.$el.append(successorItemView.render().el);
      successorItemView.listenTo(successor, 'change', successorItemView.render);
      this.children.push(successorItemView);
    }, this);

    return this;
  }
});


/* ------------------------------------------------------------------- */
// Summaries
/* ------------------------------------------------------------------- */

App.View.SummaryView = {};

App.View.SummaryView['Vertex'] = App.SummaryView = Backbone.View.extend({
  tagName: 'div',
  template:_.template($('#default_summary').html()),

  events:{
    'click .title':'toggleMeta',
    'click .update':'updateForm',
    'click .save_order':'saveSuccset',
    'click .add_category':'addCategoryForm',
    'click .add_work':'addWorkForm',
    'click .add_photo':'addPhotoForm',
    'click .set_cover':'setCoverForm'
  },

  initialize: function(){
    this._cls = this.model.get('_cls');

    // set up sync handler to render anytime model is synced
    // Seems sloppy to set up a sync handler and a summary changed
    // handler. This is done here because summaryChanged is fired before
    // fetchSuccess callback. Deep and Fetched are set there, and when
    // sync is called, it rerenders after those variables are set
    // possible option, put it in the parse function, however this
    // creates difficulties because the model is not created yet
    // Another option would be to override the fetch function.

    this.listenTo(this.model, 'sync', this.render);
    this.listenTo(this.model, 'summaryChanged', this.render)
    this.listenTo(this.model, 'outofsync', this.flashOut);
    this.listenTo(this.model, 'resynced', this.flash);
  },

  render: function(){
    if(!this.model.isFetched()){
      msg.log("Rendering Summary Failed", 'render');
      return false;
    }
    msg.log("Rendering Summary", 'render');

    // template
    this.$el.html(this.template(this.model.toJSON()));

    // meta
    this.$meta = this.$el.children('.meta');
    //this.$meta.hide();

    // cover
    this.$cover = this.$el.find('.cover');
    _.each(this.model.get('cover'), function(coverItem){
      console.log(coverItem.href);
      //this.$covers.append("<img src='"+coverItem.resize_href+"?w=500' alt='' />")
      this.$cover.append("<img src='"+coverItem.href+"?w=500' alt='' />")
    }, this);


    this.delegateEvents();
    return this;
  },

  toggleMeta: function(){
    //this.$meta.slideToggle();
  },

  updateForm: function(){
    App.actionPanel.loadVertexForm(this.model, null);
  },

  addCategoryForm: function(){
    var newCategory = new App.Model['Vertex.Category']();
    App.actionPanel.loadVertexForm(newCategory, this.model);
  },

  addWorkForm: function(){
    var newWork = new App.Model['Vertex.Work']();
    App.actionPanel.loadVertexForm(newWork, this.model);
  },

  addPhotoForm: function(){
    console.log("No longer functional");
  },

  setCoverForm: function(){
    App.actionPanel.loadCoverForm(this.model);
  },

  saveSuccset: function(){
    this.model.saveSuccset();
  }

});

App.View.SummaryView['Vertex.Apex.Body'] = App.PortfolioSummaryView = App.SummaryView.extend({
  template:_.template($('#portfolio_summary').html())
});

App.View.SummaryView['Vertex.Category'] = App.CategorySummaryView = App.SummaryView.extend({
  template:_.template($('#category_summary').html())
});

App.View.SummaryView['Vertex.Work'] = App.WorkSummaryView = App.SummaryView.extend({
  template:_.template($('#work_summary').html())
});

App.View.SummaryView['Vertex.Happening'] = App.WorkSummaryView = App.SummaryView.extend({
  template:_.template($('#happening_summary').html())
});

/* ------------------------------------------------------------------- */
// Listings
/* ------------------------------------------------------------------- */

App.View.ListingView = {};

App.View.ListingView['Vertex'] = Backbone.View.extend({ // Akin to FormView
  tagName: 'div',
  _cls: null,
  summary: null,
  list: null,
  photoNesting: [],
  events: {
    'dragover': 'outline',
    'dragleave .files_container': 'disappear',
    'drop': 'disappear'
  },

  initialize: function(){
    var _cls = this.model.get('_cls');

    // child views
    this.summary = new App.View.SummaryView[_cls]({model:this.model, className: App.clsToClass(_cls)+" summary"}),

    this.list = new App.View.SuccsetListView['Vertex']({model:this.model})
    this.upload = new App.FormView['Succset']({
      'model': this.model,
      'photoNesting': this.model.photoNesting,
      'className': 'succset draggable form'
    });

    this.$succset = $('<div class="succset container"></div>')

    this.children = [this.summary, this.list, this.upload];
    this.appendElements();
  },

  render: function(){
    _.each(this.children, function(c){c.render()}, this);
  },

  appendElements: function(){
    $('#path_panel').append(this.summary.el);
    //this.$el.append(this.$succset);
    this.$el.append(this.list.el);
    this.$el.append(this.upload.el);
    this.upload.$el.hide();
  },

  outline: function(e){
    this.upload.$el.show();

  },

  disappear: function(e){
    this.upload.$el.hide();
  },


});

App.View.ListingView['Vertex.Apex.Body'] = App.View.ListingView['Vertex'].extend({});

App.View.ListingView['Vertex.Category'] = App.View.ListingView['Vertex'].extend({});

App.View.ListingView['Vertex.Work'] = App.View.ListingView['Vertex'].extend({});

/* ------------------------------------------------------------------- */
// Listing Panel
// This panel should be the startpoint for all listings
/* ------------------------------------------------------------------- */

App.ListingPanel = Backbone.View.extend({
  el: $('#listing_panel'),
  view: null,
  listed_model: null,

  list: function(model){
    msg.log('- List '+model.id+ ' ' + model.deep + ' ------------------','model')
    msg.log('- List '+model.id+' ------------------','render')
    this.listed_model = model;
    var _cls = this.listed_model.get('_cls');
    var className = _cls.toLowerCase().split('.').join(' ') + ' listing';

    // View
    if(this.view){
      this.view.close();
    }

    this.view = new App.View.ListingView[_cls]({'model':this.listed_model, 'className': className});
    this.$el.html(this.view.el);
    this.view.render();

  },



});
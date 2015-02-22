/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Views
/* ------------------------------------------------------------------- */

LIME.View = {};

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

LIME.View.SuccessorView = {};

LIME.View.SuccessorView['Vertex'] = LIME.SuccessorView = Backbone.View.extend({ // Abstract class - do not instantiate!
  tagName: 'li',
  events:{
    'click .delete':'delete',
    'click .update':'updateForm'
  },

  initialize: function(options){
    this.predecessor = options.predecessor;
    this.$el.attr('id', "_id_"+this.model.id);
    this.template = this.buildTemplate();
  },

  buildTemplate: function(){
    if(defined = $('#'+ this.model.vertexType +'_in_set').html()){
      return _.template(defined);
    } else {
      // _id, vertexType, and title
      return _.template($('#vertex_in_set').html());
    }
  },

  delete: function(){
    LIME.requestPanel.one([
      {'func': 'removeEdgeRequest', 'args': [[this.predecessor, this.model]]},
    ]);
    //this.predecessor.removeEdge(this.model);
  },

  updateForm: function(){
    LIME.actionPanel.loadVertexForm(this.model, this.predecessor);
  },

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    this.$cover = this.$el.children('.cover');
    _.each(this.model.get('cover'), function(coverItem){
      // use template
      this.$cover.append("<img src='"+coverItem.href+"?w=500' alt='' />")
    }, this);
    this.delegateEvents();
    if(!this.model.get('deletable')){
      this.$el.find('.delete').hide();
    }
    return this;
  }
});

/* ------------------------------------------------------------------- */
// Successor Set List
/* ------------------------------------------------------------------- */

LIME.View.SuccsetView = {};

LIME.View.SuccsetView['Vertex'] = Backbone.View.extend({
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
    this.children = [];

    _.bindAll(this, 'update');
    this.sortInit();
    this.render();
    this.timer = null;
  },

  startScrolling: function(event){
    var tolerance = 100;
    var exponent = 40;
    var initialSpeed = 1;
    var container = $('#listing_panel .listing');
    var windowHeight = $(window).height();
    var scrollLimit = this.$el.outerHeight() - windowHeight;
    var list = this.$el;

    if(event.which > 1){
      return false;
    }

    var scrollWindow = function(y){
      var y = y;
      var h = windowHeight;
      var sb = borderExponent(y, h, tolerance)

      sb = sb*exponent;

      var scrollTo = container.scrollTop()+sb;
      if(scrollTo > scrollLimit){scrollTo = scrollLimit}
      container.scrollTop(scrollTo);
      return sb;
    }

    var borderExponent = function(position, length, tolerance){
      if(position < tolerance){
        return (position - tolerance)/tolerance;
      } else if (position > (length-tolerance)){
        return (position - (length-tolerance))/tolerance;
      } else {
        return 0;
      }
    };

    var t = this;

    this.$el.on('mousemove', function(event){
        var sb = scrollWindow(event.pageY);

        clearInterval(t.timer);

        if(sb != 0){
          // console.log(sb);
          t.timer = setInterval(function(){

            list.trigger(event);;
          }, 100)
        }
      }
    )
  },

  stopScrolling: function(){
    clearInterval(this.timer);
    this.$el.off('mousemove');
  },

  sortInit: function(){
    var view = this;
    var xOff = 0;
    var yOff = 0;

    var sortable_opt = {
      distance: 0,
      delay: 100,
      tolerance: 0,
      placeholder: $('<li class="placeholder"/>'),

      onDrag: function ($item, position, _super, event) {
        position.left = 0;
        position.top -= yOff;
        $item.css(position)
      },

      onDragStart: function ($item, container, _super, event) {
        // margin top
        var marginTop = Number($item.css('margin-top').replace('px', ''));

        // mouse grab offset
        xOff = event.offsetX;
        yOff = event.offsetY + marginTop;


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
  },

  // See sorting comment above
  update: function(event, ui){
    var ids = _.map(this.$el.children(), function(li){return li.id.slice(4)})
    this.model.setSuccset(ids);
  },

  render: function(){
    // if model needs to be refetched for dereferenced succset
    if(!this.model.isDeep()){return false;}

    this.$el.empty();
    successors = this.model.get('succset');

    _.each(successors, function(successor, index){
      var viewFactory = LIME.View.SuccessorView['Vertex'];
      var options = {'model':successor, 'predecessor': this.model, 'className': successor.vertexType+ ' successorItem'}
      var successorItemView = new viewFactory(options);
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

LIME.View.SummaryView = {};

LIME.View.SummaryView['Vertex'] = LIME.SummaryView = Backbone.View.extend({
  tagName: 'div',

  events:{
    'click .title':'toggleMeta',
    'click .update':'updateForm',
    'click .save_order':'saveSuccset',
    'click .add_category':'addCategoryForm',
    'click .add_work':'addWorkForm',
    'click .add_photo':'addPhotoForm',
    'click .add_happening':'addHappeningForm',
    'click .set_cover':'setCoverForm'
  },

  initialize: function(){
    this.template = this.buildTemplate();

    // set up sync handler to render anytime model is synced
    // Seems sloppy to set up a sync handler and a summary changed
    // handler. This is done here because summaryChanged is fired before
    // fetchSuccess callback. Deep and Fetched are set there, and when
    // sync is called, it rerenders after those variables are set
    // possible option, put it in the parse function, however this
    // creates difficulties because the model is not created yet
    // Another option would be to override the fetch function.
    this.listenTo(this.model, 'summaryChanged', this.render)
    this.listenTo(this.model, 'sync', this.render);
    this.listenTo(LIME.host, 'sync', this.render)

    _.bindAll('addVertexForm');

    // Must be after template is built, not sure why
    LIME.host.lookupForm('happening', _.bind(this.render, this));
    LIME.host.lookupForm('category', _.bind(this.render, this));
    LIME.host.lookupForm('work', _.bind(this.render, this));

    if(this.model.isFetched() && LIME.host.isFetched){
      this.render();
    }
  },

  buildTemplate: function(){
    console.log("Template: "+ this.model.vertexType);
    if(defined = $('#'+ this.model.vertexType +'_summary').html()){
      console.log('own template for ');
      return _.template(defined);
    } else {
      console.log('default template for ');
      // _id, vertexType, and title
      return _.template($('#vertex_summary').html());
    }
  },

  render: function(){
    if(!this.model.isFetched() || !LIME.host.isFetched){
      return false;
    }

    var vertexSchema = LIME.host.vertexSchema;

    // template
    this.$el.html(this.template(this.model.toJSON()));

    // meta
    this.$meta = this.$el.children('.meta');
    //this.$meta.hide();

    // cover
    this.$cover = this.$el.find('.cover');
    _.each(this.model.get('cover'), function(coverItem){
      this.$cover.append("<img src='"+coverItem.href+"?w=500' alt='' />");
    }, this);

    // add menu
    this.$add_menu = this.$el.find('.add_menu');

    // For compatibility with existing happenings vertex
    // No way to specify in vertexSchema (per host basis)
    // or in vertex (per vertex basis) which types are
    // allowed to be added to others

    if(this.model.vertexType !== 'happenings'){
      _.each(vertexSchema, function(fields, vertexType){
        var add = $("<a class='add_"+vertexType+"'><img src='/icon/"+vertexType+".svg'>add "+vertexType+"</a>");
        var t = this;
        add.click(function(){
          t.addVertexForm(vertexType);
        })
        this.$add_menu.append(add);
      }, this)
    }


    this.delegateEvents();
    return this;
  },

  toggleMeta: function(){
    //this.$meta.slideToggle();
  },

  updateForm: function(){
    LIME.actionPanel.loadVertexForm(this.model, null);
  },

  // passable type for customVertex
  // All vertices are born here
  addVertexForm: function(type){
    // API prefers under_score to camelCase
    var attr = {'vertex_type': type}

    var v = new LIME.Model.Vertex(attr);
    LIME.actionPanel.loadVertexForm(v, this.model);
  },

  setCoverForm: function(){
    LIME.actionPanel.loadCoverForm(this.model);
  },

  saveSuccset: function(){
    this.model.saveSuccset();
  }

});

/*
LIME.View.SummaryView['Vertex.Apex.Body'] = LIME.PortfolioSummaryView = LIME.SummaryView.extend({
  template:_.template($('#body_summary').html())
});

LIME.View.SummaryView['Vertex.Apex.Happenings'] = LIME.PortfolioSummaryView = LIME.SummaryView.extend({
  template:_.template($('#happenings_apex_summary').html())
});

LIME.View.SummaryView['Vertex.Category'] = LIME.CategorySummaryView = LIME.SummaryView.extend({
  template:_.template($('#category_summary').html())
});

LIME.View.SummaryView['Vertex.Work'] = LIME.WorkSummaryView = LIME.SummaryView.extend({
  template:_.template($('#work_summary').html())
});

LIME.View.SummaryView['Vertex.Happening'] = LIME.WorkSummaryView = LIME.SummaryView.extend({
  template:_.template($('#happening_summary').html())
});
*/

/* ------------------------------------------------------------------- */
// Listings
/* ------------------------------------------------------------------- */

LIME.View.ListingView = {};

LIME.View.ListingView['Vertex'] = Backbone.View.extend({
  tagName: 'div',
  summary: null,
  list: null,
  photoNesting: [],
  emptyFlagTemplate: _.template($('#empty_succset').html()),
  events: {
    'dragover': 'outline',
    'dragleave .files_container': 'disappear',
    'drop': 'disappear'
  },

  initialize: function(){

    // children
    this.list = new LIME.View.SuccsetView['Vertex']({model:this.model})

    this.upload = new LIME.FormView['Succset']({
      'model': this.model,
      'photoNesting': this.model.photoNesting,
      'className': 'succset draggable form'
    });

    this.$instruction = $(this.emptyFlagTemplate());

    this.children = [this.list, this.upload];
    this.appendElements();

    // If the model is not finished loading from the server
    // rendering will throw an error
    if(!this.model.isDeep()){
      this.listenToOnce(this.model, 'sync', this.render);
    } else {
      this.render();
    }

    this.listenTo(this.model, 'change:succset', this.render);

  },

  render: function(){
    if(this.model.get('succset').length <= 0){
      this.$instruction.fadeIn();
    } else {
      this.$instruction.slideUp();
    }
    _.each(this.children, function(c){c.render()}, this);
  },

  appendElements: function(){
    this.$instruction.hide();
    this.$el.append(this.$instruction);
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


/* ------------------------------------------------------------------- */
// Apex Menu
/* ------------------------------------------------------------------- */

LIME.View.HomeMenu = Backbone.View.extend({
  tagName: 'ul',
  template: _.template($('#home_menu').html()),
  className: 'home_menu',

  render: function(){
    this.$el.html(this.template({}));
  }
})

/* ------------------------------------------------------------------- */
// Listing Panel
// This panel should be the startpoint for all listings
/* ------------------------------------------------------------------- */

LIME.ListingPanel = Backbone.View.extend({
  el: $('#listing_panel'),
  view: null,
  listedModel: null,
  listStyle: 'list',

  list: function(model){
    if(this.view){
      this.view.close();
    }

    this.listedModel = model;

    this.view = new LIME.View.ListingView['Vertex']({
      'model':model,
      'className': model.vertexType + ' vertex listing'
    });
    this.$el.html(this.view.el);
  },

  apexMenu: function(){
    if(this.view){
      this.view.close();
    }
    this.view = new LIME.View.HomeMenu();
    this.$el.html(this.view.el);
    this.view.render();
  }
});
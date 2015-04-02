/* ------------------------------------------------------------------- */
// LIME Listings
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
      this.dynamicTemplate = false;
      return _.template(defined);
    } else {
      this.dynamicTemplate = true;
      return _.template($('#dynamic_in_set').html());
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

  render_static: function(){
    this.$el.html(this.template(this.model.toJSON()));
  },

  render_dynamic: function(){
    var schema = LIME.host.vertexSchema[this.model.vertexType];
    var first = true;
    this.$el.html(this.template(this.model.toJSON()));
    this.$attributes = this.$el.children('.attributes');

    _.each(schema, function(field){
      if(_.has(this.model.attributes, field.name)){
        if(first){
          first = false;
          this.$attributes.append("<b class='attribute primary'>"+this.model.attributes[field.name]+"</b>");
        } else {
          this.$attributes.append("<b class='attribute'>"+this.model.attributes[field.name]+"</b>");
        }
      }
    }, this)
  },

  render: function(){
    if(this.dynamicTemplate){
      this.render_dynamic();
    } else {
      this.render_static();
    }
    this.$cover = this.$el.children('.cover');

    var ca = this.model.get('cover');
    if(ca.length){
      this.$el.addClass('with_cover');
      _.each(ca, function(coverItem){
        this.$cover.append("<img src='"+coverItem.href+"?w=500' alt='' />")
      }, this);
    } else {
      this.$el.addClass('without_cover');
    }

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
  className: 'succset_list oldview',
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

  // fix bug here
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

    var sortable_opt = {
      distance: 10,
      delay: 200,
      tolerance: 0,
      placeholder: $('<li class="placeholder"/>'),

      onDrag: function ($item, position, _super, event) {
        position.left -= $item.grabOffset.left;
        position.top -= $item.grabOffset.top;
        $item.css(position)
      },

      onDragStart: function ($item, container, _super, event) {

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
    'click .set_cover':'setCoverForm'
  },

  initialize: function(){
    this.template = this.buildTemplate();
    this.addTemplate = _.template($('#vertex_add').html());

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
    this.listenTo(LIME.host, 'sync', this.render);

    _.bindAll('newForm');

    if(this.model.isFetched()){
      this.render();
    }
  },

  buildTemplate: function(){
    var typeSpecificTemplate = $('#'+ this.model.vertexType +'_summary');
    if(typeSpecificTemplate.length){
      return _.template(typeSpecificTemplate.html());
    } else {
      // _id, vertex_type, and title required
      return _.template($('#vertex_summary').html());
    }
  },

  render: function(){
    if(!this.model.isFetched()){
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

    // Happenings check for backwards compatibility with existing
    // happenings vertex. There should be a better solution for this
    if(this.model.vertexType !== 'happenings'){
      _.each(vertexSchema, function(fields, vertexType){
        var add = $(this.addTemplate({'vertex_type': vertexType, 'vertex_label': vertexType.replace(/[-_.]/g, ' ')}))
        $(add).click(_.bind(this.newForm, this, vertexType));
        this.$add_menu.append(add);
      }, this)
    }


    this.delegateEvents();
    return this;
  },

  updateForm: function(){
    LIME.actionPanel.loadVertexForm(this.model, null);
  },

  newForm: function(type){
    // API uses underscored attribute names
    var v = new LIME.Model.Vertex({'vertex_type': type});
    LIME.actionPanel.loadVertexForm(v, this.model);
  },

  setCoverForm: function(){
    LIME.actionPanel.loadCoverForm(this.model);
  },

  saveSuccset: function(){
    this.model.saveSuccset();
  }

});

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

    // This should become add menu
    this.$instruction = $(this.emptyFlagTemplate());

    this.children = [this.list, this.upload];
    this.appendElements();

    // Depth checking is done by Listing Panel before rendering
    this.render();

    // Listen to changes in the succset and rerender
    // Could be more granular
    this.listenTo(this.model, 'change:succset', this.render);

  },

  render: function(){
    // Should be done with CSS, not jQuery
    if(this.model.get('succset').length <= 0){
      this.$instruction.fadeIn();
    } else {
      this.$instruction.slideUp();
    }
    _.each(this.children, function(c){c.render()}, this);
    return this;
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
    return this;
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
  listMode: null,
  viewMode: null,

  modes: [
    ['add_mode', 'Safe'],
    //['reorder_mode', 'Reorder'],
    ['remove_mode', 'Edit']
  ],

  layouts: [
    ['list_view', 'List'],
    ['grid_view', 'Grid'],
    //['relate_view', 'Relate']
    //['move_view', 'Move']
  ],

  initialize: function(){

    // Intial view config
    this.mode = this.modes[0];
    this.layout = this.layouts[0];

    // Listing
    this.listing;

    // Model
    this.model;

    this.render();
  },

  switchViewStyle: function(to, from){
    this.switchClass(to,from);
  },

  switchEditMode: function(to, from){
    this.switchClass(to,from);
  },

  switchClass: function(to, from){
    this.$el.addClass(to)
    this.$el.removeClass(from)
  },

  newForm: function(type){
    // API uses underscored attribute names
    var v = new LIME.Model.Vertex({'vertex_type': type});
    LIME.actionPanel.loadVertexForm(v, this.model);
  },

  render: function(){
    this.$viewMenu = $("<div class='view_menu'></div>").appendTo(this.$el);
    this.$actionMenu = $("<div class='action_menu'></div>").appendTo(this.$el);
    return this;
  },

  renderMenus: function(){
    var vertexType = this.model.vertexType;
    var vertexSchema = LIME.host.vertexSchema;
    var addList = [];

    if(vertexType === 'happenings'){
      addList;
    } else {
      _.each(vertexSchema, function(fields, vertexType){
        addList.push([vertexType, "add "+vertexType.replace(/[-_.]/g, ' ')])
      }, this)
    }

    this.layoutsMenu = new LIME.menu({
      className: 'layout menu',
      schema: this.layouts,
      initial: this.layout,
      label: "View"
    });

    this.modeMenu = new LIME.menu({
      className: 'mode menu',
      schema: this.modes,
      initial: this.mode,
      label: "Mode"
    });

    this.addMenu = new LIME.menu({
      className: 'add_menu menu',
      schema: addList,
      label: "Add"
    });

    // For testing
    pS = [
      ['standard', 'Standard'],
      ['wide', 'Wide'],
      ['narrow', 'Narrow']
    ]
    pSI = pS[0];
    this.panelMenu = new LIME.menu({
      className: 'column_width menu',
      schema: pS,
      initial: pSI,
      label: "TEST"
    });

    this.listenTo(this.layoutsMenu, 'select', this.switchViewStyle);
    this.listenTo(this.modeMenu, 'select', this.switchEditMode);
    this.listenTo(this.addMenu, 'select', this.newForm);
    // Testing
    this.listenTo(this.panelMenu, 'select', _.bind(LIME.panel.shift, LIME.panel));

    this.$viewMenu.empty();
    this.$viewMenu.append(this.layoutsMenu.render().el);
    this.$viewMenu.append(this.modeMenu.render().el);

    this.$actionMenu.empty();
    this.$actionMenu.append(this.addMenu.render().el);
    // Testing
    this.$actionMenu.append(this.panelMenu.render().el);
  },

  renderListing: function(){
    // only render if deep
    if(this.model===null){
      return false;
    }

    // new listing
    this.listing = new LIME.View.ListingView['Vertex']({
      'model':this.model,
      'className': this.model.vertexType + ' vertex listing'
    });

    this.$el.append(this.listing.render().el);
    this.renderMenus();
  },

  list: function(model){
    this.model = model;

    // remove old listing
    if(this.listing){
      this.listing.close();
    }

    if(!this.model.isDeep()){
      this.listenToOnce(this.model, 'sync', this.renderListing);
    } else {
      this.renderListing();
    }

  },

  apexMenu: function(){
    if(this.listing){
      this.listing.close();
    }
    this.listing = new LIME.View.HomeMenu();
    this.$el.append(this.listing.render().el);
  }
});
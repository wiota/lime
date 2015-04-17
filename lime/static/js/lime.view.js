/* ------------------------------------------------------------------- */
// LIME Listings
/* ------------------------------------------------------------------- */

LIME.View = {};

/* ------------------------------------------------------------------- */
// Extend all views with close method
/* ------------------------------------------------------------------- */

Backbone.View.prototype.close = function(){
  if(this.children){_.invoke(this.children, 'close')};
  this.children = null;
  this.stopListening();
  this.unbind();
  this.remove();
}

/* ------------------------------------------------------------------- */
// Vertex View
// What is custom to this view?
// Information Heirarchy = Field order
// View queries data
/* ------------------------------------------------------------------- */

LIME.View.Vertex = Backbone.View.extend({
  events:{
    'click .delete':'delete',
    'click .update':'updateForm',
    // 'click .ui': 'updateForm', // causes cover form button to fail
    'click .title':'toggleMeta',
    'click .set_cover':'setCoverForm'
  },

  defaultTemplate: _.template($('#vertex_template').html()),

  initialize: function(options){

    // ui
      // get
      // return
      // update

    // care of
    this.predecessor = options.predecessor || false;

    // id
    this.$el.attr('id', "_id_"+this.model.id);

    // customTemplate templates (for leaves)
    this.$tmp = $('#'+ this.model.vertexType+'_in_set');
    this.customTemplate = (this.$tmp.length > 0);

    // set template function
    if(this.customTemplate){
      this.template = _.template(this.$tmp.html());
    } else {
      this.template = this.defaultTemplate;
    }

    this.listenTo(this.model, 'summaryChanged', this.render)
  },



  // This should update the model and the model should initiate the request to the server
  delete: function(){
    LIME.requestPanel.one([
      {'func': 'removeEdgeRequest', 'args': [[this.predecessor, this.model]]},
    ]);
    //this.predecessor.removeEdge(this.model);
  },

  updateForm: function(){
    LIME.actionPanel.loadVertexForm(this.model, this.predecessor);
  },

  setCoverForm: function(){
    LIME.actionPanel.loadCoverForm(this.model);
  },

  renderAttributes: function(){
    var clsList = ['primary','secondary','tertiary']
    _.each(LIME.host.vertexSchema[this.model.vertexType], function(field, key){
      if(_.has(this.model.attributes, field.name)){
        this.$attributes.append("<b class='attribute "+(clsList[key])+"'>"+this.model.attributes[field.name]+"</b>");
      }
    }, this)
  },

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    this.$attributes = this.$el.children('.attributes');
    this.$cover = this.$el.children('.cover');

    if(!this.customTemplate){
      this.renderAttributes();
    }

    // render cover
    var ca = this.model.get('cover');
    if(ca.length){
      this.$el.addClass('with_cover');
      _.each(ca, function(coverItem){
        this.$cover.append("<img src='"+coverItem.href+"?h=200' alt='' />")
      }, this);
    } else {
      this.$el.addClass('without_cover');
    }


    this.delegateEvents();
    // disallow delete
    if(!this.model.get('deletable')){
      this.$el.find('.delete').hide();
    }

    return this;
  }
});

/* ------------------------------------------------------------------- */
// Successor Set List
// Logic for sorting and displaying views
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
      // can't figure out what tolerance does
      tolerance: -1000,
      placeholder: $('<li class="placeholder"/>'),
      vertical: false,

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
      var viewFactory = LIME.View.Vertex;
      var options = {
        'model':successor,
        'predecessor': this.model,
        'className': successor.vertexType+ ' successorItem',
        'tagName': 'li'
      }
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

  render_meta: function(){
    var schema = LIME.host.vertexSchema[this.model.vertexType];
    var first = true;

    _.each(schema, function(field){
      console.log(field)
      if(_.has(this.model.attributes, field.name)){
        if(first){
          first = false;
          this.$meta.append("<b class='attribute primary'>"+this.model.attributes[field.name]+"</b>");
        } else {
          this.$meta.append("<b class='attribute'>"+this.model.attributes[field.name]+"</b>");
        }
      }
    }, this)
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
    this.render_meta();

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
    ['add_mode', 'Add/Post'],
    //['sort_mode', 'Sort/Filter'],
    //['order_mode', 'Order/Sequence'],
    ['remove_mode', 'Edit/Cut']
  ],

  layouts: [
    ['list_view', 'List'],
    ['grid_view', 'Grid'],
    //['relate_view', 'Relate']
    //['move_view', 'Move']
  ],

  initialize: function(){

    // Intial view config
    this.mode = 'add_mode';
    this.layout = 'list_view';

    // Listing
    this.listing;

    // Model
    this.model;

    this.render();
  },

  switchLayout: function(to, from){
    this.layout = to;
    this.switchClass(to,from);
  },

  switchEditMode: function(to, from){
    this.mode = to;
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
      className: 'add menu',
      schema: addList,
      label: "Add",
      cls: "add"
    });

    // For testing
    pS = [
      ['standard', 'Standard'],
      ['predecessor', 'Pred'],
      ['narrow', 'Narrow']
    ]
    pSI = pS[0];
    this.panelMenu = new LIME.menu({
      className: 'column_width menu god',
      schema: pS,
      initial: pSI,
      label: "GOD",
      cls: "god"
    });

    this.listenTo(this.layoutsMenu, 'select', this.switchLayout);
    this.listenTo(this.modeMenu, 'select', this.switchEditMode);
    this.listenTo(this.addMenu, 'select', this.newForm);
    // Testing
    this.listenTo(this.panelMenu, 'select', _.bind(LIME.panel.shift, LIME.panel));

    this.clearMenus();

    this.$viewMenu.append(this.layoutsMenu.render().el);
    this.$viewMenu.append(this.modeMenu.render().el);


    this.$actionMenu.append(this.addMenu.render().el);
    // Testing
    this.$actionMenu.append(this.panelMenu.render().el);
  },

  clearMenus: function(){
    this.$viewMenu.empty();
    this.$actionMenu.empty();
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
    LIME.pathPanel.render();
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
    this.clearMenus();
  }
});
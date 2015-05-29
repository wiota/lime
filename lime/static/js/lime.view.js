/* ------------------------------------------------------------------- */
// LIME Views
/* ------------------------------------------------------------------- */

LIME.View = {};

/* ------------------------------------------------------------------- */
// Base View with child management
/* ------------------------------------------------------------------- */

Backbone.View.Base = Backbone.View.extend({
  constructor: function(){
    this.children = [];
    Backbone.View.apply(this, arguments);
  },

  close: function(){
    if(this.children){_.invoke(this.children, 'close')};
    this.children = null;
    this.stopListening();
    this.unbind();
    this.remove();
  },

  appendChildView: function(view){
    view.$el.appendTo(this.$el);
    this.children.push(view);
    return view;
  }
})

/* ------------------------------------------------------------------- */
// Vertex View
// What is custom to this view?
// Information Heirarchy = Field order
// View queries data
/* ------------------------------------------------------------------- */

LIME.View.Vertex = Backbone.View.Base.extend({
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

    // customTemplate templates (for leaves, host, and legacy body / happenings)
    this.$tmp = $('#'+ this.model.vertexType+'_in_set');
    this.customTemplate = (this.$tmp.length > 0);

    // set template function
    if(this.customTemplate){
      this.template = _.template(this.$tmp.html());
    } else {
      this.template = this.defaultTemplate;
    }

    // Upload template
    this.awaitingTemplate = _.template($('#awaiting').html());
    this.barTemplate = _.template($('#upload').html());

    this.listenTo(this.model, 'summaryChanged', this.render);
  },



  // This should update the model and the model should initiate the request to the server
  delete: function(){
    this.predecessor.removeEdgeTo(this.model);
  },

  updateForm: function(){
    LIME.actionPanel.loadVertexForm(this.model, this.predecessor);
  },

  setCoverForm: function(){
    LIME.actionPanel.loadCoverForm(this.model);
  },

  renderAttributes: function(){
    _.each(LIME.host.vertexSchema[this.model.vertexType], function(field, key){
      this.renderAttribute(field.name, key);
    }, this)
  },

  renderAttribute: function(field, order){
    var clsList = ['primary','secondary','tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary', 'nonary', 'denary']
    if(_.has(this.model.attributes, field)){
      if(this.model.isFile(field)){
        this.$attributes.append("<b class='attribute "+clsList[order]+"'>Loading</b>");
      } else {
        this.$attributes.append("<b class='attribute "+clsList[order]+"'>"+this.model.get(field)+"</b>");
      }
    }
  },

  // This render function is becoming bloated
  render: function(){
    var awaiting = null;

    // If item is still awaiting upload, render loading bar
    if(awaiting = this.model.awaitingUpload()){
      this.$el.html(this.awaitingTemplate(this.model.toJSON()));
      this.$attributes = this.$el.children('.attributes');
      this.$uploadContainer = this.$el.children('.upload_container');

      this.bars = _.reduce(awaiting, function(memo, attrFilePair){
        var key = attrFilePair[0];
        memo[key] = $(this.barTemplate()).appendTo(this.$uploadContainer);
        return memo;
      }, {}, this);

      this.renderAttribute('title', 0);

      // Listener
      this.listenTo(this.model, 'uploadProgress', function(percent, attributeKey){
        this.bars[attributeKey].css({width:percent+"%"});
      })

      // Needs to be cleaned up
      this.listenTo(this.model, 'uploadError', function(percent, attributeKey){
        var bar = this.bars[attributeKey];
        var view = this;
        var msg = $('<span>click to retry</span>').appendTo(bar);
        bar.addClass('error');
        bar.on('click', function(){
          msg.remove();
          bar.removeClass('error');
          bar.off('click');
          view.model.save.call(view.model);
        });
      })
      return this;
    }

    // If item is new, do not rerender the UI view.
    if(this.model.isNew()){
      return this;
    }

    this.$el.html(this.template(this.model.toJSON()));
    this.$attributes = this.$el.children('.attributes');
    this.$cover = this.$el.children('.cover');

    if(!this.customTemplate){
      this.renderAttributes();
    }

    // render cover
    var ca = this.model.get('cover');
    if(ca && ca.length){
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
      this.$el.find('.delete').remove();
    }

    return this;
  }
});

/* ------------------------------------------------------------------- */
// Set List
// Logic for sorting and displaying views
/* ------------------------------------------------------------------- */

LIME.View.SetView = Backbone.View.Base.extend({
  tagName: 'ol',
  className: 'set',
  sortFunction: null,

  events: {
    'mousedown': 'startScrolling',
    'mouseup': 'stopScrolling'
  },

  initialize: function(options){

    this.setType = options.setType;
    this.$el.addClass(this.setType);

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
    var container = this.$el;
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

  // targeted add remove rendering will go here

  render: function(){
    // if model needs to be refetched for dereferenced succset
    if(!this.model.isDeep()){return false;}

    this.$el.empty();
    if(this.setType === 'successor'){
      var set = this.model.succset;
    } else if (this.setType === 'predecessor'){
      var set = this.model.predset;
    }

    _.each(set, function(item, index){
      var options = {
        'model':item,
        'predecessor': this.model,
        'className': item.vertexType+ ' successorItem',
        'tagName': 'li'
      }
      var itemView = new LIME.View.Vertex(options);
      this.$el.append(itemView.render().el);
      itemView.listenTo(item, 'change', itemView.render);
      this.children.push(itemView);
    }, this);

    return this;
  }
});

/* ------------------------------------------------------------------- */
// Listings
/* ------------------------------------------------------------------- */

LIME.View.ListingView = {};

LIME.View.ListingView['Vertex'] = Backbone.View.Base.extend({
  tagName: 'div',
  emptyFlagTemplate: _.template($('#empty_succset').html()),
  events: {
    'dragover': 'outline',
    'dragleave .files_container': 'disappear',
    'drop': 'disappear'
  },

  initialize: function(options){
    this.setType = options.setType;

    // children
    this.list = new LIME.View.SetView({model:this.model, setType: this.setType})

    this.upload = new LIME.Forms['Succset']({
      'model': this.model,
      'className': 'succset draggable form'
    });

    // This should become add menu
    this.$instruction = $(this.emptyFlagTemplate());
    this.$instruction.hide();


    this.$el.append(this.$instruction);
    this.$el.append(this.list.el);

    this.$el.append(this.upload.el);
    this.upload.$el.hide();

    this.children = [this.list, this.upload];

    // Depth checking is done by Listing Panel before rendering
    this.render();

    // Listen to changes in the succset and rerender
    if(this.setType === 'successor'){
      this.listenTo(this.model, 'successorAdd', this.render);
      this.listenTo(this.model, 'successorRemove', this.render);
    } else if (this.setType === 'predecessor'){
      this.listenTo(this.model, 'predecessorAdd', this.render);
      this.listenTo(this.model, 'predecessorRemove', this.render);
    }
  },

  render: function(){
    if(this.setType === 'successor'){
      var set = this.model.succset;
    } else if (this.setType === 'predecessor'){
      var set = this.model.predset;
    }

    // Should be done with CSS, not jQuery
    if(set.length <= 0 && this.setType === 'successor'){
      this.$instruction.fadeIn();
    } else {
      this.$instruction.slideUp();
    }
    _.each(this.children, function(c){c.render()}, this);
    return this;
  },

  outline: function(e){
    this.upload.$el.show();
  },

  disappear: function(e){
    this.upload.$el.hide();
  },
});


/* ------------------------------------------------------------------- */
// Apex Menu - This will be replaced by host apex
/* ------------------------------------------------------------------- */

LIME.View.HomeMenu = Backbone.View.Base.extend({
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
// This panel should be rendered once per set
/* ------------------------------------------------------------------- */

LIME.ListingPanel = Backbone.View.Base.extend({
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

  initialize: function(options){

    // Set to render
    this.setType = options.setType;

    // Intial view config
    this.mode = 'add_mode';
    this.layout = 'list_view';

    // Listing
    this.listing;

    // Model
    this.model;

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
    LIME.actionPanel.loadVertexForm(LIME.stack.createVertex({'vertex_type': type}), this.model); // API uses underscored attribute names such as vertex_type
  },

  renderMenuInterface: function(){
    this.$viewMenu = $("<div class='view_menu'></div>").appendTo(this.$el);
    this.$actionMenu = $("<div class='action_menu'></div>").appendTo(this.$el);
    return this;
  },

  // This is a bloated function and possibly in the wrong spot
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
      label: "View",
      radio: true
    });

    this.modeMenu = new LIME.menu({
      className: 'mode menu',
      schema: this.modes,
      initial: this.mode,
      label: "Mode",
      radio: true
    });

    this.addMenu = new LIME.menu({
      className: 'add menu',
      schema: addList,
      label: "Add",
      cls: "add",
      radio: false
    });

    // For testing
    pS = [
      ['standard', 'Standard'],
      ['predecessor', 'Predecessor'],
      ['successor', 'Successor']
    ]

    pSI = pS[0];
    this.panelMenu = new LIME.menu({
      className: 'column_width menu god',
      schema: pS,
      initial: pSI,
      label: "GOD",
      cls: "god",
      radio: true
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
    if(this.$actionMenu){
      this.$actionMenu.empty();
    }
  },

  renderListing: function(){

    this.renderMenuInterface();

    // only render if deep
    if(this.model===null){
      console.warn("Listing render attempted before vertex was ready.")
      return false;
    }

    console.log("Listing render " + this.setType);
    // new listing
    this.listing = new LIME.View.ListingView['Vertex']({
      'model':this.model,
      'className': this.model.vertexType + ' vertex listing',
      'setType': this.setType
    });

    this.$el.append(this.listing.render().el);
    if(this.setType == 'successor'){
      this.renderMenus();
    } else {
      this.switchEditMode(this.mode, null);
      this.switchLayout(this.layout, null)
    }

  },

  list: function(vertex){

    this.model = vertex;

    if(this.listing){
      this.listing.close();
    }

    if(!vertex.isDeep()){
      this.listenToOnce(vertex, 'sync', _.bind(this.renderListing, this, vertex));
    } else {
      this.renderListing(vertex);
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
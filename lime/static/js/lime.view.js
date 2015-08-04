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
    // Pass through router to enable history
    LIME.router.navigate('#'+this.model.vertexType+'/'+this.model.id+"/update");
    LIME.router.update(this.model.vertexType, this.model.id);
  },

  setCoverForm: function(){
    // Pass through router to enable history
    // LIME.router.navigate('#'+this.model.vertexType+'/'+this.model.id+"/cover");
    // LIME.router.cover(this.model.vertexType, this.model.id);
    LIME.ui.primarySubject.form.loadCoverForm(this.model);
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

    // test for rendering
    // console.log("rendering vertex")

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

    // test for rendering
    if(this.$el.hasClass('summary')){
      // this.$el.css({transform:'translate(150%)'});
    } else {
      // this.$el.css({transform:'translate(200px)'});
    }

    var view = this;
    _.delay(function(){
      view.$el.css({transform:'translate(0px)'})
    }, 500);

    return this;
  }
});

/* ------------------------------------------------------------------- */
// Set List
//
// A pure set (successors/predecessors) with no extra stuff. Includes
// logic for sorting.
/* ------------------------------------------------------------------- */

LIME.View.SetView = Backbone.View.Base.extend({
  tagName: 'ol',
  className: 'set',

  events: {
    'mousedown': 'startScrolling',
    'mouseup': 'stopScrolling'
  },

  initialize: function(options){

    this.setType = options.setType;
    this.$el.addClass(this.setType);

    _.bindAll(this, 'update');
    this.sortInit();
    this.scrollTimer = null;
  },


  startScrolling: function(event){
    var framerateInverse = 1000/60;
    var tolerance = 100; // how near the edge
    var initialSpeed = 1; // not sure

    var container = this.$el.closest('.listing');
    var orderedList = this.$el;

    var windowHeight = $(window).height();
    var scrollLimit = orderedList.outerHeight() - windowHeight;

    var _mouseCache = null;
    var _mouseCacheChanged = null;
    var scrollTop = null;
    var scrollBy = null;

    var clamp = function(l, h, val){
      if(val<l){ return l; }
      else if(val>h){ return h; }
      else { return val; }
    }

    var border = function(range, prox, val){
      if(val < prox){ return (val - prox)/prox; }
      else if (val > (flipProx = range-prox)){ return (val - (flipProx))/prox; }
      else { return 0; }
    }

    var calcFn = function(val){
      return val*framerateInverse;
    }

    var calcChange = function(calcFn, val){
      return calcFn(border(windowHeight, tolerance, val));
    }

    var scrollWindow = function(sb){
      // runs on timer
      if(sb === 0){
        return false;
      }
      var scrollTo = clamp(0, scrollLimit, (scrollTop+sb));
      if(scrollTop !== scrollTo){
        container.scrollTop(scrollTo);
        scrollTop = scrollTo;
      }
      // trigger mousemove evt for sorting update
      $(document).trigger(getMouseCache(), "extra");
      return true;
    }

    var setMouseCache = function(evt, ex){
      // mousemove handler
      if(_mouseCache === evt){
        return true;
      }
      _mouseCacheChanged = true;
      _mouseCache = _.clone(evt);
    }

    var getMouseCache = function(){
      _mouseCacheChanged = false;
      return _mouseCache;
    }

    var run = function(time){
      // runs on timer
      if(_mouseCacheChanged){
        scrollBy = calcChange(calcFn, getMouseCache().pageY);
      }
      scrollWindow(scrollBy);
    }

    // ----------------------------------------------
    // right mouse button
    if(event.which > 1){
      return false;
    }

    clearInterval(this.scrollTimer);
    this.scrollTimer = setInterval(_.bind(window.requestAnimationFrame, window, run), framerateInverse);

    // init
    scrollTop = container.scrollTop();
    scrollBy = calcChange(calcFn, getMouseCache());
    _mouseCache = event;
    _mouseCacheChanged = true;

    // run first
    run();

    $(document).on('mousemove', function(){


    });

    $(document).on('mousemove', setMouseCache);
  },

  stopScrolling: function(){
    clearInterval(this.scrollTimer);
    $(document).off('mousemove');
  },

  sortInit: function(orientation){
    var view = this;
    var vert = false;

    if(orientation == 'list_view'){
      vert = true;
    } else if (orientation == 'grid_view'){
      vert = false;
    }

    var sortable_opt = {
      distance: 10,
      delay: 200,
      // can't figure out what tolerance does
      tolerance: 0,
      placeholder: $('<li class="placeholder"/>'),
      vertical: vert,

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

    this.$el.sortable("destroy");
    this.$el.sortable(sortable_opt);
  },

  update: function(event, ui){
    var ids = _.map(this.$el.children(), function(li){return li.id.slice(4)})
    this.model.setSuccset(ids);
  },

  // targeted add remove rendering will go here

  render: function(){
    // if model needs to be refetched for dereferenced succset
    if(!this.model.isDeep()){
      console.warn("Set render attempted before vertex was ready.")
      return false;
    }

    // test for rendering
    // console.log('rendering set - '+ this.setType);

    this.$el.empty();
    if(this.setType === 'successor'){
      var set = this.model.succset;
    } else if (this.setType === 'predecessor'){
      var set = this.model.predset;
    }

    this.children = _.map(set, function(item, index){
      var options = {
        'model':item,
        'predecessor': this.model,
        'className': item.vertexType+ ' successorItem vertex',
        'tagName': 'li'
      }
      var itemView = new LIME.View.Vertex(options);
      this.$el.append(itemView.render().el);
      itemView.listenTo(item, 'change', itemView.render);
      return itemView;
    }, this);

    // test for rendering
    // this.$el.css({backgroundColor:"rgba(235,255,200,.5)"});
    var view = this;

    _.delay(function(){
      view.$el.css({backgroundColor:"transparent"})
    }, 500);


    return this;
  }
});

/* ------------------------------------------------------------------- */
// Listings
//
// Includes a set (successors/predecessors) and interface items such as
// instructions and upload drop container
/* ------------------------------------------------------------------- */

LIME.View.ListingView = Backbone.View.Base.extend({
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
    this.set = new LIME.View.SetView({model:this.model, setType: this.setType})

    this.upload = new LIME.Forms['Succset']({
      'model': this.model,
      'className': 'succset draggable form'
    });

    if(this.setType === 'predecessor'){
      this.nav = new LIME.Nav.AccountNav();
      this.$el.append(this.nav.render().el);
    }

    // This should become add menu
    this.$instruction = $(this.emptyFlagTemplate());
    this.$instruction.hide();


    this.$el.append(this.$instruction);
    this.$el.append(this.set.el);

    this.$el.append(this.upload.el);
    this.upload.$el.hide();

    this.children = [this.set, this.upload];

    // Listen to changes in the succset and rerender
    if(this.setType === 'successor'){
      this.listenTo(this.model, 'successorAdd', this.renderAddRemove);
      this.listenTo(this.model, 'successorRemove', this.renderAddRemove);
    } else if (this.setType === 'predecessor'){
      this.listenTo(this.model, 'predecessorAdd', this.renderAddRemove);
      this.listenTo(this.model, 'predecessorRemove', this.renderAddRemove);
    }
  },

  renderAddRemove: function(){
    console.warn('Only one vertex in the set was modified, but the whole listing was rerendered');
    this.render();
  },

  render: function(){


    // test for rendering
    // console.log("rendering listing");

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
// Listing Panel
// This panel should be rendered once per set
/* ------------------------------------------------------------------- */

LIME.ListingPanel = Backbone.View.Base.extend({
  listing: null,
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

  panels: [
    ['standard', 'Standard'],
    ['predecessor', 'Predecessor'],
    ['successor', 'Successor']
  ],

  initialize: function(options){

    // Set to render
    this.setType = options.setType;
    this.menu = options.menu;

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
    this.listing.set.sortInit(to);
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

  handleNew: function(type){
    if(type==='exisiting'){
      LIME.router.navigate('#'+this.model.vertexType+'/'+this.model.id+"/list/"+this.model.id+"/"+"link");
      LIME.router.link(this.model.vertexType, this.model.id, this.model.id);
    } else {
      LIME.router.navigate('#'+this.model.vertexType+'/'+this.model.id+"/create/"+type);
      LIME.router.create(this.model.vertexType, this.model.id, type);
    }
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


    _.each(vertexSchema, function(fields, vertexType){
      addList.push([vertexType, "add "+vertexType.replace(/[-_.]/g, ' ')])
    }, this)

    addList.push(['exisiting', "add exisiting"]);

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

    this.panelMenu = new LIME.menu({
      className: 'column_width menu god',
      schema: this.panels,
      initial: this.panel,
      label: "GOD",
      cls: "god",
      radio: true
    });

    this.listenTo(this.layoutsMenu, 'select', this.switchLayout);
    this.listenTo(this.modeMenu, 'select', this.switchEditMode);
    this.listenTo(this.addMenu, 'select', this.handleNew);
    this.listenTo(this.panelMenu, 'select', LIME.router.setLensState);

    // Clear
    this.$viewMenu.empty();
    if(this.$actionMenu){
      this.$actionMenu.empty();
    }

    // Append
    this.$viewMenu.append(this.layoutsMenu.render().el);
    this.$viewMenu.append(this.modeMenu.render().el);
    this.$viewMenu.append(this.addMenu.render().el);
    this.$viewMenu.append(this.panelMenu.render().el);

  },

  renderListing: function(){

    // only render if deep
    if(!this.model.isDeep()){
      console.warn("Listing panel render attempted before vertex was ready.")
      return false;
    }

    // new listing
    this.listing = new LIME.View.ListingView({
      'model':this.model,
      'className': this.model.vertexType + ' vertex listing',
      'setType': this.setType
    });

    this.$el.append(this.listing.render().el);
    if(this.menu === true){
      this.renderMenuInterface();
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

  }
});
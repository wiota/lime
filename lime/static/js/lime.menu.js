/* ------------------------------------------------------------------- */
// Listing Menus
/* ------------------------------------------------------------------- */

LIME.menu = Backbone.View.extend({
  tagName: 'div',
  selectedClass: 'selected',
  openClass: 'open',

  initialize: function(options){
    options = options || {};
    this.label = options.label || "+";

    this.itemSchema = options.schema || [];
    this.vb = options.visibilitySwitch || null;
    this.items = [];
    this._selected = null;
  },

  renderMenu: function(){
    this.byIndex = [];
    this.byCls = {};

    _.each(this.itemSchema, function(item, index){
      // scheme may change
      var listItem = this.byCls[item[0]] = this.byIndex[index] = {};
      listItem.cls = item[0];
      listItem.label = item[1];

      listItem.$el = $("<li><a class='"+listItem.cls+"'>"+listItem.label+"</a></li>");
      listItem.$el.appendTo(this.$ul);
      listItem.$el.on('click', _.bind(this.select, this, listItem));
    }, this);
    this.select(this.byIndex[0])
  },

  render: function(){
    this.$el.empty();
    this.$a = $('<a class="switch">'+this.label+'</a>').appendTo(this.$el);
    this.$ul = $('<ul></ul>').appendTo(this.$el);
    //this.$a.on('click', _.bind(this.open, this));
    this.$el.on('mouseenter mouseleave', _.bind(this.open, this))
    this.renderMenu();
    this.delegateEvents();
    return this;
  },

  open: function(){
    if(this.$el.hasClass(this.openClass)){
      this.$el.removeClass(this.openClass);
    } else {
      this.$el.addClass(this.openClass);
    }
  },

  select: function(item){
    var deselect = null;
    if(this._selected){
      if(this._selected === item){
        return false;
      }
      this._selected.$el.removeClass(this.selectedClass);
      deselect = this._selected.cls;
      this.$a.removeClass(this._selected.cls)
    }
    this._selected = item;
    item.$el.addClass(this.selectedClass);
    this.$a.addClass(item.cls)
    this.trigger('select', item.cls, deselect);
  }
})

LIME.addMenu = Backbone.View.extend({
  initialize: function(){
    this.addTemplate = _.template($('#vertex_add').html());
  },

  render: function(model){
    var vertexType = model.vertexType;
    var vertexSchema = LIME.host.vertexSchema;

    if(vertexType === 'happenings'){

    } else {

      _.each(vertexSchema, function(fields, vertexType){
        console.log(fields);
        //var add = $(this.addTemplate({'vertex_type': vertexType}))
        //$(add).click(_.bind(this.newForm, this, vertexType));
        //this.$el.append(add);
      }, this)

    }
    return this;
  }
})

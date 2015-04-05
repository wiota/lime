/* ------------------------------------------------------------------- */
// Listing Menus
/* ------------------------------------------------------------------- */

LIME.menu = Backbone.View.extend({
  tagName: 'div',
  selectedClass: 'selected',
  openClass: 'open',
  switchTemplate: _.template($('#menu_switch').html()),
  itemTemplate: _.template($('#menu_item').html()),

  initialize: function(options){
    options = options || {};
    this.exclusive = options.exclusive || "true";
    this.initial = options.initial || false;
    this.label = options.label || "+";
    this.cls = options.cls || "menu";
    this.itemSchema = options.schema || [];

    this.items = [];
    this._selected = null;
  },

  indexOfCls: function(cls){
    for (var i = 0, l = this.itemSchema.length; i < l; i++) {
      if (this.itemSchema[i][0] === cls) {
        return i;
      }
    }
    return -1;
  },

  renderMenu: function(){
    this.byIndex = [];
    this.byCls = {};

    _.each(this.itemSchema, function(item, index){
      // array passed in to ensure order
      var listItem = this.byCls[item[0]] = this.byIndex[index] = {};
      listItem.cls = item[0];
      listItem.label = item[1];

      listItem.$el = $(this.itemTemplate(listItem));
      listItem.$el.appendTo(this.$ul);
      listItem.$el.on('click', _.bind(this.select, this, listItem.cls));
    }, this);
    if(this.initial && this.indexOfCls(this.initial)>=0){
      this.select(this.initial);
    }
  },

  render: function(){
    this.$el.empty();
    this.$a = $(this.switchTemplate(this)).appendTo(this.$el);
    this.$el.on('mouseenter mouseleave', _.bind(this.open, this));
    // need touch interface
    //this.$a.on('click', _.bind(this.open, this));
    this.$ul = $('<ul></ul>').appendTo(this.$el);
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

  select: function(cls){
    var item = this.byCls[cls];
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
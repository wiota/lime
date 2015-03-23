/* ------------------------------------------------------------------- */
// Listing Menus
/* ------------------------------------------------------------------- */

LIME.menu = Backbone.View.extend({
  tagName: 'ul',
  className: 'listing_menu',
  selectedClass: 'selected',

  initialize: function(options){
    options = options || {};
    this.itemSchema = options.schema || [];
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

      listItem.$el = $("<li class='"+listItem.cls+"'><a>"+listItem.label+"</a></li>");
      listItem.$el.appendTo(this.$el);
      listItem.$el.on('click', _.bind(this.select, this, listItem));
    }, this);
    this.select(this.byIndex[0])
  },

  render: function(){
    this.$el.empty();
    this.renderMenu();
    this.delegateEvents();
    return this;
  },

  select: function(item){
    var deselect = null;
    if(this._selected){
      if(this._selected === item){
        return false;
      }
      this._selected.$el.removeClass(this.selectedClass);
      deselect = this._selected.cls;
    }
    this._selected = item;
    item.$el.addClass(this.selectedClass);
    this.trigger('select', item.cls, deselect);
  }

})
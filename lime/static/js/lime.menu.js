/* ------------------------------------------------------------------- */
// LIME Menus
/* ------------------------------------------------------------------- */

LIME.Menu = Backbone.View.Base.extend({
  tagName: 'div',
  selectedClass: 'selected',
  openClass: 'open',
  switchTemplate: _.template($('#menu_switch').html()),
  itemTemplate: _.template($('#menu_item').html()),

  initialize: function(options){
    options = options || {};
    this.radio = options.radio || false;
    this.initial = options.initial || null;
    this.label = options.label || "";
    this.menuOptions = options.options || [];
    this.fn = options.fn || _.noop;

    this._selected = null;
  },

  indexOfClass: function(className){
    for (var i = 0, l = this.menuOptions.length; i < l; i++) {
      if (this.menuOptions[i][0] === className) {
        return i;
      }
    }
    return -1;
  },

  renderMenu: function(){
    this.byIndex = [];
    this.byClass = {};

    _.each(this.menuOptions, function(item, index){
      var listItem;

      listItem = this.byClass[item.className] = this.byIndex[index] = item;
      listItem.$el = $(this.itemTemplate(listItem)).appendTo(this.$ul);
      if(this.initial === item.className){ this.select(item.className) }
      listItem.$el.on('click', _.bind(this.select, this, listItem.className));
    }, this);
  },

  render: function(){
    this.$el.empty();
    this.$el.addClass("menu");

    this.$a = $(this.switchTemplate(this)).appendTo(this.$el);
    this.$ul = $('<ul></ul>').appendTo(this.$el);
    this.renderMenu();

    this.$el.on('mouseenter mouseleave', _.bind(this.toggleOpen, this));
    // need touch interface
    //this.$a.on('touch', _.bind(this.toggleOpen, this));

    this.delegateEvents();
    return this;
  },

  toggleOpen: function(){
    if(this.$el.hasClass(this.openClass)){
      this.$el.removeClass(this.openClass);
    } else {
      this.$el.addClass(this.openClass);
    }
  },

  select: function(className){
    var item = this.byClass[className];
    var deselect = null;
    // if there is something selected
    if(this._selected){
      if(this._selected === item){ return false }
      this._selected.$el.removeClass(this.selectedClass);
      this.$a.removeClass(this._selected.className)
    }
    if(this.radio){
      this._selected = item;
      item.$el.addClass(this.selectedClass);
      this.$a.addClass(item.className)
    }
    this.fn(item.className);
  }
})

LIME.Menu.MenuGroup = Backbone.View.Base.extend({
  className: "view_menu",
  initialize: function(options){
    this.menus = options.menus || [];
  },

  render: function(){
    var menuViews;

    menuViews = _.map(this.menus, function(menu){
      var menuView;

      menuView = new LIME.Menu(menu).render();
      this.appendChildView(menuView);
      return menu;
    }, this);

    return this;
  }
})

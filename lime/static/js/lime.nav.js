/* ------------------------------------------------------------------- */
// LIME Nav
/* ------------------------------------------------------------------- */


LIME.Nav = Backbone.View.Base.extend({

  className: 'nav_box',
  tagName: 'div',

  render: function(){
    this.$el.empty();


    var accountNav = new LIME.Nav.AccountNav();
    var limeNav = new LIME.Nav.LimeNav();

    this.appendChildView(accountNav);
    this.appendChildView(limeNav);


    accountNav.render();
    limeNav.render();
    return this;
  }

});

LIME.Nav.LimeNav = Backbone.View.Base.extend({

  className: 'nav_box',

  template: _.template($('#lime_nav').html()),

  render: function(){

    // Nav template
    this.$el.html(this.template());

    // Render bookcase
    this.$el.find('.bookcase.icon').html(LIME.icon.get('bookcase'));

    return this;
  }
})

LIME.Nav.AccountNav = Backbone.View.Base.extend({

  className: 'nav_box',

  template: _.template($('#account_nav').html()),

  render: function(){

    // Nav template
    this.$el.html(this.template());

    // Add handlers
    LIME.subnav(this.$el.find('a.drop'))

    return this;
  }
})
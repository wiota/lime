/* ------------------------------------------------------------------- */
// LIME Nav
/* ------------------------------------------------------------------- */

LIME.Nav = {}

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

  setEndpoint: function(endpoint){
    this.$el.find('li.god a').attr('href', endpoint).attr('target', 'blank');
  },

  render: function(){
    // Nav template
    this.$el.html(this.template());

    // Add handlers
    LIME.subnav(this.$el.find('a.drop'))

    return this;
  }
})
/* ------------------------------------------------------------------- */
// Path Views
/* ------------------------------------------------------------------- */

LIME.Path = {};

LIME.Path.PathPanel = Backbone.View.extend({
  el: $('#path_panel'),
  path: [],
  template: _.template($('#path_panel_template').html()),

  render: function(){
    this.$el.html(this.template({}));
  },

  jsonLink: function(link){
    $('li.god a').attr('href', link).attr('target', 'blank');
  },

});
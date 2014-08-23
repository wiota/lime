/* ------------------------------------------------------------------- */
// Path Views
/* ------------------------------------------------------------------- */

App.Path = {};

App.Path.PathPanel = Backbone.View.extend({
  el: $('#path_panel'),
  path: [],
  template: _.template($('#path_panel_template').html()),

  render: function(){
    this.$el.html(this.template({}));
  }

});
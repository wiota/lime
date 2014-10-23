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
  },

  jsonLink: function(link){
    console.log(link)
    this.$el.find('li.god a').attr('href', link).attr('target', 'blank');
  },

});
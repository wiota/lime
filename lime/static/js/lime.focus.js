/* ------------------------------------------------------------------- */
// LIME Focus is the notion of place or location in the graph
/* ------------------------------------------------------------------- */

LIME.FocusPanel = Backbone.View.Base.extend({
  el: $('#focus'),
  historyTemplate: _.template($('#path_vertex_template').html()),

  initialize: function(){
    this.walk = [];
    this.focusView = null;
  },

  render: function(vertex){
    if(!this.model.isFetched()){
      return false;
      console.warn("Focus render attempted before vertex was ready.")
    }

    // focus
    this.focusView = new LIME.View.Vertex({
      'model':this.model,
      'className': this.model.vertexType + ' vertex summary',
      'tagName':'div'
    });

    this.$el.empty();
    this.$el.append(this.focusView.render().el);
  },

  list: function(vertex){

    if(vertex.vertexType === 'host'){
      $('li.god a').attr('href', '/api/v1/host').attr('target', 'blank');
    } else {
      $('li.god a').attr('href', '/api/v1/'+vertex.vertexType+'/'+vertex.id).attr('target', 'blank');
    }

    this.mapWalk(vertex);
    this.model = vertex;

    if(this.focusView){
      this.focusView.close();
    }

    console.log(vertex.isFetched());

    if(!vertex.isFetched()){
      this.listenToOnce(vertex, 'sync', this.render);
    } else {
      this.render();
    }

  },

  mapWalk: function(vertex){
    this.walk.push(vertex);
  }

});
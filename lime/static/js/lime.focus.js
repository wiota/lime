/* ------------------------------------------------------------------- */
// LIME Focus is the notion of place or location in the graph
/* ------------------------------------------------------------------- */

LIME.FocusPanel = Backbone.View.Base.extend({

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

    this.nav = new LIME.Nav();

    this.$el.empty();
    this.$el.append(this.nav.render().el);
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

    if(this.nav){
      this.nav.close();
    }

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

/* ------------------------------------------------------------------- */
// LIME Nav
/* ------------------------------------------------------------------- */


LIME.Nav = Backbone.View.Base.extend({

  className: 'nav_box',

  template: _.template($('#lime_nav').html()),

  initialize: function(){

  },

  render: function(){
    this.$el.empty();

    // Nav template
    this.$el.html(this.template());

    // Add handlers
    LIME.subnav(this.$el.find('a.drop'))

    // Render icons
    this.$el.find('.bookcase.icon').html(LIME.icon.get('bookcase'));

    return this;
  }


})
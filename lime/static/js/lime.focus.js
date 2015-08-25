/* ------------------------------------------------------------------- */
// LIME Focus is the notion of place or location in the graph
//
// Persistant UI View
//
// This module lists the attributes of the data model which is passed
// to it. It contains view state as to whether the user is reading or
// updating. There is also a navigation built into the header.
/* ------------------------------------------------------------------- */

LIME.FocusLens = Backbone.View.Base.extend({

  initialize: function(){
    // Views
    this.readView = null;
    this.updateView = null;
    this.nav = new LIME.Nav.LimeNav(); // Persistent, doesn't change with render

    // View State
    this.viewStates = ['read', 'update', 'cover'];
    this.setViewState('read');
  },

  list: function(vertex){
    this.model = vertex;
    this.renderWhenReady(vertex);
  },

  setViewState: function(viewState){
    if(this.viewState !== viewState){
      this.viewState = viewState;
      this.switchOutClass(viewState, this.viewStates);
    }
  },

  render: function(){
    if(!this.model.isFetched()){ console.warn("Render attempted before model was fetched") }

    this.readView && this.readView.close();
    this.updateView && this.updateView.close();

    // read
    this.readView = new LIME.View.Vertex({
      'model':this.model,
      'className': this.model.vertexType + ' vertex read_view',
      'tagName':'div'
    });

    // update
    this.updateView = new LIME.Forms.UpdateVertex({
      'model':this.model,
      'className': 'vertex update_view'
    })

    // update
    this.coverView = new LIME.Forms.UpdateCover({
      'model':this.model,
      'className': 'vertex cover_view'
    })

    this.$el.empty();
    this.$el.append(this.nav.render().el);
    this.$el.append(this.readView.render().el);
    this.$el.append(this.coverView.render().el);
    this.$el.append(this.updateView.render().el)
  }

});

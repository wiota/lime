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
    this.nav = new LIME.Nav.LimeNav(); // Persistent, doesn't change with render
    this.state = new LIME.StateMachine();
    this.inputStates = ['read', 'update', 'cover'];

    this.state.on('inputState', function(inputState){
      this.switchOutClass(this.inputStates, inputState);

      // cascading state
      if(inputState === 'update'){
        this.updateView && this.updateView.state.set('inputState', 'update');
        this.coverView && this.coverView.state.set('inputState', 'read');
      } else if (inputState === 'cover'){
        this.updateView && this.updateView.state.set('inputState', 'read');
        this.coverView && this.coverView.state.set('inputState', 'update');
      } else {
        this.updateView && this.updateView.state.set('inputState', 'read');
        this.coverView && this.coverView.state.set('inputState', 'read');
      }

    }, this);
  },

  list: function(vertex){
    this.model = vertex;
    this.renderWhenReady(vertex);
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
      'className': 'vertex update_view',
      'inputState': this.state.get('inputState')
    })

    // update
    this.coverView = new LIME.Forms.UpdateCover({
      'model':this.model,
      'className': 'vertex cover_view',
      'inputState': this.state.get('inputState')
    })

    this.$el.empty();
    this.$el.append(this.nav.render().el);
    this.$el.append(this.readView.render().el);
    this.$el.append(this.coverView.render().el);
    this.$el.append(this.updateView.render().el)
  }

});

/* ------------------------------------------------------------------- */
// Path Views
/* ------------------------------------------------------------------- */

LIME.Focus = Backbone.View.Base.extend({
  el: $('#focus'),
  historyTemplate: _.template($('#path_vertex_template').html()),

  initialize: function(){
    this.walk = [];
    this.path = [];
    this.focus = null;
    this.focusView = null;
  },

  render: function(){
    if(this.path.length <= 0){
      return;
    }

    // history
    var $history = $('.lime_nav .back .path');
    $history.empty();
    // _.each(_.initial(this.path), function(vertex, iterator){
    //  $(this.historyTemplate(vertex.toJSON())).appendTo($history).click(_.bind(LIME.focus.retrace, this, iterator));
    // }, this);

    // focus
    var vertex = _.last(this.path);
    this.focusView = new LIME.View.Vertex({
      'model':vertex,
      'className': vertex.vertexType + ' vertex summary',
      'tagName':'div'
    });

    this.$el.empty();
    this.$el.append(this.focusView.el);

    if(vertex.isDeep()){
      this.focusView.render();
    };
  },

  list: function(vertex){

    if(vertex.vertexType === 'body'){
      $('li.god a').attr('href', '/api/v1/body').attr('target', 'blank');
    } else {
      $('li.god a').attr('href', '/api/v1/'+vertex.vertexType+'/'+vertex.id).attr('target', 'blank');
    }

    // Method 1
    //var last = this.path.length > 1 ? _.first(_.last(this.path, 2)) : {get:function(){return 'nothing';}};
    this.mapWalk(vertex);


    if(this.focusView){
      this.focusView.close();
    }

    this.render();

  },

  mapWalk: function(vertex){
    // Done after routing
    var index = _.indexOf(this.path, vertex);

    if(index >= 0){
      this.path = _.first(this.path, index);
    }

    this.path.push(vertex);
    this.walk.push(vertex);

    if(this.path[0].vertexType !== "host"){
      var id = (LIME.host.get('apex'));
      var host = LIME.collection.Vertex.lookup(id, 'host');
      this.path.unshift(host);
    }
  },

  nowhere: function(){
    $('li.god a').attr('href', '/api/v1/host').attr('target', 'blank');
    if(this.focusView){
      this.focusView.close();
    }
    this.path = [];
    this.render();
  },

  retrace: function(step){
    // Done before routing
    var vertex = this.path[step];
    this.path = _.first(this.path, step);

    _.each(this.path, function(vertex){
      console.log(vertex.get('title'));
    });

    if(vertex.vertexType==='body'){
      var route = "body";
    } else {
      var route = vertex.vertexType + '/' + vertex.id;
    }

    console.log(route);
    LIME.router.navigate(route, {trigger: true})
    //console.log()
  }

});
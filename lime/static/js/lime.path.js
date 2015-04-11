/* ------------------------------------------------------------------- */
// Path Views
/* ------------------------------------------------------------------- */

LIME.Path = {};

LIME.Path.PathPanel = Backbone.View.extend({
  el: $('#navigation_column'),
  path: [],
  walk: [],
  template: _.template($('#path_panel_template').html()),
  vertexTemplate: _.template($('#path_vertex_template').html()),

  initialize: function(){
    this.summary;
  },

  render: function(){
    var $path = this.$el.find('#path_panel')
    var $history = this.$el.find('.graph_nav .back .path');


    $path.html(this.template({}));

    if(this.path.length <= 0){
      return;
    }

    // path
    $history.html('');
    _.each(_.initial(this.path), function(vertex, iterator){
      var click = function (){
        LIME.pathPanel.retrace(iterator);
      }
      $(this.vertexTemplate(vertex.toJSON())).appendTo($history).click(click);
    }, this);

    // summary
    var vertex = _.last(this.path);
    this.summary = new LIME.View.Vertex({
      'model':vertex,
      'className': vertex.vertexType + ' vertex summary',
      'tagName':'div'
    });
    $path.append(this.summary.el);

    if(vertex.isDeep()){
      this.summary.render();
    };
  },

  jsonLink: function(link){
    $('li.god a').attr('href', link).attr('target', 'blank');
  },

  list: function(vertex){

    // Method 1
    //var last = this.path.length > 1 ? _.first(_.last(this.path, 2)) : {get:function(){return 'nothing';}};
    this.mapWalk(vertex);


    if(this.summary){
      this.summary.close();
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

    if(this.path[0].vertexType !== "body"){
      var body = LIME.apex.body;
      this.path.unshift(body);
    }
  },

  nowhere: function(){
    if(this.summary){
      this.summary.close();
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
/* ------------------------------------------------------------------- */
// Path Views
/* ------------------------------------------------------------------- */

LIME.Path = {};

LIME.Path.PathPanel = Backbone.View.extend({
  el: $('#path_panel'),
  path: [],
  walk: [],
  template: _.template($('#path_panel_template').html()),
  vertexTemplate: _.template($('#path_vertex_template').html()),

  initialize: function(){
    this.summary;
  },

  render: function(){
    this.$el.html(this.template({}));

    if(this.path.length <= 0){
      return;
    }

    // path
    var $path = this.$el.find('.path');
    _.each(_.initial(this.path), function(vertex, iterator){
      var click = function (){
        LIME.pathPanel.walkTo(iterator);
      }
      $(this.vertexTemplate(vertex.toJSON())).appendTo($path).click(click);
    }, this);

    // summary
    var vertex = _.last(this.path);
    var _cls = vertex.get('_cls');
    var className = LIME.clsToClass(_cls) + ' summary';
    this.summary = new LIME.View.SummaryView[_cls]({'model':_.last(this.path), 'className': className});
    $path.append(this.summary.el);
    this.summary.render();

  },

  jsonLink: function(link){
    $('li.god a').attr('href', link).attr('target', 'blank');
  },

  list: function(vertex){

    // Method 1
    var last = this.path.length > 1 ? _.first(_.last(this.path, 2)) : {get:function(){return 'nothing';}};
    //console.log();

    // Paths and Walks
    if(vertex.get('_cls')==='Vertex.Apex.Body'){
      this.path = [vertex];
    } else if(vertex===last){
      this.path.pop();
    } else {
      this.path.push(vertex); // simple path
    }

    this.walk.push(vertex);

    //console.log(this.walk)
    //console.log(this.path)

    // View

    if(this.summary){
      this.summary.close();
    }

    this.render();

  },

  nowhere: function(){
    if(this.summary){
      this.summary.close();
    }
    this.path = [];
    this.render();
  },

  walkTo: function(step){
    var vertex = this.path[step];
    this.path = _.first(this.path, step);

    _.each(this.path, function(vertex){
      console.log(vertex.get('title'));
    });

    if(vertex.get('_cls')==='Vertex.Apex.Body'){
      var route = "body";
    } else {
      var route = LIME.clsToRoute(vertex.get('_cls')) + '/' + vertex.id;
    }

    console.log(route);
    LIME.router.navigate(route, {trigger: true})
    //console.log()
  }

});
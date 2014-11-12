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

  render: function(){
    this.$el.html(this.template({}));

    // path
    var $path = this.$el.find('.path');
    _.each(_.initial(this.path), function(vertex){
      $path.append(this.vertexTemplate(vertex.toJSON()));
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
    console.log(last.get('title') + " " + vertex.get('title'));

    // Paths and Walks
    if(vertex===last){
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

  }

});
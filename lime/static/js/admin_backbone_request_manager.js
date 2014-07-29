/* ------------------------------------------------------------------- */
// Portphillio Admin Request Manager
/* ------------------------------------------------------------------- */

// id tag
// on success, remove them
// on error, rerun once and then flag the manager to halt requests

// should I keep track of the batch requests?
// or just the individual requests?

App.Request = Backbone.View.extend({
  initialize: function(options){
    this.options = options
    this.rid = options.rid;
  },

  registerSubrequests: function(subrequests){
    this.subrequests = subrequests;
    _.each(this.subrequests, this.registerSubrequest, this);

  },

  registerSubrequest: function(subrequest){
    subrequest.parentRequest = this;
    this.listenTo(subrequest, 'complete', this.removeSubrequest);
  },

  removeSubrequest: function(subrequest){
    this.subrequests = _.without(this.subrequests, subrequest)
    if(this.subrequests.length <= 0){
      this.trigger('complete', this);
      this.trigger('parentcomplete', this);
    }
  }

});

App.GraphRequest = Backbone.View.extend({
  initialize: function(options){
    this.options = options || {};
    this.vertices = this.options.vertices;
    this.edges = this.options.edges || [];
  },

  start: function(){
    this.vertexRequest();
  },

  vertexRequest: function(){
    var unidentified_vertices = 0;

    // add vertices
    _.each(this.vertices, function(model){

      // in case any verticies are not new.
      if(!model.isNew()){
        return false;
      }
      unidentified_vertices++;
      var _cls = model.get('_cls')

      // client side
      var collection = App.collection[_cls];
      collection.add(model);

      // persistence
      model.save();

      // sync
      this.listenToOnce(model, 'sync', function(){
        unidentified_vertices--;
        if(unidentified_vertices <= 0){
          this.trigger('verticescomplete')
          this.edgeRequest();
        }
      }, this);

      // error
      this.listenToOnce(model, 'error', function(){
        this.trigger('error');
      }, this);
    }, this)
  },

  edgeRequest: function(vertices, edges, batchItemView){
    var missing_edges = 0;

    // add edges
    _.each(this.edges, function(set){
      missing_edges++;
      var model = set[0];
      model.addToSuccset(set[1]);

      console.log('added '+ model.get('_cls') + ' to ' + set[1].get('_cls'));
      // sync
      this.listenToOnce(model, 'sync', function(){
        missing_edges--;
        if(missing_edges <= 0){
          this.trigger('edgescomplete')
          //batchItemView.collapse();
        }
      }, this);
      // error
      this.listenToOnce(model, 'error', function(){
        console.log('edge save error' + model.get('title'));
        batchItemView.error();
      }, this);
    }, this);
  },

});

App.RequestPanel = Backbone.View.extend({
  el: $('#request_panel'),
  requestsMade: 0,
  requests: [],

  initialize: function(){},

  batchPhotoUploadRequest: function(files, newPhotoNesting, model, predecessor){

    // initiate a new request
    var request = this.initRequest();

    // initiate new subrequests
    var subrequests = _.map(files, function(file){
      return this.photoUploadRequest(file, newPhotoNesting, model);
    }, this);

    // set variables
    request.requestType = 'batch';

    // register subrequests
    request.registerSubrequests(subrequests);


    // if model is new, add to predecessor

    // upload
    // request.batchView = new App.Upload.batchProgressView({'className': 'batch'});
    // App.actionPanel.$el.prepend(request.batchView.render().el);

    return request;

  },

  photoUploadRequest: function(file, nesting, model){
    var request = this.initRequest();

    // set variables
    request.requestType = 'nestedphoto';
    request.file = file;
    request.nesting = nesting;
    request.model = model;

    var time = (Math.random() * 2000) + 1000;
    setTimeout(function(){
      request.trigger('complete', request);
    }, time)

    return request;

  },

  getId: function(){
    return this.requestsMade++;
  },

  initRequest: function(){
    // create new request
    var rid = this.getId();
    var request = new App.Request({'rid':rid});

    // keep track of it
    this.requests.push(request);
    this.listenTo(request, 'complete', this.removeRequest);

    // log
    console.log('request '+ rid + ' created');

    // return to calling function for further decoration
    return request;
  },

  removeRequest: function(request){
    // log
    console.log('request '+ request.rid + ' removed');

    // remove from master list
    this.requests = _.without(this.requests, request);

    // remove request (backbone view)
    request.remove();
  },

  initGraphRequest: function(vertices, edges){
    var batchRequest = new App.GraphRequest({'vertices': vertices, 'edges': edges});
    batchRequest.start();
    return batchRequest;
  }

})


/* ------------------------------------------------------------------- */
// Portphillio Admin Request Panel
/* ------------------------------------------------------------------- */

// id tag
// on success, remove them
// on error, rerun once and then flag the manager to halt requests

/* ------------------------------------------------------------------- */
// Request Library
/* ------------------------------------------------------------------- */

App.RequestLibrary = {
  request: function(instruction){
    return new App.Request(instruction);
  },

  requests: function(instructions){
    return _.map(instructions, function(instruction){return this.request(instruction)}, this);
  },

  mapToInstructions: function(array, func, additionalParams){
    additionalParams = additionalParams || [];
    return _.map(array, function(item){return {'func': func, 'args': [item].concat(additionalParams)}}, this);
  },

  serial: function(instructions, callback, error){

    // context for callback
    var context = this;
    var errors = [];

    // callback immediately if no requests
    if(!instructions || instructions.length == 0){return callback.apply(context, arguments)}

    // map object notation to request object
    var requests = this.requests(instructions);

    // last request for chaining and callback
    var lastRequest = _.last(requests);

    // Set up callback depending on request context
    var callback = callback || this.callback || function(){
      console.log('serial complete');
      this.trigger('complete');
    }

    var error = error || this.error || function(){
      console.log('serial error');
      this.trigger('error');
    }

    var delay = delay || this.delay || function(){
      console.log('serial delay');
      this.trigger('delay');
    }

    // set up callback to listen to last request
    this.listenTo(lastRequest, 'complete', function(){
      return callback.apply(context, arguments)
    });


    this.listenTo(lastRequest, 'error', function(){
      return delay.apply(context, arguments)
    })

    this.listenTo(lastRequest, 'delay', function(){
      return delay.apply(context, arguments)
    });


    // set up latter request to listen former request and execute foremost
    _.reduceRight(_.initial(requests),
      function(r1, r2) {
        r1.listenTo(r2, 'complete', function(){r1.execute.apply(r1, arguments);})
        r1.listenTo(r2, 'error', function(){r1.delay.apply(r1, arguments);})
        r1.listenTo(r2, 'delay', function(){r1.delay.apply(r1, arguments);})
        return r2;
      },
      lastRequest
    ).execute();
  },

  parallel: function(instructions, callback, error){
    // context for callback
    var context = this;

    // callback immediately if no instructions
    if(!instructions || instructions.length == 0){return callback.apply(context, arguments)}

    // Set up callback depending on request context
    var callback = callback || this.callback || function(){
      console.log('parallel complete');
      this.trigger('complete');
    }

    var error = error || this.error || function(){
      console.log('parallel error');
      this.trigger('error');
    }

    var delay = delay || this.delay || function(){
      console.log('parallel delay');
      this.trigger('delay');
    }

    var notches = instructions.length;
    var notch = 0;

    // execute all requests
    _.each(instructions, function(instruction){
      var request = this.request(instruction);
      this.listenTo(request, 'complete', function(){
        notch++;
        if(notch>=notches){return callback.apply(context);}
      });
      this.listenTo(request, 'error', function(){return delay.apply(context);});
      this.listenTo(request, 'delay', function(){return delay.apply(context);});
      request.execute();
    }, this);
  },

  one: function(instructions, callback, error){
    this.serial(instructions, callback, error);
  }
}

/* ------------------------------------------------------------------- */
// Request Function
/* ------------------------------------------------------------------- */

App.Request = Backbone.View.extend({

  initialize: function(options){

    this.options = options || {};
    // Id this request
    this.rid = App.requestPanel.getId();
    this.labelRendered = false;
    this.sts = "created";
    // Keep track of it
    var request = this;
    App.requestPanel.register(request);
    this.sts = "registered";
    // Actions to take after events
    App.requestPanel.listenTo(this, 'complete', function(){
      request.sts = "complete";
      App.requestPanel.unregister(request);
      request.sts = "unregistered";
    });
    App.requestPanel.listenTo(this, 'error', function(){
      request.sts = "error";
    });
    App.requestPanel.listenTo(this, 'delay', function(){
      request.sts = "delay";
    });
    _.bindAll(this, 'callback', 'error');
  },

  execute: function(){
    console.log('---- Executing ' + this.rid + " " + this.options.func + ' -------');
    this.sts = "executing";
    this.options.args = this.options.args.concat(_.toArray(arguments));
    return App.RequestApi[this.options.func].apply(this, this.options.args);
  },

  // default callbacks, can be overriden
  callback: function(){
    args = ['complete'].concat(_.toArray(arguments));
    this.trigger.apply(this, args);
  },

  error: function(){
    args = ['error'].concat(_.toArray(arguments));
    this.trigger.apply(this, args);
  },

  delay: function(){
    args = ['delay'].concat(_.toArray(arguments));
    this.trigger.apply(this, args);
  }

});

/* ------------------------------------------------------------------- */
// Request Panel
/* ------------------------------------------------------------------- */

App.RequestPanel = Backbone.View.extend({
  el: $('#request_panel'),
  requestsMade: 0,
  pendingRequests: [],
  completedRequests: [],

  initialize: function(){
    //this.render();
    this.initPanelInterface();
  },

  getId: function(){
    return this.requestsMade++;
  },

  register: function(request){
    console.log('---- Register ' + request.rid + " " + request.options.func + ' -------');
    //console.log(request.options.args);
    this.pendingRequests.push(request);
    //this.render();
  },

  unregister: function(request){
    //console.log('---- Unregister ' + request.rid + ' -------');
    //this.render();
    // turn off for lines instead of mountains
    this.pendingRequests = _.without(this.pendingRequests, request);
    request.remove();
  },

  retry: function(){
    _.each(this.pendingRequests, function(r){
      if(r.sts == 'error'){
        r.execute();
      }
    });
  },

  completeById: function(){
    return _.indexBy(this.completedRequests, 'rid');
  },

  initPanelInterface: function(){
    var panel = this.$el;
    panel.on('mousedown', function(e){
      if(e.which == 3) {return false}
      var of = e.offsetY;
      $(window).on('mousemove', function(e){
        var top = ((e.pageY - of)/$(this).height()*100) + '%';
        panel.css({'top':top})
      });
      $(window).on('mouseup', function(){
        $(this).unbind('mouseup mousemove');
      });
      return false;
    })
  },

  render: function(){
    if(this.pendingRequests.length<=0){};
    var a = $('<div class="requestlog"></div>');
    _.each(this.pendingRequests, function(r){
      if(r.rid < 10){format = '&nbsp;'}
      else {format = ''}
      if(!r.labelRendered){label = this.renderLabels(r);}
      else {label = '';}
      display = "<a class='" + r.sts + " "+ r.options.func + "'>"+label+"<span>" + format + r.rid + "</span></a>";
      a.append(display);
    }, this);
    this.$el.children('.container').prepend(a);
  },

  renderLabels: function(r){
    var func = r.options.func;
    var args = r.options.args

    var returnString = "<span class='args'>";
    returnString += func + " ";

    if(func == 'batchPhotosToVertex'){
      returnString += args[0].length + ' files';

    } else if(func == 'graphRequest'){

    } else if(func == 'createVerticesRequest'){
      var vertices = args[0];
      returnString += _.reduceRight(vertices, function(memo, v){
        return memo + " {" + (v.attributes && (v.attributes.title || _.last(v.attributes.href.split('/'))))+"}";
      }, '');

    } else if(func == 'createVertexRequest'){
      returnString += "{"+(args[0].attributes && (args[0].attributes.title || _.last(args[0].attributes.href.split('/'))))+"}";

    } else if(func == 'createEdgesRequest'){
      var edges = args[0]
      returnString += _.reduceRight(edges, function(memo, e){
        return memo + " ["
          + (e[0].attributes && (e[0].attributes.title || _.last(e[0].attributes.href.split('/'))))
          + ", "
          + (e[1].attributes && (e[1].attributes.title || _.last(e[1].attributes.href.split('/'))))
          + "]";
      }, '');

    } else if(func == 'createEdgeRequest'){
      returnString += "["
        + (args[0][0].attributes && (args[0][0].attributes.title || _.last(args[0][0].attributes.href.split('/'))))
        + ", "
        + (args[0][1].attributes && (args[0][1].attributes.title || _.last(args[0][1].attributes.href.split('/'))))
        + "]";

    } else if(func == 'photoRequest' || func == 'filePutRequest' || func == 'wrapVertex'){
      returnString += args[0].name;
    }

    returnString += "</span>";
    r.labelRendered = true;
    return returnString;
  }

})


_.extend(App.RequestPanel.prototype, App.RequestLibrary);
_.extend(App.Request.prototype, App.RequestLibrary);
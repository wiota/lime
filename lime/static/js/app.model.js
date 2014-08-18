/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Models
/* ------------------------------------------------------------------- */

App.Model = {};

/* ------------------------------------------------------------------- */
// App Model Overrides
/* ------------------------------------------------------------------- */

Backbone.Model.prototype.parse = function(response){
  if(response.result)
  return response.result;
};

Backbone.Model.prototype.origUrl = Backbone.Model.prototype.url

Backbone.Model.prototype.url = function() {
    var origUrl = Backbone.Model.prototype.origUrl.call(this);
    return origUrl + (origUrl.charAt(origUrl.length - 1) == '/' ? '' : '/');
}

Backbone.Model.prototype.idAttribute = "_id";

/* ------------------------------------------------------------------- */
// Vertex - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

App.Model['Vertex']= Backbone.Model.extend({
  referencedFields: ['succset', 'predset', 'cover'],

  initialize: function(options){
    options = options || {};
    this.fetched = options.fetched || false;
    this.deep = options.deep || false;
    this.modified = options.modified || false;

    this.on('sync', function(){this.modified = false;})

    if(this.isNew()){
      this.set({'_cls': this._cls, 'title': this.get('title') || 'untitled'})
      this.modified = false;
    }
    this.on('change', this.triggerEvents);
  },

  triggerEvents: function(model, options){
    this.modified = true;
    var attr = model.changedAttributes()
    var summary_attr = _.omit(attr, 'succset');

    if(!_.isEmpty(summary_attr)){
      // put changed attributes into array
      this.trigger('summaryChanged', {'attr':summary_attr});
    }

    msg.log("CHANGE Model ['"+_.keys(attr).join("', '") + "']", 'model');
  },

  isFetched: function(){
    return this.fetched;
  },

  isDeep: function(){
    return this.deep;
  },

  isModified: function(){
    return this.modified;
  },

  parse: function(response){
    if(response.result){
      response.result.succset = this.reference(response.result.succset);
      response.result.cover = this.reference(response.result.cover);
      return response.result;
    }

  },

  deepen: function(){
    msg.log("GET "+ this.url(), 'lookup');
    this.fetch({
      success: this.deepenSuccess,
      error: this.deepenError
    });
    return this;
  },

  deepenSuccess: function(model, response, options){
    msg.log("FETCH SUCCESS " + model.get("_id") + " " + model.get("title"),'lookup');
    var collection = App.collection[model.get('_cls')];

    collection.add(model);

    model.fetched = true;
    model.deep = true;
    model.modified = false;
  },

  deepenError: function(model, response, options){
    console.log("Fetch unsucessful " + response);
  },

  reference: function(succset){
    var succsetReferences = [];
    _.each(succset, function(object){
      var collection = App.collection[object._cls];
      var modelFactory = App.Model[object._cls];
      var model = collection.get(object['_id']) || new modelFactory(object, {'fetched': true, 'deep': false});

      collection.add(model); // if model already exists in collection, this request is ignored
      succsetReferences.push(model);
    });
    return succsetReferences;
  },

  outOfSync: function(){
    msg.log(this._cls)
    // Calling photo function
    this.fetched = false;
    this.trigger('outofsync');
    this.once('sync', this.resynced);
    this.deepen();
  },

  resynced: function(){
    this.trigger('resynced');
  },

  /* ------------------------------------------------------------------- */
  // Attribute Functions
  /* ------------------------------------------------------------------- */

  saveAttributes: function(options){
    var attrs = _.omit(this.attributes, this.referencedFields);
    var model = this;

    options = options || {};

    var success = options.success;
    var error = options.error;

    options.success = function(resp){
      if(success) success(model, resp, options);
      model.trigger('sync', model, resp);
      console.log('sync attributes save on ' + model.get('_id'))
    }

    options.error = function(resp){
      if(error) error(model, resp, options);
      model.trigger('error', model, resp);
    }

    options.attrs = attrs;
    Backbone.sync('update', this, options);
  },

  /* ------------------------------------------------------------------- */
  // Succset Functions
  /* ------------------------------------------------------------------- */

  addEdgeTo: function(successor, options){
    // succset
    var succset = _.clone(this.get('succset'));
    succset.unshift(successor);
    this.set({'succset':succset});

    // predset
    var predset = _.clone(successor.get('predset'));
    predset.unshift(this);
    successor.set({'predset': predset});

    this.createEdge(successor, options);
  },

  removeEdgeTo: function(successor, options){
    // succset
    var succset = this.get('succset');
    this.set({'succset':_.without(succset, successor)});

    // predset
    var predset = successor.get('predset');
    successor.set({'succset':_.without(predset, this)});

    this.destroyEdge(successor, options);
  },

  destroyEdge: function(successor, options){
    var model = this;

    options = options || {};

    var success = options.success;
    var error = options.error;

    options.success = function(resp){
      if(success) success(model, resp, options);
      model.trigger('sync', model, resp);
      console.log('sync succset save on ' + model.get('_id'))
    }

    options.error = function(resp){
      if(error) error(model, resp, options);
      model.trigger('error', model, resp);
    }

    options.url = 'api/v1/edge/';
    options.data = JSON.stringify({'edges': [this.get('_id'),successor.get('_id')]});
    console.log(options.data);
    options.contentType = 'application/json';
    Backbone.sync('delete', this, options);
  },


  createEdge: function(successor, options){
    var model = this;

    options = options || {};

    var success = options.success;
    var error = options.error;

    options.success = function(resp){
      if(success) success(model, resp, options);
      model.trigger('sync', model, resp);
      console.log('sync succset save on ' + model.get('_id'))
    }

    options.error = function(resp){
      if(error) error(model, resp, options);
      model.trigger('error', model, resp);
    }

    options.url = 'api/v1/edge/';
    options.data = JSON.stringify({'edges': [this.get('_id'),successor.get('_id')]});
    console.log(options.data);
    options.contentType = 'application/json';
    Backbone.sync('create', this, options);
  },

  saveSuccset: function(options){
    var list = this.get('succset');
    var model = this;

    options = options || {};

    var success = options.success;
    var error = options.error;

    options.success = function(resp){
      if(success) success(model, resp, options);
      model.trigger('sync', model, resp);
      console.log('sync succset save on ' + model.get('_id'))
    }

    options.error = function(resp){
      if(error) error(model, resp, options);
      model.trigger('error', model, resp);
    }

    options.url = this.url() + 'succset/';
    options.attrs = {'succset': _.pluck(list, 'id')};

    Backbone.sync('update', this, options);
  },

  // for reordering
  setSuccset: function(idList){
    var succset = this.get('succset');
    var update = [];
    _.each(idList, function(id, index, list){
      var obj = _.findWhere(succset, {'id': id});
      update.push(obj);
    });
    //console.log(_.pluck(update, 'id'));
    this.set({'succset': update});
    this.saveSuccset();
  },

  /* ------------------------------------------------------------------- */
  // Cover Functions
  /* ------------------------------------------------------------------- */

  setCover: function(photos, options){
    this.set({'cover':photos});
    this.saveCover(options);
  },

  saveCover: function(options){
    var list = this.get('cover');
    var model = this;

    options = options || {};

    var success = options.success;
    var error = options.error;

    options.success = function(resp){
      if(success) success(model, resp, options);
      model.trigger('sync', model, resp);
      console.log('sync cover save on ' + model.get('_id'))
    }

    options.error = function(resp){
      if(error) error(model, resp, options);
      model.trigger('error', model, resp);
    }

    options.attrs = {'cover': _.pluck(list, 'id')};
    Backbone.sync('update', this, options);
  }

});


/* ------------------------------------------------------------------- */
// Category
/* ------------------------------------------------------------------- */

App.Model['Vertex.Category'] = App.Model['Vertex'].extend({
  urlRoot: "api/v1/category/",
  _cls: "Vertex.Category"
});

/* ------------------------------------------------------------------- */
// Work
/* ------------------------------------------------------------------- */

App.Model['Vertex.Work'] = App.Model['Vertex'].extend({
  urlRoot: "api/v1/work/",
  _cls: "Vertex.Work"
});

/* ------------------------------------------------------------------- */
// Tag
/* ------------------------------------------------------------------- */

App.Model['Vertex.Tag'] = Backbone.Model.extend({
  urlRoot: "api/v1/tag/",
  _cls: "Vertex.Tag"
});

/* ------------------------------------------------------------------- */
// Medium - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

App.Model['Vertex.Medium'] = App.Model['Vertex'].extend({
  _cls: "Vertex.Medium",

  initialize: function(){
    this.formUrl = null;
    this.set({'_cls': this._cls});
    this.fetched = false;
    this.deep = false;
  }
});

/* ------------------------------------------------------------------- */
// Photo
/* ------------------------------------------------------------------- */


App.Model['Vertex.Medium.Photo'] = App.Model['Vertex.Medium'].extend({
  urlRoot: "api/v1/photo/",
  _cls: "Vertex.Medium.Photo"
});

/* ------------------------------------------------------------------- */
// Body
/* ------------------------------------------------------------------- */

App.Model['Vertex.Apex.Body'] = App.Model['Vertex'].extend({
  urlRoot: "api/v1/apex/body/",
  _cls: "Vertex.Apex.Body",

  url: function(){
    return this.urlRoot;
  }

});

/* ------------------------------------------------------------------- */
// Happening
/* ------------------------------------------------------------------- */

App.Model['Vertex.Apex.Happening'] = App.Model['Vertex'].extend({
  urlRoot: "api/v1/apex/happening",
  _cls: "Vertex.Apex.Happening",

  url: function(){
    return this.urlRoot;
  }

});

App.Model['Vertex.Happening'] = App.Model['Vertex'].extend({
  urlRoot: "api/v1/happening",
  _cls: "Vertex.Happening"
});
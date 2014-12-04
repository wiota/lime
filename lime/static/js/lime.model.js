/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Models
/* ------------------------------------------------------------------- */

LIME.Model = {};

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

LIME.Model['Vertex']= Backbone.Model.extend({
  referencedFields: ['succset', 'predset'],
  apiVers: 'api/v1/',
  defaults: {
    "title":  ""
  },

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

  urlRoot: function(){
    return this.apiVers + this.vertexType + '/';
  },

  urlSuccset: function(){
    return this.url() + 'succset/';
  },

  cssClass: function(){
    return 'vertex ' + this.vertexType
  },

  triggerEvents: function(model, options){
    this.modified = true;
    var attr = model.changedAttributes()
    var summary_attr = _.omit(attr, 'succset');

    if(!_.isEmpty(summary_attr)){
      // put changed attributes into array
      this.trigger('summaryChanged', {'attr':summary_attr});
    }
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
      return response.result;
    }

  },

  deepen: function(){
    this.fetch({
      success: this.deepenSuccess,
      error: this.deepenError
    });
    return this;
  },

  deepenSuccess: function(model, response, options){
    var collection = LIME.collection[model.get('_cls')];

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
      var collection = LIME.collection[object._cls];
      var modelFactory = LIME.Model[object._cls];
      var model = collection.get(object['_id']) || new modelFactory(object, {'fetched': true, 'deep': false});

      collection.add(model); // if model already exists in collection, this request is ignored
      succsetReferences.push(model);
    });
    return succsetReferences;
  },

  outOfSync: function(){
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
      // console.log('sync succset save on ' + model.get('_id'))
    }

    options.error = function(resp){
      if(error) error(model, resp, options);
      model.trigger('error', model, resp);
    }

    options.url = 'api/v1/edge/';
    options.data = JSON.stringify({'edges': [this.get('_id'),successor.get('_id')]});
    // console.log(options.data);
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
      // console.log('sync succset save on ' + model.get('_id'))
    }

    options.error = function(resp){
      if(error) error(model, resp, options);
      model.trigger('error', model, resp);
    }

    options.url = 'api/v1/edge/';
    options.data = JSON.stringify({'edges': [this.get('_id'),successor.get('_id')]});
    // console.log(options.data);
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
      //console.log('sync succset save on ' + model.get('_id'))
    }

    options.error = function(resp){
      if(error) error(model, resp, options);
      model.trigger('error', model, resp);
    }

    options.url = _.result(this, 'urlSuccset');
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

  setCover: function(coverObj, options){
    this.set({'cover':coverObj});
    this.saveAttributes(options);
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

LIME.Model['Vertex.Category'] = LIME.Model['Vertex'].extend({
  vertexType: 'category',
  _cls: "Vertex.Category",
  photoNesting: ['Vertex.Work']
});

/* ------------------------------------------------------------------- */
// Work
/* ------------------------------------------------------------------- */

LIME.Model['Vertex.Work'] = LIME.Model['Vertex'].extend({
  vertexType: 'work',
  _cls: "Vertex.Work",
  photoNesting: []
});

/* ------------------------------------------------------------------- */
// Tag
/* ------------------------------------------------------------------- */

LIME.Model['Vertex.Tag'] = Backbone.Model.extend({
  vertexType: 'tag',
  _cls: "Vertex.Tag",
  photoNesting: ['Vertex.Work']
});

/* ------------------------------------------------------------------- */
// Medium - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

LIME.Model['Vertex.Medium'] = LIME.Model['Vertex'].extend({
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


LIME.Model['Vertex.Medium.Photo'] = LIME.Model['Vertex.Medium'].extend({
  vertexType: 'photo',
  urlRoot: "api/v1/photo/",
  _cls: "Vertex.Medium.Photo"
});

/* ------------------------------------------------------------------- */
// Body
/* ------------------------------------------------------------------- */

LIME.Model['Vertex.Apex.Body'] = LIME.Model['Vertex'].extend({
  vertexType: 'body',
  _cls: "Vertex.Apex.Body",
  photoNesting: ['Vertex.Work'],
  defaults: {
    "title":  "body of work"
  },
  url: function(){
    return this.apiVers + 'apex/body/';
  },
  urlSuccset: function(){
    return Backbone.Model.prototype.url.call(this) + 'succset/';
  }

});

/* ------------------------------------------------------------------- */
// Happenings Apex
/* ------------------------------------------------------------------- */

LIME.Model['Vertex.Apex.Happenings'] = LIME.Model['Vertex'].extend({
  vertexType: 'happenings',
  urlRoot: "api/v1/apex/happenings/",
  _cls: "Vertex.Apex.Happenings",
  photoNesting: ['Vertex.Event'],
  url: function(){
    return this.apiVers + 'apex/happenings/';
  },
  urlSuccset: function(){
    return Backbone.Model.prototype.url.call(this) + 'succset/';
  }

});

/* ------------------------------------------------------------------- */
// Happening
/* ------------------------------------------------------------------- */

LIME.Model['Vertex.Apex.Happening'] = LIME.Model['Vertex'].extend({
  vertexType: 'happening',
  _cls: "Vertex.Apex.Happening",
  url: function(){
    return this.urlRoot;
  }

});

LIME.Model['Vertex.Happening'] = LIME.Model['Vertex'].extend({
  urlRoot: "api/v1/happening",
  _cls: "Vertex.Happening"
});
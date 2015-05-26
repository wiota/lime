/* ------------------------------------------------------------------- */
// Portphillio Admin Backbone Models
/* ------------------------------------------------------------------- */

LIME.Model = {};

/* ------------------------------------------------------------------- */
// App Model Overrides
/* ------------------------------------------------------------------- */

LIME.Model.Base = Backbone.Model.extend({
  idAttribute: "_id",

  parse: function(response){
    if(response.result){
      return response.result;
    } else {
      return {};
    }
  },

  url: function() {
    var origUrl = Backbone.Model.prototype.url.call(this);
    return origUrl + (origUrl.charAt(origUrl.length - 1) == '/' ? '' : '/');
  },

  reference: function(object){
    var model = LIME.collection.Vertex.get(object['_id']) || new LIME.Model.Vertex(object, {'fetched': true, 'deep': false});
    LIME.collection.Vertex.add(model); // if model already exists in collection, this method call is ignored
    return model;
  },

  referenceSet: function(set){
    var setOfReferences = [];
    setOfReferences = _.map(set, this.reference);
    return setOfReferences;
  },

})

/* ------------------------------------------------------------------- */
// Vertex - Abstract class - to be transitioned to singular customVertex
/* ------------------------------------------------------------------- */

LIME.Model.Vertex= LIME.Model.Base.extend({
  referencedFields: ['succset', 'predset'],
  apiVers: 'api/v1/',
  vertexType: 'vertex',
  defaults: {
    "title":  ""
  },

  initialize: function(attributes, options){
    attributes = attributes || {};
    options = options || {};


    // Modified should eventually be implemented at the field level
    this.modified = options.modified || false; // modified flag is used to determine state of save view
    this.fetched = options.fetched || false;  // fetched and
    this.deep = options.deep || false;       // deep are used in dereferencing

    this.vertexType = attributes.vertex_type; // vertexType is a constant here
    this.typeCheck(); // will produce warning if type is not set

    // May not need this if defaults work as expected
    if(this.isNew()){
      this.set({'title': this.get('title') || 'untitled'})
    }

    this.succset = [];
    this.predset = [];
    this.on('change', this.triggerEvents);
  },

  typeCheck: function(){
    if(!this.vertexType && (this.isFetched() || this.isNew())){
      console.warn('Vertex ' + this.id + ' has no type: '+ this.vertexType);
      return false;
    } else {
      return true;
    }
  },

  urlRoot: function(){
    return this.apiVers + this.vertexType + '/';
  },

  urlSuccset: function(){
    return this.url() + 'succset/';
  },

  // This can be updated now that referenced fields are not in the attribute set
  triggerEvents: function(model, options){
    this.modified = true;
    var attr = model.changedAttributes()
    var summary_attr = _.omit(attr, 'succset');
    //console.log('change triggered ' + _.reduce(summary_attr, function(a, b){return a + " " + b}, ''));
    if(!_.isEmpty(summary_attr)){
      this.trigger('summaryChanged', {'attr':summary_attr});
    }
  },

  isFetched: function(){
    return this.fetched;
  },

  isDeep: function(){
    return this.deep;
  },

  parse: function(response){
    result = LIME.Model.Base.prototype.parse(response);

    // pluck referenced fields out of attributes
    _.each(this.referencedFields, function(field){
      this[field] = this.referenceSet(result[field]);
      delete result[field];
    }, this);
    this.vertexType = result.vertex_type || null;
    this.typeCheck()
    return result;
  },

  deepen: function(){
    this.fetch({
      success: this.deepenSuccess,
      error: this.deepenError
    });
    return this;
  },

  deepenSuccess: function(model, response, options){
    var collection = LIME.collection.Vertex;
    collection.add(model);

    model.fetched = true;
    model.deep = true;
    model.modified = false;
    //model.triggerEvents(model);
  },

  deepenError: function(model, response, options){
    console.log("Fetch unsucessful " + response);
  },

  awaitingUpload: function(){

    // This can be improved by chaining
    var awaiting = _.map(
      _.pick(this.attributes, function(val, key){
        return this.attributeAwaitingUpload(key);
      }, this),
      function(val, key){return [key, val]},
      this
    );

    if (_.isEmpty(awaiting)){
      return false
    } else {
      return awaiting;
    }
  },

  attributeAwaitingUpload: function(key) {
    return (this.attributes[key] instanceof window.File);
  },

  /* ------------------------------------------------------------------- */
  // Attribute Functions
  /* ------------------------------------------------------------------- */

  // wraps the default Backbone save with some extras
  // if attributes with uploads awaiting are passed, they will fail.
  save: function(attr, options){

    // Attribute handling is limited here:
    // Backbone provides the ability to pass a block of attributes. Right now,
    // this save function overrides the passed attributes and forces a complete
    // representation to be sent because the server does not yet support PATCH
    // requests.

    // Once the server supports PATCH requests, this function may take the place
    // of the saveAttributes method.

    // Succset and predset will not be included in serialized attributes

    var model = this;
    var awaiting = null;

    // If attributes are awaiting uploading, the save request is deferred until the uploading is complete
    if(awaiting = this.awaitingUpload()){ // Multiple fields possible
      async.reject(awaiting, _.bind(this.uploadToAttribute, this), function(rejected){
        // callback will execute after attribute has been set with href
        if(rejected.length>0){console.warn(rejected.length +' uploads failed')}
        model.save.call(model, {}, options); // If there are still unsuccessful uploads awaiting will continue
      })
      return false; // must return false, otherwise the File object will be serialized and sent
    }

    var model = this;

    model.modified = false;
    model.saving = true;
    options = options || {};

    var success = options.success;
    var error = options.error;

    options.success = function(resp){
      if(success) success(model, resp, options);
      this.modified = false;
      model.saving = false;
    }

    options.error = function(resp){
      if(error) error(model, resp, options);
      model.modified = true;
      model.saving = false;
    }

    // not currently possible to save individual attributes
    Backbone.Model.prototype.save.call(this, attr, options);
  },

  // wraps Backbone sync function, automatically omitting referenced fields
  saveAttributes: function(options){
    var attrs = _.omit(this.attributes, this.referencedFields);
    var model = this;

    model.modified = false;
    model.saving = true;
    options = options || {};

    var success = options.success;
    var error = options.error;

    options.success = function(resp){
      if(success) success(model, resp, options);
      model.modified = false;
      model.saving = false;
      model.trigger('sync', model, resp);
    }

    options.error = function(resp){
      if(error) error(model, resp, options);
      model.modified = true;
      model.saving = false;
      model.trigger('error', model, resp);
    }

    options.attrs = attrs;
    Backbone.sync('update', this, options);
  },

  uploadToAttribute: function(attrFilePair, callback){
    var asyncCallback = callback;
    var obj = {};

    console.log(attrFilePair);

    var callback = _.bind(function(err, result){
      if(err){
        asyncCallback(false);
      } else {
        obj[attrFilePair[0]] = "/image/" + result;
        this.set(obj);
        asyncCallback(true);
      }
    }, this)

    this.uploadFile(attrFilePair[1], callback)
  },

  uploadFile: function(file, callback){
    // testing
    // if(Math.random()<.5){
    //   request.trigger('error');
    //   return false;
    // }

    // timestamp
    var arr = file.name.split('.');
    var ext = arr.pop();
    var name = arr.join('.') + '_' + Date.now() + '.' + ext;

    // S3 uploader
    var uploader = new LIME.Uploader();
    uploader.on('complete', function(href){
      callback(null, name);
    });
    uploader.on('uploadError', function(){
      callback("error", file);
    });
    uploader.uploadFile(file, {"name": name});
  },

  /* ------------------------------------------------------------------- */
  // Succset Functions - successorAdd, successorRemove, predecessorAdd, predecessorRemove
  /* ------------------------------------------------------------------- */

  // Local modification - initiates server request
  addEdgeTo: function(successor, options){

    var succset = this.succset;
    var predset = successor.predset;

    succset.unshift(successor);
    predset.unshift(this);

    this.trigger('successorAdd', successor);
    successor.trigger('predecessorAdd', this);

    this._createEdge(successor, options);
  },

  // Local modification - initiates server request
  removeEdgeTo: function(successor, options){

    var succset = this.succset;
    var predset = successor.predset;

    this.succset = _.without(succset, successor);
    successor.predset = _.without(predset, this);

    this.trigger('successorRemove', successor);
    successor.trigger('predecessorRemove', this);

    this._destroyEdge(successor, options);
  },

  // Server request
  _destroyEdge: function(successor, options){
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
      // patch up locally
    }

    options.url = 'api/v1/edge/';
    options.data = JSON.stringify({'edges': [this.get('_id'),successor.get('_id')]});
    options.contentType = 'application/json';
    Backbone.sync('delete', this, options);
  },

  // Server request
  _createEdge: function(successor, options){
    var model = this;
    options = options || {};

    console.log(this);
    console.log(successor);

    // ensure initial id
    if(this.isNew()){
      this.once('sync', function(){
        model._createEdge.apply(model, arguments)
      })
      return false;
    }

    // ensure terminal id
    if(successor.isNew()){
      successor.once('sync', function(){
        model._createEdge.apply(model, arguments)
      })
      return false;
    }

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
      // patch up locally
    }


    options.url = 'api/v1/edge/';
    options.data = JSON.stringify({'edges': [this.get('_id'),successor.get('_id')]});
    options.contentType = 'application/json';
    Backbone.sync('create', this, options);
  },

  // Server request for reordering
  saveSuccset: function(options){
    var model = this;
    var idList = _.pluck(this.succset, 'id');

    options = options || {};

    var success = options.success;
    var error = options.error;

    options.success = function(resp){
      if(success) success(model, resp, options);
      // not sure where this is used
      model.trigger('sync', model, resp);
      // new event
      model.trigger('successorSync', model, resp);
    }

    options.error = function(resp){
      if(error) error(model, resp, options);
      // not sure where this is used
      model.trigger('error', model, resp);
      // new event
      model.trigger('successorError', model, resp);
    }

    options.url = _.result(this, 'urlSuccset');
    options.attrs = {'succset': idList};

    Backbone.sync('update', this, options);
  },

  // Local modification - initiates server request
  setSuccset: function(idList){
    var undefined;
    // inefficient algorithm
    var update = _.map(idList, function(id, index, list){
      var obj = _.findWhere(this.succset, {'id': id});
      return obj;
    }, this);

    this.succset = update;

    // Prevent null saves
    if(_.indexOf(this.succset, undefined)<0){
      this.saveSuccset();
    } else {
      console.warn('Succsessor set contains null values.');
    }
  },

  /* ------------------------------------------------------------------- */
  // Cover Functions
  /* ------------------------------------------------------------------- */

  setCover: function(coverObj, options){
    this.set({'cover':coverObj});
    this.saveAttributes(options);
  }

});

/* ------------------------------------------------------------------- */
// Host
/* ------------------------------------------------------------------- */

LIME.Model.Host = LIME.Model.Base.extend({
  referencedFields: ['apex'],
  apiVers: 'api/v1/',
  defaults: {},
  // staticly defined translation between server vertex blueprint and front-end
  typeDict: {
    StringField: "text",
    LongStringField: "textarea",
    DateTimeField: "datetime-local",
    URLField: "text"
  },

  initialize: function(attributes, options){
    // Creating vertexSchema properties is a hack to ensure
    // they appear at the top of the list in the interface.
    this.vertexSchema = {};
  },

  url: function(){
    return this.apiVers + 'host/';
  },

  fetchError: function(){

  },

  parse: function(response){
    // handle result object wrapper
    result = LIME.Model.Base.prototype.parse(response);

    // make apex id available
    result.apex = result.apex._id;

    // iterate through vertex schema and add to vertexSchema property of host
    // misnomer custom_vertex_fields -> vertex schema
    _.each(result.custom_vertex_fields, _.bind(this.parseSingleVertexType, this))

    // delete custom vertex types from response and return the rest
    delete result.custom_vertex_fields;
    return result;
  },

  parseSingleVertexType: function(fields, vertexType){
    var vertexFieldSchema = this.vertexSchema[vertexType] = [];

      // add fields to vertexFieldSchema
    _.each(fields, function(field, fieldorder){
      vertexFieldSchema[fieldorder] = {
        'type': this.typeDict[field['field_type']],
        'required': field['required'],
        'label': field['verbose_name'],
        'name': field['name'],
        'order': fieldorder
      }
    }, this);

    return vertexFieldSchema;
  },

  isSchemaAvailable: function(){
    if(!this.vertexSchema){
      return false;
    } else {
      return true;
    }
  },

  lookupForm: function(func){
    console.log("looking up "+vertexType);

    if(this.isSchemaAvailable(vertexType)){
      func(this.vertexSchema[vertexType]);
    } else {
      this.fetchFieldSchema(vertexType, func);
    }
  },

})

/* ------------------------------------------------------------------- */
// Standard Types
//
// These types should remain standard
/* ------------------------------------------------------------------- */

/* ------------------------------------------------------------------- */
// Medium - Should replace Medium and Photo
/* ------------------------------------------------------------------- */

LIME.Model.Medium = LIME.Model.Vertex.extend({

  initialize: function(attributes, options){
    LIME.Model.Vertex.prototype.initialize.apply(this, arguments);
    this.fileRef = options.fileRef || null;
    this.accepted = true; // if file is rejected during upload an object with false will be returned instead

  },



})

/* ------------------------------------------------------------------- */
// Medium - Abstract class - do not instantiate!
/* ------------------------------------------------------------------- */

/*
LIME.Model['Vertex.Medium'] = LIME.Model.Vertex.extend({
  _cls: "Vertex.Medium",

  initialize: function(){
    this.formUrl = null;
    this.set({'_cls': this._cls});
    this.fetched = false;
    this.deep = false;
  }
});
*/

/* ------------------------------------------------------------------- */
// Photo
/* ------------------------------------------------------------------- */

/*
LIME.Model['Vertex.Medium.Photo'] = LIME.Model['Vertex.Medium'].extend({
  vertexType: 'photo',
  urlRoot: "api/v1/photo/",
  _cls: "Vertex.Medium.Photo"
});
*/

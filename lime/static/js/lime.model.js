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

  setReference: function(set){
    var setReferences = [];
    setReferences = _.map(set, this.reference);
    return setReferences;
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

    if(this.isNew()){
      this.set({'title': this.get('title') || 'untitled'})
    }

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

    _.each(this.referencedFields, function(field){
      result[field] = this.setReference(result[field]);
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

  /* ------------------------------------------------------------------- */
  // Attribute Functions
  /* ------------------------------------------------------------------- */

  // wraps the default Backbone save with some extras
  save: function(attr, options){
    console.log('Save decorator called');
    if(this.fileRef){
      console.log('File Ref awaiting upload');
      // Do async stuff here
      return false;
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
    // for testing
    // setTimeout(options.error, 500)
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
      // patch up locally
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
      // patch up locally
    }

    options.url = 'api/v1/edge/';
    options.data = JSON.stringify({'edges': [this.get('_id'),successor.get('_id')]});
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

LIME.Model['Vertex.Medium'] = LIME.Model.Vertex.extend({
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

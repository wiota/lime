/* ------------------------------------------------------------------- */
// CORS S3 Uploader
/* ------------------------------------------------------------------- */

LIME.Uploader = function(){
  this.initialize.apply(this, arguments);
};

LIME.Uploader.prototype.s3_sign_put_url = 'upload/sign_s3/';

LIME.Uploader.prototype.onFinishS3Put = function(public_url, file) {
  this.trigger('complete', public_url);
  //return console.log('base.onFinishS3Put()', public_url, file);
};

LIME.Uploader.prototype.onProgress = function(percent, status, public_url, file) {
  this.percent = percent;
  this.trigger('progress', this.percent);
};

LIME.Uploader.prototype.onError = function(status, file) {
  this.trigger('uploadError');
  console.log('base.onError()', status, file);
};

LIME.Uploader.prototype.initialize = function(options){
  // initialized with only one file
  if (options == null) {
    options = {};
  }
  _.extend(this, options);
  _.extend(this, Backbone.Events);
  this.percent = 0;
};

LIME.Uploader.prototype.uploadFile = function(file, opts) {
  this.file = file;
  var opts = opts || {}
  this.trigger('progress', 0);
  var error, this_s3upload;
  error = this.validate(this.file);
  if (error) {
    this.onError(error, this.file);
    return null;
  }

  // The meat of the uploader
  this_s3upload = this;
  return this.executeOnSignedUrl(this.file, function(signedURL, publicURL) {
    return this_s3upload.uploadToS3(this_s3upload.file, signedURL, publicURL);
  }, opts);

};

LIME.Uploader.prototype.abort = function() {
  if(this.signXhr){
    this.signXhr.abort();
  }
  if(this.uploadXhr){
    this.uploadXhr.abort();
  }
};

// taken from s3 uploader
LIME.Uploader.prototype.createCORSRequest = function(method, url) {
  var xhr = this.uploadXhr = new XMLHttpRequest();
  if (xhr.withCredentials != null) {
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest !== "undefined") {
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    xhr = null;
  }
  return xhr;
};

LIME.Uploader.prototype.executeOnSignedUrl = function(file, callback, opts) {
  var name, this_s3upload, type;
  this_s3upload = this;
  var xhr = this.signXhr = new XMLHttpRequest();
  type = opts && opts.type || file.type;
  name = opts && opts.name || file.name;
  xhr.open('GET', this.s3_sign_put_url + '?s3_object_type=' + type + '&s3_object_name=' + encodeURIComponent(name), true);
  xhr.onreadystatechange = function(e) {
    var result;
    if (this.readyState === 4 && this.status === 200) {
      try {
        result = JSON.parse(this.responseText);
      } catch (error) {
        this_s3upload.onError('Signing error: "' + this.responseText + '"');
        return false;
      }
      return callback(result.signed_request, result.url);
    } else if (this.readyState === 4 && this.status !== 200) {
      return this_s3upload.onError('Could not contact request signing server. Status = ' + this.status);
    }
  };
  return xhr.send();
};

LIME.Uploader.prototype.uploadToS3 = function(file, url, public_url, opts) {
  var this_s3upload, type, xhr;
  this_s3upload = this;
  type = opts && opts.type || file.type;
  xhr = this.createCORSRequest('PUT', url);
  if (!xhr) {
    this.onError('CORS not supported');
  } else {
    xhr.onload = function() {
      if (xhr.status === 200) {
        this_s3upload.onProgress(100, 'Upload completed.', public_url, file);
        return this_s3upload.onFinishS3Put(public_url, file);
      } else {
        return this_s3upload.onError('Upload error: ' + xhr.status, file);
      }
    };
    xhr.onerror = function() {
      return this_s3upload.onError('XHR error.', file);
    };
    xhr.upload.onprogress = function(e) {
      var percentLoaded;
      if (e.lengthComputable) {
        percentLoaded = Math.round((e.loaded / e.total) * 100);
        return this_s3upload.onProgress(percentLoaded, (percentLoaded === 100 ? 'Finalizing.' : 'Uploading.'), public_url, file);
      }
    };
  }
  xhr.setRequestHeader('Content-Type', type);
  xhr.setRequestHeader('x-amz-acl', 'public-read');
  return xhr.send(file);
};

LIME.Uploader.prototype.validate = function(file) {
  return null;
};

LIME.Uploader.prototype.tester = function(){

  this.trigger('progress', this.percent);
  this.percent += Math.random([0,10]);

  if(this.percent >= 100){
    clearInterval(this.testInverval);
    this.trigger('complete', 'www.image.com/397438');
  }
};

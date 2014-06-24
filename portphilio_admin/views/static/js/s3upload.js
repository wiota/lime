App.Uploader = function(){
  this.initialize.apply(this, arguments);
}

App.Uploader.prototype.s3_sign_put_url = 'upload/sign_s3/';

App.Uploader.prototype.onFinishS3Put = function(public_url, file) {
  this.trigger('complete', public_url);
  //return console.log('base.onFinishS3Put()', public_url, file);
};

App.Uploader.prototype.onProgress = function(percent, status, public_url, file) {
  this.percent = percent;
  this.trigger('progress', this.percent);
};

App.Uploader.prototype.onError = function(status, file) {
  return console.log('base.onError()', status, file);
};

App.Uploader.prototype.initialize = function(file, options){
  // initialized with only one file
  if (options == null) {
    options = {};
  }
  _.extend(this, options);
  _.extend(this, Backbone.Events);
  this.file = file;
  this.percent = 0;
  this.trigger('progress', this.percent);
  this.uploadFile();
};

App.Uploader.prototype.uploadFile = function() {
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
  });

};

App.Uploader.prototype.createCORSRequest = function(method, url) {
  var xhr;
  xhr = new XMLHttpRequest();
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

App.Uploader.prototype.executeOnSignedUrl = function(file, callback, opts) {
  var name, this_s3upload, type, xhr;
  this_s3upload = this;
  xhr = new XMLHttpRequest();
  type = opts && opts.type || file.type;
  name = opts && opts.name || file.name;
  xhr.open('GET', this.s3_sign_put_url + '?s3_object_type=' + type + '&s3_object_name=' + encodeURIComponent(name), true);
  xhr.onreadystatechange = function(e) {
    var result;
    if (this.readyState === 4 && this.status === 200) {
      try {
        result = JSON.parse(this.responseText);
      } catch (error) {
        this_s3upload.onError('Signing server returned some ugly/empty JSON: "' + this.responseText + '"');
        return false;
      }
      return callback(result.signed_request, result.url);
    } else if (this.readyState === 4 && this.status !== 200) {
      return this_s3upload.onError('Could not contact request signing server. Status = ' + this.status);
    }
  };
  return xhr.send();
};

App.Uploader.prototype.uploadToS3 = function(file, url, public_url, opts) {
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

App.Uploader.prototype.validate = function(file) {
  return null;
};

App.Uploader.prototype.tester = function(){

  this.trigger('progress', this.percent);
  this.percent += Math.random([0,10]);

  if(this.percent >= 100){
    clearInterval(this.testInverval);
    this.trigger('complete', 'www.image.com/397438');
  }
};

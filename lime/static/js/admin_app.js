var App = {
};

App.titleCleaner = {};
App.titleCleaner.casePref = 'titlecase';
App.titleCleaner.spacePref = 'add';

App.titleCleaner.cases = {
  'lower':function(string){
    return string.toLowerCase();
  },
  'upper':function(string){
    return string.toUpperCase();
  },
  'firstword':function(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
  },
  'titlecase':function(string){
    return string.replace(/[^\s]+/g, function(word) {
      return word.replace(/^./, function(first) {
        return first.toUpperCase();
      });
    });
  },
  'default':function(string){
    return string;
  }
}

App.titleCleaner.spaces = {
  'add':function(string){
    return string.replace(/[-_.]/g, ' ');;
  },
  'default':function(string){
    return string;
  }
}

App.titlePref = function(string){
  return App.titleCleaner.cases[App.titleCleaner.casePref](
    App.titleCleaner.spaces[App.titleCleaner.spacePref](string)
  );
}

App.fileToName = function(string){
  var noEx = string.split('.');
  noEx.pop();
  return App.titlePref(noEx.join('.'));
}

App.clsToClass = function(_cls){
  return _cls.toLowerCase().split('.').join(' ');
}

console.log(App.titlePref('Ready-for-mixing'));
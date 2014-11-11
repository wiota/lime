var App = {
};

App.subnav = (function(){

  var toggleNav = function(el){
    $(el).next('.subnav').fadeToggle(100);
  }

  return function(selector){
    $(selector).on('click', function(){
      toggleNav(this);
    })
  }

})();

// ---------------------------------------------------------------------

App.god = (function(){
  var keyin = 0;
  var keycheck = [71,79,68,71,79,68,71,79,68];
  var god = false;

  var revealGodButton = function(){
    $('.lime_nav .god').fadeIn();
    revealGod();
  }

  var revealGod = function(){
    console.log('GOD');
    $('body').addClass('godman');
  }

  $(document).keyup(function(event){
    if(event.which == keycheck[keyin]){
      keyin++;
    } else {
      keyin = 0;
    }
    if(keyin >= keycheck.length){
      god = true;
      revealGodButton();
    }
  })

  return function(){return revealGod;}
})();

// ---------------------------------------------------------------------

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

// ---------------------------------------------------------------------

App.flash = function(){
  $('.admin_flashes').delay(500).fadeOut(1000, 'swing');
  $('.admin_flashes').on('click', function(){
    $(this).stop().slideUp(100);
  })
};

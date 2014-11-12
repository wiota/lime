var LIME = {
};

LIME.subnav = (function(){

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

LIME.god = (function(){
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

LIME.titleCleaner = {};
LIME.titleCleaner.casePref = 'titlecase';
LIME.titleCleaner.spacePref = 'add';

LIME.titleCleaner.cases = {
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

LIME.titleCleaner.spaces = {
  'add':function(string){
    return string.replace(/[-_.]/g, ' ');;
  },
  'default':function(string){
    return string;
  }
}

LIME.titlePref = function(string){
  return LIME.titleCleaner.cases[LIME.titleCleaner.casePref](
    LIME.titleCleaner.spaces[LIME.titleCleaner.spacePref](string)
  );
}

// Tools --------------------------------------------------------------

LIME.fileToName = function(string){
  var noEx = string.split('.');
  noEx.pop();
  return LIME.titlePref(noEx.join('.'));
}

// ---------------------------------------------------------------------

LIME.clsToRoute = function(_cls){
  // Bad function
  return _cls.toLowerCase().split('.').pop();
}

// ---------------------------------------------------------------------

LIME.clsToClass = function(_cls){
  // Bad function
  return _cls.toLowerCase().split('.').join(' ');
}

// ---------------------------------------------------------------------

LIME.flash = function(){
  $('.admin_flashes').delay(500).fadeOut(1000, 'swing');
  $('.admin_flashes').on('click', function(){
    $(this).stop().slideUp(100);
  })
};

// ---------------------------------------------------------------------
// LIME base
// ---------------------------------------------------------------------

var LIME = {
};

LIME.start = function(){

  // Where should this go?
  window.addEventListener('drop', function(e){
    e.preventDefault();
  })

  window.addEventListener('dragover', function(e){
    e.preventDefault();
  })

  LIME.router = new LIME.Router();
  LIME.host = new LIME.Model.Host({'vertex_type':'host'});

  LIME.host.fetch({
    success: function(){
      Backbone.history.start();
    }
  })

}

// ---------------------------------------------------------------------
// LIME clientside tools
// ---------------------------------------------------------------------

LIME.consoleTimer = (function(){
  //setInterval(function(){console.log('---------------')},500);
})();

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

LIME.imgfix = function(selector){
  var $el = $(selector);
  //console.log($el);
  //$el.fadeOut();
  $el.find('img').on('load', function(){
    $(this).fadeIn();
  });
  $el.find('img').on('error', function(){
    console.log('error');
  });


}

// ---------------------------------------------------------------------

LIME.god = (function(){
  var god_keyin = 0;
  var god_keycheck = [71,79,68,71,79,68,71,79,68];
  var man_keyin = 0;
  var man_keycheck = [77,65,78,77,65,78,77,65,78];
  var god = false;

  var revealGodButton = function(){
    $('.lime_nav .god').fadeIn();
    revealGod();
  }

  var revealGod = function(){
    console.log('GOD');
    $('body').addClass('godman');
  }

  var ephemeralManButton = function(){
    $('.lime_nav .god').fadeOut();
    ephemeralMan();
  }

  var ephemeralMan = function(){
    console.log('MAN');
    $('body').removeClass('godman');
  }

  $(document).keyup(function(event){
    // god
    //console.log(event.which);
    if(event.which == god_keycheck[god_keyin]){
      god_keyin++;
    } else {
      god_keyin = 0;
    }
    if(god_keyin >= god_keycheck.length){
      god = true;
      revealGodButton();
    }
    // man
    if(event.which == man_keycheck[man_keyin]){
      man_keyin++;
    } else {
      man_keyin = 0;
    }
    if(man_keyin >= man_keycheck.length){
      man = true;
      ephemeralManButton();
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
    return string.replace(/[-_.]/g, ' ');
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

LIME.flash = function(){
  $('.admin_flashes').delay(500).fadeOut(1000, 'swing');
  $('.admin_flashes').on('click', function(){
    $(this).stop().slideUp(100);
  })
};

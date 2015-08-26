// ---------------------------------------------------------------------
// LIME namespace
// ---------------------------------------------------------------------

var LIME = {};

LIME.start = function(){

  // Where should this go?
  window.addEventListener('drop', function(e){
    e.preventDefault();
  })

  window.addEventListener('dragover', function(e){
    e.preventDefault();
  })

  LIME.router = new LIME.Router();
  LIME.host = new LIME.Model.Host({});

  LIME.host.fetch({
    success: function(){
      Backbone.history.start();
    }
  })

}

// ---------------------------------------------------------------------
// LIME clientside tools
// ---------------------------------------------------------------------

// State Machine --------------------------------------------------------------

LIME.StateMachine = (function(){
  // Application State Machine
  // By dicipline, this state is immutable.
  // Do not mutate the state. Calling setState will return
  // a new object, only cloning the property that changes
  // and its ancestors up the tree to the root object

  var machine = function(){
    if ( !(this instanceof machine) ) { return false }
    this.state = {};
    this.cursors = {};
  }

  _.extend(machine.prototype, {
    set: function(path, val, options){
      var options = options || {};
      if(this._get(this.state, path) !== val){
        this.state = this._replace(this.state, path, val);
        if(!options.silent){ this._cursorFor(path)(val) }
      }
    },

    get: function(path){
      return this._get(this.state, path);
    },

    on: function(path, fn, context){
      this.cursors[path] = _.bind(fn, (context || null));
    },

    dump: function(){
      return this.state;
    },

    _cursorFor: function(path){
      return this.cursors[path] || _.noop;
    },

    _get: function(obj, path){
      var undefined, arr, child;
      if(obj === undefined || path.length < 1){ return false }
      arr = path.split('.');
      child = obj[arr[0]];
      if(arr.length === 1){
        return child;
      } else {
        return this._get(child, _.rest(arr).join('.'));
      }
    },

    _replace: function(obj, path, val){
      var undefined, arr, child, clone;
      if(path.length < 1){ return false }

      arr = path.split('.');
      if(obj === undefined){
        clone = {};
        child = {};
      } else {
        clone =  _.clone(obj);
        child = obj[arr[0]];
      }

      // if shallow
      if(arr.length === 1){
        clone[arr[0]] = val;
        return clone;
      // if deep, call recursively
      } else {
        clone[arr[0]] = this._replace(child, _.rest(arr).join('.'), val);
        return clone;
      }
    }
  });

  return machine;
})();


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

// ---------------------------------------------------------------------

LIME.subnav = (function(){

  var toggleNav = function(el){
    $(el).next('.subnav').toggleClass('open');
  }

  return function(selector){
    $(selector).on('click', function(){
      toggleNav(this);
    })
  }

})();

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
    console.warn('In vertex we trust');
    $('body').addClass('godman');
  }

  var ephemeralManButton = function(){
    $('.lime_nav .god').fadeOut();
    ephemeralMan();
  }

  var ephemeralMan = function(){
    $('body').removeClass('godman');
  }

  $(document).keyup(function(event){
    // god
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

// String Tools -------------------------------------------------------------

LIME.stringtools = {};
LIME.stringtools.casePref = 'titlecase';
LIME.stringtools.spacePref = 'add';

LIME.stringtools.cases = {
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

LIME.stringtools.spaces = {
  'add':function(string){
    return string.replace(/[-_.]/g, ' ');
  },
  'default':function(string){
    return string;
  }
}

LIME.titlePref = function(string){
  return LIME.stringtools.cases[LIME.stringtools.casePref](
    LIME.stringtools.spaces[LIME.stringtools.spacePref](string)
  );
}

LIME.fileSafe = function(string){
  return string.replace(/[^a-z0-9_\-.]/gi, '-');
}


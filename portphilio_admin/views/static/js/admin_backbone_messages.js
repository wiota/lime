var msg = (function(thisObj){
  var Messager = {
    on: true,
    thread: null,
    threads: {
      'lookup':{
        'on': true,
        'console': false,
        'label': 'Lookup',
        'messages' : []
      },
      'render':{
        'on': true,
        'console': false,
        'label': 'Render',
        'messages' : []
      },
      'model':{
        'on': true,
        'console': false,
        'label': 'Model',
        'messages' : []
      },
      'default':{
        'on': true,
        'console': false,
        'label': 'Default',
        'messages' : []
      }

    },

    init: function(){
      var body = $('body');

      if(Messager.on){
        var menu = Messager.menu = $('<div></div>')
          .css({
            'position':'fixed',
            'bottom':'0',
            'right': '0',
            'padding':'0',
            'width': '100%',
            'z-index': '1001'
          })
          .appendTo(body);

        var display = Messager.display = $('<div></div>')
          .addClass('msg_display')
          .css({
            'position':'fixed',
            'top':'60%',
            'left':'0',
            'bottom':'0',
            'right': '0',
            'z-index': '1000'
          })
          .appendTo(body)
          .hide();

        var displayList = Messager.displayList = $('<div></div>')
          .css({
            'padding':'1.5% 1.5% 3%'
          })
          .appendTo(display);

        var displayMenu = $('<div></div>')
          .css({
            'position':'fixed',
            'top': '60%',
            'right': '0',
            'width':'10%',
            'text-align':'center'
          })
          .appendTo(display);


        var close = $('<div class="close">X</div>')
          .css({
            'cursor':'pointer',
            'font-size':'50px',
            'padding':'30%',
            'margin':'20% 0'
          })
          .appendTo(displayMenu)
          .on('click', function(){
            display.fadeOut(100);
          })

        var clear = Messager.clear = $('<div class="clear">clear</div>')
          .css({
            'cursor':'pointer',
            'font-size':'10px',
            'padding':'5%',
            'margin':'20% 0'
          })
          .appendTo(displayMenu)
          .on('click', function(){
            Messager.thread.messages = []
            Messager.refreshDisplay();
          })

        _.each(Messager.threads, function(val, key){
          $('<a>'+val.label+'</a>')
            .css({
              'cursor':'pointer',
              'background-color':'#ccc',
              'display':'block',
              'float':'right',
              'padding':'.5%',
              'margin':'1.5% 1.5% 0 0'
            })
            .appendTo(menu)
            .on('click', function(){
              Messager.thread = val;
              display.show();
              Messager.refreshDisplay();
              Messager.clear.html('clear '+ val.label);
            });
        }, Messager)
      }
    },

    cleanErrStack: function(err){
      var e_split = err.stack.split("\n");
      e_split.shift();
      e_split.shift();
      e = e_split.join("<br />");
      //console.log(e);
      return e;
    },

    log: function(msg, t){
      if(Messager.on){
        var thread = Messager.threads[t] || Messager.threads['default'];
        if(thread.on){
          err = (new Error);
          var stack = Messager.cleanErrStack(err);
          var line = "<div class='msg'><a>" + msg + "</a>" + "<div class='stack'>" + stack + "</div></div>";
          thread.messages.push(line);
          if(Messager.thread === thread){
            Messager.addToDisplay(line);
          }
          if(thread.console){
            console.log(msg);
          }
        }
      }
    },

    addToDisplay: function(line){
      $(line)
        .on('click', function(){
          $(this).find('.stack').slideToggle();
        })
        .appendTo(Messager.displayList);
        Messager.display.scrollTop(Messager.display.height())
    },

    refreshDisplay: function(){
      Messager.displayList.html('');
      _.each(Messager.thread.messages, function(line){
        Messager.addToDisplay(line);
      });
    }

  }

  return Messager;

})(this)

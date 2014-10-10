function Iconset(){

  var Icon = this;
  var icons = [];

  // Colors --------------------------------------------------------------

  var colorset = this.colorset = ['#73a290','#111512','#200067','#7a6597','#ff4cb6','#0065fe','#ff2a9e','#0085c3','#ff7172','#3d2d3c','#0d2236','#e68300','#c0b299','#d8bb00','#6c0010','#ffa361','#c90037','#97ae90','#ff7158','#e8972a','#ff49b6','#d30031','#9d0035','#6f616e','#ff3fb0','#bb9856','#ff0768','#61abce','#d7b777','#d39ca4','#ff089c','#1f9d97','#ff2b23','#62b89d','#ff5b45','#d0d123','#003959','#16170e','#571bda','#756377','#7c4e64','#ff899c','#5350ff','#bcc5c3','#482700','#a7464e','#c8676f','#e2003d','#cbcac0','#61598d','#ff8367','#b8c5b3','#76beff','#009cfb','#eee01e','#82ae79','#babc9b','#55bfc1','#44786f','#191816','#1d9216','#b6ca88','#e55974','#9e9f96'];

  // Shapes --------------------------------------------------------------

  var shape = {};
  shape.rect = _.template('<rect x="<%= x %>" y="<%= y %>" fill="<%= fill %>" width="<%= w %>" height="<%= h %>"/>');

  // Icons --------------------------------------------------------------

  var iconlib = {}

  iconlib.bookcase = function(){
    var width = 16;
    var rows = [3,7,11,15];
    return _.reduce(rows, function(memo, row){
      var book = 0;
      rowshapes = '';
      while(book < width){
        variation = _.random(2, 3);
        h = variation;
        y = row-variation
        rowshapes += shape.rect({x:book, y:y, w:1, h:h, fill:_.sample(colorset)})
        book++;
      }

      return memo+rowshapes;
    }, '', this);
  };

  iconlib.book = function(){
    var c = _.sample(colorset);
    return '<polyline fill="none" stroke="'+c+'" points="14.5,2 14.5,15.5 2,15.5  "/><line fill="none" stroke="'+c+'" x1="1.5" y1="15" x2="1.5" y2="13"/><rect x="1" fill="'+c+'" width="11" height="13"/><line fill="none" stroke="'+c+'" stroke-miterlimit="10" x1="14" y1="1.5" x2="13" y2="1.5"/>';
  }

  iconlib.calendar = function(){
    var c = '#78F7D8';
    return '<rect y="1" fill="'+c+'" width="16" height="13"/><rect x="1" y="4" fill="#FFFFFF" width="1" height="1"/><rect x="3" y="4" fill="#FFFFFF" width="1" height="1"/><rect x="5" y="4" fill="#FFFFFF" width="1" height="1"/><rect x="7" y="4" fill="#FFFFFF" width="1" height="1"/><rect x="9" y="4" fill="#FFFFFF" width="1" height="1"/><rect x="11" y="4" fill="#FFFFFF" width="1" height="1"/><rect x="13" y="4" fill="#FFFFFF" width="1" height="1"/><rect x="1" y="6" fill="#FFFFFF" width="1" height="1"/><rect x="3" y="6" fill="#FFFFFF" width="1" height="1"/><rect x="5" y="6" fill="#FFFFFF" width="1" height="1"/><rect x="7" y="6" fill="#FFFFFF" width="1" height="1"/><rect x="9" y="6" fill="#FFFFFF" width="1" height="1"/><rect x="11" y="6" fill="#FFFFFF" width="1" height="1"/><rect x="13" y="6" fill="#FFFFFF" width="1" height="1"/><rect x="1" y="8" fill="#FFFFFF" width="1" height="1"/><rect x="3" y="8" fill="#FFFFFF" width="1" height="1"/><rect x="5" y="8" fill="#FFFFFF" width="1" height="1"/><rect x="7" y="8" fill="#FFFFFF" width="1" height="1"/><rect x="9" y="8" fill="#FFFFFF" width="1" height="1"/><rect x="11" y="8" fill="#FFFFFF" width="1" height="1"/><rect x="13" y="8" fill="#FFFFFF" width="1" height="1"/><rect x="1" y="10" fill="#FFFFFF" width="1" height="1"/><rect x="3" y="10" fill="#FFFFFF" width="1" height="1"/><rect x="5" y="10" fill="#FFFFFF" width="1" height="1"/><rect x="1" y="12" fill="#FFFFFF" width="1" height="1"/><rect x="3" y="12" fill="#FFFFFF" width="1" height="1"/><rect x="13" y="2" fill="#FFFFFF" width="1" height="1"/><rect x="7" y="10" fill="#FFFFFF" width="1" height="1"/><rect x="9" y="10" fill="#FFFFFF" width="1" height="1"/><rect x="11" y="10" fill="#FFFFFF" width="1" height="1"/><rect x="13" y="10" fill="#FFFFFF" width="1" height="1"/>'
  }

  iconlib.back = function(){
    //var c = _.sample(colorset);
    var c = '#0083C6';
    return '<polyline fill="none" stroke="'+c+'" points="6,3.5 2,7.5 6,11.5"/><line fill="none" stroke="'+c+'" x1="9" y1="8.5" x2="14" y2="8.5"/><line fill="none" stroke="'+c+'" x1="2" y1="7.5" x2="8" y2="7.5"/><rect x="0.5" y="1.5" fill="none" stroke="#FFFFFF" stroke-miterlimit="10" width="15" height="13"/><line fill="none" stroke="#FFFFFF" stroke-miterlimit="10" x1="8.5" y1="14.5" x2="8.5" y2="1.5"/>';
  }

  iconlib.back_over = function(){
    var c = '#0083C6';
    return '<polyline fill="none" stroke="#FFFFFF" stroke-miterlimit="10" points="15.5,2.5 15.5,15.5 6.5,15.5 "/><rect x="5.5" y="0.542" fill="#FFFFFF" stroke="#FFFFFF" stroke-miterlimit="10" width="8" height="13"/><line fill="none" stroke="#FFFFFF" stroke-miterlimit="10" x1="6.499" y1="14.479" x2="5.5" y2="14.479"/>'
  }

  iconlib.home = function(){
    //var c = _.sample(colorset);
    var c = '#aa2200';
    return '<rect x="0.5" y="1.5" fill="none" stroke="#000000" stroke-miterlimit="10" width="15" height="14"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="1" y1="3.25" x2="15" y2="3.25"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="1" y1="4.75" x2="15" y2="4.75"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="4.25" y1="2" x2="4.25" y2="3"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="7.75" y1="2" x2="7.75" y2="3"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="11.25" y1="2" x2="11.25" y2="3"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="14.75" y1="2" x2="14.75" y2="3"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="2.5" y1="3.5" x2="2.5" y2="4.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="6" y1="3.5" x2="6" y2="4.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="9.5" y1="3.5" x2="9.5" y2="4.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="13" y1="3.5" x2="13" y2="4.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="1" y1="6.25" x2="15" y2="6.25"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="1" y1="7.75" x2="15" y2="7.75"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="4.25" y1="5" x2="4.25" y2="6"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="7.75" y1="5" x2="7.75" y2="6"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="11.25" y1="5" x2="11.25" y2="6"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="14.75" y1="5" x2="14.75" y2="6"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="2.5" y1="6.5" x2="2.5" y2="7.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="6" y1="6.5" x2="6" y2="7.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="9.5" y1="6.5" x2="9.5" y2="7.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="13" y1="6.5" x2="13" y2="7.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="1" y1="9.25" x2="15" y2="9.25"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="1" y1="10.75" x2="15" y2="10.75"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="4.25" y1="8" x2="4.25" y2="9"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="7.75" y1="8" x2="7.75" y2="9"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="11.25" y1="8" x2="11.25" y2="9"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="14.75" y1="8" x2="14.75" y2="9"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="2.5" y1="9.5" x2="2.5" y2="10.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="6" y1="9.5" x2="6" y2="10.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="9.5" y1="9.5" x2="9.5" y2="10.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="13" y1="9.5" x2="13" y2="10.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="1" y1="12.25" x2="15" y2="12.25"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="1" y1="13.75" x2="15" y2="13.75"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="4.25" y1="11" x2="4.25" y2="12"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="7.75" y1="11" x2="7.75" y2="12"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="11.25" y1="11" x2="11.25" y2="12"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="14.75" y1="11" x2="14.75" y2="12"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="2.5" y1="12.5" x2="2.5" y2="13.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="6" y1="12.5" x2="6" y2="13.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="9.5" y1="12.5" x2="9.5" y2="13.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="13" y1="12.5" x2="13" y2="13.5"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="4.25" y1="14" x2="4.25" y2="15"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="7.75" y1="14" x2="7.75" y2="15"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="11.25" y1="14" x2="11.25" y2="15"/><line fill="none" stroke="#ffffff" stroke-width="0.5" stroke-miterlimit="10" x1="14.75" y1="14" x2="14.75" y2="15"/><polyline fill="'+c+'" stroke="'+c+'" stroke-miterlimit="10" points="9.5,15 9.5,9 6.5,9 6.5,15 "/>';
  }

  iconlib.god = function(){
    var c1 = _.sample(colorset);
    var c2 = Icon.invertColor(c1);
    return '<polyline fill="none" stroke="'+c1+'" points="0.5,1 0.5,15.5 15.5,15.5 15.5,1.5 2.5,1.5 2.5,13.5 13.5,13.5 13.5,3.5 4.5,3.5 4.5,11.5 11.5,11.5 11.5,5.5 6.5,5.5 6.5,9.5 9.5,9.5 9.5,7.5 8,7.5 "/><polyline fill="none" stroke="'+c2+'" points="1.5,1 1.5,14.5 14.5,14.5 14.5,2.5 3.5,2.5 3.5,12.5 12.5,12.5 12.5,4.5 5.5,4.5 5.5,10.5 10.5,10.5 10.5,6.5 7.5,6.5 7.5,8.5 9,8.5 "/>'
  }

  // Wrapper --------------------------------------------------------------

  var openTag = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 16 16">'
  var closeTag = '</svg>';


  this.add = function(icon, selector){
    icons.push({icon:icon, selector:selector});
  };

  this.refresh = function(){
    _.each(icons, function(icondict, index, list){
      $(icondict.selector).html(openTag + iconlib[icondict.icon]() + closeTag);
    }, this)
  };

  this.invertColor = function(color){
    var t1 = '0123456789abcdef#'
    var t2 = 'fedcba9876543210#'
    return color.replace( /./gi,
      function (s) {
        return t2.charAt(t1.indexOf(s));
      }
    )
  }

}
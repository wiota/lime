/* ------------------------------------------------------------------- */
// LIME Panels
/* ------------------------------------------------------------------- */

LIME.Panel = Backbone.View.Base.extend({
  className: 'panel',

  initialize: function(options){
    var options = options || {};
    // this.orientation = options.orientation || 'vertical';
    this.panels = options.panels || [];
    this.presets = {};
    this.presetUnits = {};
  },

  addPreset: function(index, locations, units){
    if(locations.length !== this.panels.length){
      return false;
    }
    this.presetUnits[index] = units || "px";
    this.presets[index] = locations;
  },

  clamp: function(l, n, h){
    if(n<l){
      return l;
    } else if (h && n>h){
      return h;
    } else {
      return n;
    }
  },

  shift: function(index){
    var units = this.presetUnits[index];
    var preset = this.presets[index];
    _.each(preset, function(val, key){
      if((next = preset[key+1]) !== undefined){
        css = {
          "top": 0,
          "bottom": 0,
          "left": (val) + units,
          // account for border
          "width": this.clamp(0, (next - val), null) + units,
        }
      } else {
        css = {
          "top": 0,
          "bottom": 0,
          "left": val+units,
          "right": 0
        }
      }
      $(this.panels[key]).css(css);
    }, this)
  }

})
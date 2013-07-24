define(["backbone", "underscore", "jquery"], function(Backbone, _, $) {
    var CProto = Backbone.Collection.prototype;
    return {
        add: function(models, options) {
            models = $.makeArray(models), models = _.forEach(models, function(m) {
                var r = this.get(m.id);
                r ? r.set(m) : CProto.add.call(this, m, options)
            }, this)
        }
    }
})
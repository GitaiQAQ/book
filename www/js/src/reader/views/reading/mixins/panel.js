define(["jquery", "underscore", "backbone"], function() {
    var mixinedMethods = {
        closePanel: function() {
            this.$el.trigger("close")
        }
    };
    return mixinedMethods
})
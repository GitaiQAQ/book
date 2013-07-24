 define(["jquery", "underscore", "backbone"], function($, _, Backbone) {
    var app = {};
    return app.vent = _.extend({}, Backbone.Events), app
})
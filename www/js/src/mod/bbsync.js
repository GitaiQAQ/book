 define(["underscore", "mod/ajax"], function(_, Ajax) {
    function sync(method, model, options) {
        var url = _.result(model, "url") || urlError(),
            data = "create" === method || "update" === method ? options.attrs || model.toJSON(options) : {};
        url = _.isFunction(url) ? model.url() : url, method = Ajax.methodMap[method];
        var xhr = options.xhr = Ajax.request(method, url, data, options, "json");
        return model.trigger("request", model, xhr, options), xhr
    }
    var urlError = function() {
        throw Error('A "url" property or function must be specified')
    };
    return sync
});
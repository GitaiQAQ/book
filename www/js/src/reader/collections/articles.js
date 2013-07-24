define(["backbone", "underscore", "reader/models/article", "reader/modules/collection_add_dup", "reader/modules/coll_fetch_one"], function(Backbone, _, Article, addDup, fetchOne) {
    var Articles = Backbone.Collection.extend({
        url: "/j/articles/",
        initialize: function(models, options) {
            options && options.urlSuffix && (this.url = this.url + options.urlSuffix)
        },
        fetch: function(options) {
            return options = options || {}, options.dataType = "json", Backbone.Collection.prototype.fetch.call(this, options)
        }
    });
    return _.extend(Articles.prototype, addDup, fetchOne), Articles
});
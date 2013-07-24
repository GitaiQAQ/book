 define(["backbone", "mod/ajax"], function(Backbone) {
    return Backbone.Model.extend({
        defaults: {
            name: "匿名用户"
        },
        url: function() {
            return "/j/user/" + this.get("id") + "/"
        },
        initialize: function() {
            this.on("sync", function() {
                this._loaded = !0
            }, this), this.on("request", function(model) {
                return model.get("id") ? void 0 : $.Deferred().reject()
            })
        },
        isLoaded: function() {
            return !!this._loaded && this.has("avatar")
        },
        isAdmin: function() {
            return !!this.get("isAdmin")
        },
        isAuthorOf: function(post) {
            var authorId = post.get("authorId");
            return authorId && "" + authorId == "" + this.get("id")
        },
        canRate: function(book) {
            return !(this.isAuthorOf(book) || book.get("isSample"))
        }
    })
});
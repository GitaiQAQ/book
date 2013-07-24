define(["backbone", "underscore", "mod/ajax"], function(Backbone) {
    var Rating = Backbone.Model.extend({
        defaults: {
            rating: 0,
            articleId: 0,
            rated: !1,
            comment: ""
        },
        initialize: function() {
            this.on("change", function() {
                this.save()
            }, this)
        },
        url: function() {
            var aid = this.get("articleId");
            return "/j/article_v2/" + aid + "/rating"
        },
        save: function(attrs, options) {
            options = options || {};
            var successCallback = options.success,
                ModelProto = Backbone.Model.prototype,
                self = this;
            options.success = function() {
                successCallback && successCallback.apply(this, arguments), self.trigger("saved")
            }, ModelProto.save.call(this, attrs, options)
        },
        validate: function(attrs) {
            var max = 350,
                rating = 0 | attrs.rating,
                comment = $.trim(attrs.comment);
            return rating ? comment.length > max ? "评语最多能写 " + max + " 个字" : void 0 : "请先为作品打分"
        }
    });
    return Rating
});
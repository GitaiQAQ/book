define(["backbone", "reader/app", "reader/models/rating", "mod/ajax"], function(Backbone, app, Rating, Ajax) {
    var Article = Backbone.Model.extend({
        defaults: {
            progress: 0,
            title: "",
            totalPages: 0,
            defaultSharingText: "",
            isSample: !1,
            isGift: !1,
            hasFormula: !1,
            purchaseTime: 0
        },
        progressEndpoint: "/j/article_v2/update_progress",
        updatePages: "/j/article_v2/update_pages",
        initialize: function() {
            this.bindEvents()
        },
        url: function() {
            return "/j/article_v2/" + this.id + "/"
        },
        bindEvents: function() {
            this.bind("change:progress", function() {
                var progress = this.get("progress");
                Ark.me.isAnonymous || isNaN(progress) || this.get("isSample") || app.model.config.get("isRecommendation") || Ajax.request("POST", this.progressEndpoint, {
                    aid: this.get("id"),
                    progress: progress
                })
            }), this.bind("change:totalPages", function() {
                Ajax.request("POST", this.updatePages, {
                    aid: this.get("id"),
                    pages: this.get("totalPages")
                })
            })
        },
        isLoaded: function() {
            return !!this.get("title")
        },
        getRating: function() {
            return this._rating ? this._rating : (this._rating = new Rating(this.get("myRating")), this._bindRatingChange(), this._rating)
        },
        _bindRatingChange: function() {
            this._rating.bind("change:rating", function() {
                this.trigger("change:rating")
            }, this)
        },
        archive: function() {
            var url = this.url() + "archive",
                self = this;
            return Ajax.request("POST", url).done(function() {
                self.set({
                    isArchived: !0
                })
            })
        }
    });
    return window.Article = Article, Article
});
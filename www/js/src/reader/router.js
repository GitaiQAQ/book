define(["backbone", "jquery", "reader/modules/ga"], function(Backbone, $, ga) {
    function initialize(app) {
        app.router = new AppRouter(app), Backbone.history.start({
            pushState: !0,
            root: READER_ROOT
        })
    }
    var READER_ROOT = "/reader/",
        ROOT_PREFIX = /^\/reader\//,
        AppRouter = Backbone.Router.extend({
            routes: {
                "": "home",
                "ebook/:ebookId/": "ebook",
                "ebook/:ebookId/page/:pageNumber/": "ebook",
                "ebook/:ebookId/recommendation/:rId/": "showRecommendation",
                "ebook/:ebookId/salon/": "redirectToReviewPage",
                "ebook/:ebookId/salon/reviews/": "redirectToReviewPage",
                "ebook/:ebookId/salon/reviews/:filterType/": "redirectToReviewPage",
                "ebook/:ebookId/salon/reviews/:filterType/page/:page/": "redirectToReviewPage",
                "ebook/:ebookId/review/:reviewId/": "redirectToReviewPage",
                "ebook/:ebookId/review/:reviewId/edit/": "redirectToReviewPage",
                "*actions": "redirectToHome"
            },
            initialize: function(app) {
                this.app = app;
                var thisRouter = this;
                $("body").on("click", "a[data-permalink]", function(e) {
                    e.preventDefault();
                    var url = this.getAttribute("href").replace(ROOT_PREFIX, "");
                    thisRouter.navigate(url, {
                        trigger: !0
                    })
                }).on("click", "a[data-in-app-go-back]", function(e) {
                    if (e.preventDefault(), app.atLandingView) {
                        var fallbackUrl = this.getAttribute("href");
                        thisRouter.navigate(fallbackUrl, !0)
                    } else history.go(-1)
                }), this.bindLandingHandler()
            },
            redirectToReviewPage: function(ebookId, reviewId) {
                location.href = +reviewId ? "/review/" + reviewId : "/ebook/" + ebookId + "/reviews"
            },
            bindLandingHandler: function() {
                function unsetLandingView(e) {
                    /^route:/.test(e) && (app.atLandingView = !1, this.off("all", unsetLandingView))
                }

                function setLandingView(e) {
                    /^route:/.test(e) && (this.off("all", setLandingView), this.on("all", unsetLandingView), app.atLandingView = !0)
                }
                var app = this.app;
                this.on("all", setLandingView), this.bind("all", this._trackPageview)
            },
            home: function() {
                var app = this.app;
                app.homeView.render().show(), app.readView.hide()
            },
            ebook: function(ebookId, pageNumber) {
                var app = this.app;
                if (pageNumber) {
                    var s = location.search,
                        url = ["ebook", ebookId, s ? s : ""].join("/");
                    app.navigate(url, {
                        replace: !0
                    })
                }
                app.homeView.hide(), app.readView.show().render(ebookId)
            },
            showRecommendation: function(ebookId, rId) {
                var app = this.app;
                if (!app.fitForDesktop) {
                    var url = ["ebook", ebookId, ""].join("/");
                    return this.navigate(url, {
                        trigger: !0,
                        replace: !0
                    })
                }
                app.homeView.hide(), app.readView.show().renderThenOpenAnnotation(ebookId, rId)
            },
            redirectToHome: function() {
                this.navigate("", {
                    trigger: !0,
                    replace: !0
                })
            },
            _trackPageview: function() {
                var url = Backbone.history.getFragment();
                ga._trackPageview(READER_ROOT + url)
            }
        });
    return {
        initialize: initialize
    }
});
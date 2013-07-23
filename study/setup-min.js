 define("backbone-src", ["jquery-src", "underscore-src"], function() {}),
  define("reader/models/user", ["backbone", "mod/ajax"], function(Backbone) {
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
}),
 define("reader/modules/open_login_and_signup", ["jquery", "underscore"], function($, _) {
    var createOpenDialogFunc = function(options) {
        var defaultOptions = {
            context: "reader",
            closable: !0
        };
        return function(InlineDialog) {
            document.cookie = "refer_url=" + location.href + ";domain=" + "douban.com" + ";path=" + "/", new InlineDialog(_.defaults(options || {}, defaultOptions))
        }
    }, openLoginAndSignup = function(options) {
            require("widget/login-and-signup", createOpenDialogFunc(options))
        };
    return openLoginAndSignup
}),
 define("reader/modules/storage_manager", ["jquery", "underscore"], function($, _) {
    var rArticleItem = /^e\d+/,
        MAX_NUM = 5,
        DEFAULT_READER_DATA_VERSION = "v1",
        storageManager = {
            freeUpStorageSpace: function() {
                for (var articles = this.getArticleKeys(), articleLength = articles.length; articleLength >= MAX_NUM;) articleLength -= 1, localStorage.removeItem(articles.pop())
            },
            checkStorageVersion: function() {
                var hasStorageData = this.hasStorageData();
                if (!hasStorageData) return this.saveReaderDataVersion(), !0;
                var version = this.getReaderDataVersion();
                return version !== Ark.READER_DATA_VERSION ? (this.resetReaderData(), !1) : !0
            },
            resetReaderData: function() {
                this.emptyArticles(), this.saveReaderDataVersion()
            },
            saveReaderDataVersion: function() {
                localStorage.readerDataVersion = Ark.READER_DATA_VERSION
            },
            hasStorageData: function() {
                var hasStorageData = localStorage.hasStorageData;
                return hasStorageData = !! hasStorageData || !! localStorage.layout, localStorage.hasStorageData = !0, hasStorageData
            },
            getReaderDataVersion: function() {
                return localStorage.readerDataVersion || DEFAULT_READER_DATA_VERSION
            },
            getArticle: function(articleId) {
                return localStorage["e" + articleId]
            },
            saveArticle: function(articleId, resp) {
                localStorage["e" + articleId] = resp.data + resp.time
            },
            emptyArticles: function() {
                var articles = this.getArticleKeys();
                _.each(articles, function(article) {
                    localStorage.removeItem(article)
                })
            },
            getArticleKeys: function() {
                var keys = _.keys(localStorage),
                    articles = _.filter(keys, function(key) {
                        return rArticleItem.test(key)
                    });
                return articles
            }
        };
    return storageManager
}),
 define("reader/modules/matchMedia", function() {
    var bool, doc = document,
        docElem = doc.documentElement,
        refNode = docElem.firstElementChild || docElem.firstChild,
        fakeBody = doc.createElement("body"),
        div = doc.createElement("div");
    div.id = "mq-test-1", div.style.cssText = "position:absolute;top:-100em", fakeBody.style.background = "none", fakeBody.appendChild(div);
    var matchMedia = window.matchMedia || function(q) {
            return div.innerHTML = '&shy;<style media="' + q + '">#mq-test-1{width:42px;}</style>', docElem.insertBefore(fakeBody, refNode), bool = 42 === div.offsetWidth, docElem.removeChild(fakeBody), {
                matches: bool,
                media: q
            }
        };
    return matchMedia
}),
 define("mod/detector", [], function() {
    var detector = {}, win = window,
        doc = document,
        venders = ["webkit", "moz"];
    return detector.hasTouch = function() {
        return !!("ontouchstart" in win || win.DocumentTouch && doc instanceof DocumentTouch)
    }, detector.canFullscreen = function() {
        for (var i = 0; venders.length > i; i++)
            if (doc[venders[i] + "CancelFullScreen"]) return !0;
        return !!document.cancelFullScreen || !1
    }, detector.standalone = function() {
        return win.navigator.standalone
    }, detector.hasOrientationEvent = function() {
        return !!("DeviceOrientationEvent" in win)
    }, detector
}),
 define("mod/bbsync", ["underscore", "mod/ajax"], function(_, Ajax) {
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
var _gaq = _gaq || [];
define("reader/modules/ga", function() {
    var ga = {};
    return ga._trackPageview = function(url) {
        url = url.replace(/page.*/, ""), _gaq.push(["_trackPageview", "/" + url])
    }, ga._trackEvent = function(action, label) {
        (label === void 0 || null === label) && (label = document.title), "number" == typeof label && (label = "" + label), _gaq.push(["_trackEvent", "reader", action, label])
    }, ga.getTradeInfo = function(context) {
        return context.isSample ? "sample" : context.isGift ? "gift" : context.book.get("price") ? "paid" : "free"
    }, ga
}),
 define("reader/router", ["backbone", "jquery", "reader/modules/ga"], function(Backbone, $, ga) {
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
}),
 define("reader/modules/coll_fetch_one", [], function() {
    return {
        fetchOne: function(id) {
            var model = this.get(id),
                dfd = new $.Deferred;
            return model || (model = new this.model({
                id: id
            }), this.add(model)), model.isLoaded() ? dfd.resolve(model) : model.fetch({
                silent: !0
            }).pipe(function() {
                dfd.resolve(model)
            }, function() {
                dfd.reject()
            }), dfd.promise()
        }
    }
}),
 define("reader/modules/collection_add_dup", ["backbone", "underscore", "jquery"], function(Backbone, _, $) {
    var CProto = Backbone.Collection.prototype;
    return {
        add: function(models, options) {
            models = $.makeArray(models), models = _.forEach(models, function(m) {
                var r = this.get(m.id);
                r ? r.set(m) : CProto.add.call(this, m, options)
            }, this)
        }
    }
}),
 define("reader/models/rating", ["backbone", "underscore", "mod/ajax"], function(Backbone) {
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
}),
 define("reader/app", ["jquery", "underscore", "backbone"], function($, _, Backbone) {
    var app = {};
    return app.vent = _.extend({}, Backbone.Events), app
}),
 define("reader/models/article", ["backbone", "reader/app", "reader/models/rating", "mod/ajax"], function(Backbone, app, Rating, Ajax) {
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
}),
 define("reader/collections/articles", ["backbone", "underscore", "reader/models/article", "reader/modules/collection_add_dup", "reader/modules/coll_fetch_one"], function(Backbone, _, Article, addDup, fetchOne) {
    var Articles = Backbone.Collection.extend({
        model: Article,
        url: "/j/articles/",
        initialize: function(models, options) {
            options && options.urlSuffix && (this.url = this.url + options.urlSuffix)
        },
        fetch: function(options) {
            return options = options || {}, options.dataType = "json", Backbone.Collection.prototype.fetch.call(this, options)
        }
    });
    return _.extend(Articles.prototype, addDup, fetchOne), Articles
}),
 define("reader/views/reading/mixins/panel", ["jquery", "underscore", "backbone"], function() {
    var mixinedMethods = {
        closePanel: function() {
            this.$el.trigger("close")
        }
    };
    return mixinedMethods
}),
 define("reader/views/reading/toc", ["jquery", "backbone", "underscore", "reader/views/reading/mixins/panel", "reader/modules/ga"], function($, Backbone, _, Panel, ga) {
    var Toc = Backbone.View.extend({
        tmpl: $("#tmpl-toc").html(),
        events: {
            "click ul": "tocJump",
            "click .close-panel-lnk": "closePanel"
        },
        closePanel: function() {
            this.$el.trigger("close")
        },
        initialize: function(options) {
            this.app = options.app, this.pagination = options.pagination, this.config = options.config
        },
        render: function(list) {
            var hasToc = !! list.length;
            return hasToc ? (this.$el.html(_.template(this.tmpl, {
                list: list
            })), this.$el) : this.$el.empty()
        },
        tocJump: function(e) {
            var el = e.target;
            if ("A" === el.tagName) {
                var pageNum = parseInt(el.id.split("-")[1], 10);
                pageNum += this.pagination.isGift ? 1 : 0, this.pagination.hasInputPage = 1, this.config.setCurrPage(pageNum), this.pagination.switcher.hideAll(), ga._trackEvent("clickContentsItem")
            }
        }
    });
    return _.extend(Toc.prototype, Panel), Toc
}),
 define("reader/modules/bubble", ["jquery", "underscore", "backbone"], function($, _, Backbone) {
    function Bubble(opt) {
        opt = $.extend({}, defaults, opt), this.opt = opt;
        var bubble = this;
        this._config = {}, this._opened = !1, this._node = $(opt.html), this._content = this._node.find(opt.contentClass), this._close = this._node.find(opt.closeClass), this.set(opt), this._node.hide(), this._node.appendTo(body), this._node.on("click", opt.closeClass, function() {
            bubble.hide()
        })
    }
    var doc = document,
        body = doc.body,
        TMPL_BUBBLE = '<div class="reader-bubble"><b class="bubble-close">&times;</b><div class="bubble-content"></div></div>',
        defaults = {
            html: TMPL_BUBBLE,
            contentClass: ".bubble-content",
            closeClass: ".bubble-close"
        };
    return Bubble.extend = Backbone.inhert, Bubble.prototype = {
        constructor: Bubble,
        set: function(opt) {
            return this.opt = _.extend(this.opt, opt), opt.target && (this._config.target = opt.target), opt.width && this.setWidth(opt.width), this.setContent(opt.content || ""), this
        },
        setWidth: function(width) {
            return this._node.css("width", width), this
        },
        setContent: function(content) {
            return this._content.html(content), this
        },
        setPosition: function(target) {
            var tar = $(target),
                bubbleHeight = this._node.outerHeight(),
                middleHeight = tar.offset().top - $(doc).scrollTop() - (bubbleHeight - tar.height()) / 2;
            return this._node.css({
                top: middleHeight,
                left: tar.offset().left + 35
            }), this
        },
        update: function() {
            return this.setPosition(this._config.target), this
        },
        isVisible: function() {
            return this._node.is(":visible")
        },
        show: function() {
            var target = this._config.target;
            return this._opened ? (this.setPosition(target), void 0) : (this._opened = !0, this._node.show(), this.setPosition(target), this)
        },
        hide: function(clear) {
            return this._opened ? (this._opened = !1, this._node.hide(), clear && this._content.empty(), this) : void 0
        },
        toggle: function(clear) {
            var target = this._config.target,
                prevTarget = this._config.prevTarget;
            return target !== prevTarget ? (this._config.prevTarget = target, this.show(), this) : (this._opened ? this.hide(clear) : this.show(), this)
        },
        destroy: function() {
            return this._opened ? (this._opened = !1, this._node.remove(), this) : void 0
        }
    }, Bubble
}),
 define("reader/modules/tooltip", ["jquery", "underscore", "backbone", "reader/modules/bubble"], function($, _, Backbone, Bubble) {
    var body = $("body"),
        TMPL_TOOLTIP = $.trim($("#tmpl-tooltip").html()),
        CLASS_TIPS = "tooltip",
        defaults = {
            html: TMPL_TOOLTIP
        }, Tooltip = Bubble.extend({
            _super: Bubble.prototype,
            constructor: function(opt) {
                this.vent = _.extend({}, Backbone.Events), opt = $.extend({}, defaults, opt), this._super.constructor.call(this, opt), this.setUpEvents()
            },
            set: function(opt) {
                return opt.target && (this.target = opt.target), this.setClass(opt.className), this._super.set.call(this, opt)
            },
            hide: function() {
                return this.vent.trigger("hide"), this._super.hide.call(this)
            },
            setPosition: function(target, arrowHeight) {
                var offset, arrowIsBottom = !0,
                    arrowMargin = 5,
                    targetIsElement = target instanceof $;
                arrowHeight = arrowHeight || 0;
                var height = this._node.outerHeight() + arrowHeight;
                if (targetIsElement) {
                    var tarOffset = target.offset(),
                        targetBCR = target[0].getBoundingClientRect();
                    offset = {}, arrowIsBottom = targetBCR.top > height, offset.top = arrowIsBottom ? tarOffset.top - height - arrowMargin : tarOffset.top + target.outerHeight() + arrowHeight + arrowMargin, offset.left = tarOffset.left - (this._node.outerWidth() - target.outerWidth()) / 2
                } else arrowIsBottom = target.top > height, offset = {
                    left: target.left - this._node.outerWidth() / 2
                }, offset.top = arrowIsBottom ? target.top - height - arrowMargin : target.top + arrowHeight + arrowMargin;
                return this._node.toggleClass("arrow-top", !arrowIsBottom), this._node.toggleClass("arrow-bottom", arrowIsBottom), this._node.css(offset), this
            },
            update: function(arrowHeight) {
                this.setPosition(this.target, arrowHeight)
            },
            setClass: function(klass) {
                return this._node[0].className = CLASS_TIPS + (klass ? " " + klass : ""), this
            },
            setUpEvents: function() {
                var self = this;
                body.on("mousedown", function(e) {
                    var target = $(e.target),
                        clicked = target.parents().andSelf();
                    clicked.is(self._node) || self.hide()
                }), this._node.on("click mouseup", function(e) {
                    e.stopPropagation()
                })
            }
        });
    return Tooltip
}),
 define("reader/views/reading/mixins/sharing", ["jquery", "underscore", "backbone", "reader/app", "mod/ajax", "mod/detector", "reader/modules/ga"], function($, _, Backbone, app, ajax) {
    return {
        tmpl: $("#tmpl-sharing-form").html(),
        tmplShareWeibo: $("#tmpl-share-weibo").html(),
        initializeSharing: function() {
            this.settingBtn = this.$(".share-setting"), this.shareText = this.$(".share-text"), this.updateModel = _.bind(this.updateModel, this), this.$("input[type=checkbox]").on("change", this.updateModel)
        },
        updateForm: function() {
            var self = this,
                ebook = app.model.book,
                itemWeibo = this.$el.find(".item-weibo"),
                aid = ebook ? ebook.get("id") : location.pathname.split("/")[3],
                defaultSharingText = "";
            ebook && (defaultSharingText = ebook.get("defaultSharingText"), this.shareText.val(defaultSharingText ? defaultSharingText + " " : "")), ajax.get("/j/share/check_sina", function(data) {
                itemWeibo.html(_.template(self.tmplShareWeibo, {
                    weiboShared: data.bind
                })), self.formModel.set("share_weibo", data.bind ? "on" : ""), self.$("#share-weibo").on("change", self.updateModel), self.settingBtn[data.bind ? "show" : "hide"]()
            }), aid && ajax.get("/ebook/" + aid + "/events", function(events) {
                if (events.hashtag) {
                    var text = $.trim(self.shareText.text()),
                        hashtag = (text.length ? " " : "") + "#" + events.hashtag + "# ";
                    self.shareText.val(text + hashtag)
                }
            }), this.shareText.focus()
        },
        updateModel: function(e) {
            var el = $(e.currentTarget),
                name = el.attr("name"),
                checked = el.prop("checked");
            this.formModel.set(name, checked ? "on" : "")
        }
    }
}),
 define("reader/models/sharing", ["backbone", "underscore", "jquery"], function(Backbone, _, $) {
    return Backbone.Model.extend({
        defaults: {
            share_dou: "",
            share_weibo: "",
            broadcast_to_site: "",
            text: ""
        },
        setParamsAsForm: function(form) {
            var paramArray = $(form).serializeArray(),
                paramObj = _.clone(this.defaults);
            _.each(paramArray, function(param) {
                paramObj[param.name] = param.value
            }), this.set(paramObj)
        },
        canSubmit: function() {
            var props = this.pick("share_dou", "share_weibo", "broadcast_to_site");
            return _.chain(props).values().some().value()
        }
    })
}),
 define("reader/modules/toast", ["jquery", "underscore"], function($, _) {
    var win = $(window),
        body = $("body"),
        Toast = function(options) {
            this.options = _.defaults(options || {}, this.defaults);
            var toast = _.result(this, "el");
            toast.text(options.text);
            var width = toast.outerWidth(),
                left = (win.width() - width) / 2;
            if (toast.css({
                left: left
            }), "middle" === options["vertical-align"]) {
                var top = (win.height() - toast.outerHeight()) / 2;
                toast.css({
                    top: top
                })
            }
            toast.delay(options.delay).fadeOut(function() {
                $(this).remove()
            })
        };
    _.extend(Toast.prototype, {
        defaults: {
            delay: 1e3,
            id: "toast-container",
            text: "加载中"
        },
        el: function() {
            var options = this.options,
                id = options.id,
                toast = $("#" + id);
            return toast.length ? toast.stop(!0).css({
                opacity: toast.data("orig-opacity") || 1
            }) : (toast = $("<div>", {
                id: id
            }).appendTo(body), toast.data("orig-opacity", toast.css("opacity"))), toast
        }
    });
    var options = {
        toast: {
            "vertical-align": "middle",
            delay: 900
        }
    };
    return _.each(["alert", "toast"], function(name) {
        Toast[name] = function(text) {
            return new Toast(_.extend({
                id: "reminder-" + name,
                text: text
            }, options[name]))
        }
    }), Toast
}),
 define("mod/key", ["jquery"], function($) {
    function getKeys(event) {
        var special = "keypress" !== event.type && specialKeys[event.which],
            character = String.fromCharCode(event.which).toLowerCase(),
            modif = "",
            possible = {};
        if (event.altKey && "alt" !== special && (modif += "alt+"), event.ctrlKey && "ctrl" !== special && (modif += "ctrl+"), event.metaKey && !event.ctrlKey && "meta" !== special && (modif += "meta+"), event.shiftKey && "shift" !== special && (modif += "shift+"), special) possible[modif + special] = !0;
        else {
            var k = modif + character;
            k && (possible[k] = !0), k = shiftNums[character], k && (possible[modif + k] = !0, "shift+" === modif && (k = shiftNums[character], k && (possible[k] = !0)))
        }
        return possible
    }

    function Keys(opt) {
        opt = opt || {};
        var self = this;
        this.target = opt.target || document, this.event = opt.event || "keydown", this.keyHandlers = {}, this.rules = [], this.sequence = {}, this.sequenceNums = [], this.history = [], this._handler = function(ev) {
            if (this !== ev.target && (/textarea|select/i.test(ev.target.nodeName) || "text" === ev.target.type)) return !0;
            var handlers = self.keyHandlers[self.event];
            if (!handlers) return !0;
            var handler, queue_handler, possible = getKeys(ev),
                is_disabled = self.lock || !self.check(this, ev);
            if (is_disabled) return !1;
            for (var i in possible)
                if (handler = handlers[i]) break;
            if (self.sequenceNums.length) {
                var history = self.history;
                if (history.push(i), history.length > 10 && history.shift(), history.length > 1)
                    for (var j = self.sequenceNums.length - 1; j >= 0; j--)
                        if (queue_handler = handlers[history.slice(0 - self.sequenceNums[j]).join("->")]) return queue_handler.apply(this, arguments), history.length = 0, !1
            }
            handler && handler.apply(this, arguments)
        }, $(this.target).bind(this.event, this._handler)
    }
    var specialKeys = {
        8: "backspace",
        9: "tab",
        13: "enter",
        16: "shift",
        17: "ctrl",
        18: "alt",
        19: "pause",
        20: "capslock",
        27: "esc",
        32: "space",
        33: "pageup",
        34: "pagedown",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        45: "insert",
        46: "del",
        96: "0",
        97: "1",
        98: "2",
        99: "3",
        100: "4",
        101: "5",
        102: "6",
        103: "7",
        104: "8",
        105: "9",
        106: "*",
        107: "+",
        109: "-",
        110: ".",
        111: "/",
        112: "f1",
        113: "f2",
        114: "f3",
        115: "f4",
        116: "f5",
        117: "f6",
        118: "f7",
        119: "f8",
        120: "f9",
        121: "f10",
        122: "f11",
        123: "f12",
        144: "numlock",
        145: "scroll",
        191: "/",
        224: "meta"
    }, shiftNums = {
            "`": "~",
            1: "!",
            2: "@",
            3: "#",
            4: "$",
            5: "%",
            6: "^",
            7: "&",
            8: "*",
            9: "(",
            0: ")",
            "-": "_",
            "=": "+",
            ";": ":",
            "'": '"',
            ",": "<",
            ".": ">",
            "/": "?",
            "\\": "|"
        };
    return Keys.prototype = {
        addHandler: function(event, keyname, fn) {
            function add(kname) {
                var order = kname.split("->");
                if (order.length > 1) {
                    self.sequence[order.length] = 1;
                    var seq = [];
                    for (var i in self.sequence) seq.push(parseInt(i, 10));
                    self.sequenceNums = seq.sort(function(a, b) {
                        return a - b
                    })
                }
                handlers[kname.toLowerCase()] = fn
            }
            var self = this,
                handlers = this.keyHandlers[event];
            return handlers || (handlers = this.keyHandlers[event] = {}), $.isArray(keyname) ? $.each(keyname, function(index, n) {
                add(n)
            }) : add(keyname), this
        },
        reset: function() {
            $(this.target).unbind(this.event, this._handler), this.keyHandlers = {}, this.rules = [], this.history = [], delete this._handler, this.lock = !1
        },
        addRule: function(fn) {
            return this.rules.push(fn), this
        },
        enable: function() {
            this.lock = !1
        },
        disable: function() {
            this.lock = !0
        },
        check: function(target, ev) {
            for (var re = !0, r = this.rules, i = 0, l = r.length; l > i; i++)
                if (!r[i].call(target, ev)) {
                    re = !1;
                    break
                }
            return re
        }
    }, $.each(["down", "up", "press"], function(index, name) {
        Keys.prototype[name] = function(keyname, fn) {
            return this.addHandler("key" + name, keyname, fn), this
        }
    }),
    function(opt) {
        return new Keys(opt)
    }
}),
 define("reader/modules/form_util", ["jquery", "mod/key"], function($, Key) {
    var VISIBLE_INPUT = "input, button, textarea",
        TEXTAREA = "textarea";
    return {
        readonlyForm: function(form) {
            form.find(VISIBLE_INPUT).prop("readonly", !0)
        },
        resumeForm: function(form) {
            form.find(VISIBLE_INPUT).prop("readonly", !1)
        },
        ctrlEnterForm: function(form) {
            var textarea = form.find(TEXTAREA),
                keyRouter = textarea.data("key-router") || Key({
                    target: textarea
                });
            keyRouter.down("ctrl+enter", function() {
                $(this.form).submit()
            }), textarea.data("key-router", keyRouter)
        }
    }
}),
 define("reader/views/reading/tips/sharing_tip", ["jquery", "backbone", "underscore", "mod/ajax", "reader/modules/form_util", "reader/modules/toast", "reader/models/sharing", "reader/views/reading/mixins/sharing"], function($, Backbone, _, ajax, FormUtil, Toast, SharingModel, sharingMixin) {
    var SharingTip = Backbone.View.extend({
        el: function() {
            var el = $("<div>").html(_.template(this.tmpl, {
                isBubble: !0
            }));
            return el = el.find(".share-form")
        },
        initialize: function(options) {
            this.state = $.Deferred(), this.state.always(options.onCloseTip), this.initializeSharing(), this.updateForm(), FormUtil.ctrlEnterForm(this.$el);
            var formModel = this.formModel = new SharingModel(options.extraParam, {
                url: options.url
            });
            formModel.setParamsAsForm(this.el), formModel.on("change:share_dou change:share_weibo change:broadcast_to_site", this.disableFormWithoutChecked, this)
        },
        events: {
            submit: "submitForm",
            "click .ln-cancel": "cancelForm"
        },
        disableFormWithoutChecked: function(model) {
            var isDisabled = !model.canSubmit(),
                button = this.$(".btn-post");
            isDisabled !== button.prop("disabled") && button.prop("disabled", isDisabled).toggleClass("btn-disabled", isDisabled).text(isDisabled ? "请选择分享到哪里" : "确定")
        },
        cancelForm: function(e) {
            e.preventDefault(), this.state.reject()
        },
        submitForm: function(e) {
            e.preventDefault(), FormUtil.readonlyForm(this.$el), this.formModel.setParamsAsForm(this.el), this.formModel.save({}, {
                success: $.proxy(function() {
                    this.shareText.val(""), FormUtil.resumeForm(this.$el), Toast.toast("分享成功")
                }, this),
                error: function() {
                    Toast.toast("分享失败")
                }
            }), this.state.resolve()
        },
        render: function() {
            return this
        }
    });
    return _.extend(SharingTip.prototype, sharingMixin), SharingTip
}),
 define("mod/cursor", [], function() {
    var cursor = {}, doc = document,
        getCursorPosition = function(textarea) {
            if (doc.selection) {
                textarea.focus();
                var ds = doc.selection,
                    range = ds.createRange(),
                    storedRange = range.duplicate();
                return storedRange.moveToElementText(textarea), storedRange.setEndPoint("EndToEnd", range), textarea.selectionStart = storedRange.text.length - range.text.length, textarea.selectionStart
            }
            return textarea.selectionStart
        }, _selectTxt = function(textarea, start, end) {
            if (doc.selection) {
                var range = textarea.createTextRange();
                range.moveEnd("character", -textarea.value.length), range.moveEnd("character", end), range.moveStart("character", start), range.select()
            } else textarea.setSelectionRange(start, end), textarea.focus()
        }, setCursorPosition = function(textarea, position) {
            _selectTxt(textarea, position, position)
        }, insertAfterCursor = function(textarea, text) {
            if (textarea.value, doc.selection) textarea.focus(), doc.selection.createRange().text = text;
            else {
                var cp = textarea.selectionStart,
                    ubbLength = textarea.value.length;
                textarea.value = textarea.value.slice(0, cp) + text + textarea.value.slice(cp, ubbLength), setCursorPosition(textarea, cp + text.length)
            }
        }, removeRangeText = function(textarea, number) {
            var pos = getCursorPosition(textarea),
                val = textarea.value;
            textarea.value = number > 0 ? val.slice(0, pos - number) + val.slice(pos) : val.slice(0, pos) + val.slice(pos - number), setCursorPosition(textarea, pos - (0 > number ? 0 : number))
        }, collapseToEnd = function(textarea) {
            if (doc.selection) {
                var range = textarea.createTextRange();
                range.moveToElementText(textarea), range.collapse("false"), range.select()
            } else {
                var len = textarea.value.length;
                textarea.setSelectionRange(len, len), textarea.focus()
            }
        };
    return cursor = {
        get: getCursorPosition,
        set: setCursorPosition,
        insert: insertAfterCursor,
        remove: removeRangeText,
        collapseToEnd: collapseToEnd
    }
}),
 define("reader/views/reading/annotations_panel/note_inline_form", ["jquery", "backbone", "underscore", "mod/cursor", "reader/modules/form_util"], function($, Backbone, _, cursor, FormUtil) {
    var NoteInlineForm = Backbone.View.extend({
        tagName: "form",
        className: "inline-form",
        tmpl: $("#tmpl-annotations-panel-inline-form").html(),
        events: {
            "click .cancel": "cancel",
            submit: "editDone"
        },
        initialize: function() {
            this.dfd = new $.Deferred, this.promise = this.dfd.promise(), this.promise.always(_.bind(function() {
                this.remove()
            }, this))
        },
        render: function() {
            return this.$el.html(_.template(this.tmpl, this.model.pick("text"))), this.textarea = this.$(".text"), FormUtil.ctrlEnterForm(this.$el), this.fakeTextarea = this.textarea.clone(), this.textarea.on("input propertychange", _.bind(this.autoResize, this)), this.fakeTextarea.css({
                position: "absolute",
                top: "-999px",
                left: 0
            }), this.$el.append(this.fakeTextarea), this
        },
        autoResize: function(e) {
            var textarea = this.textarea,
                fakeTextarea = this.fakeTextarea;
            if (!textarea.data("has-expanded-max-height")) {
                if (e && e.originalEvent) {
                    var prop = e.originalEvent.propertyName;
                    if (prop && "value" !== prop) return
                }
                var value = textarea.val();
                fakeTextarea.val(value);
                var height = this.getTextareaScorllHeight(fakeTextarea),
                    MAX_HEIGHT = 100;
                return height > MAX_HEIGHT && (height = MAX_HEIGHT, textarea.css({
                    overflow: "auto"
                }).data("has-expanded-max-height", !0)), textarea.height(height), this
            }
        },
        getTextareaScorllHeight: function(textarea) {
            return textarea.height(0).scrollTop(0).scrollTop(1e4).scrollTop()
        },
        focus: function() {
            return this.textarea.focus(), cursor.collapseToEnd(this.textarea[0]), this
        },
        parseText: function(text) {
            return $.trim(text).replace(/\n/g, " ")
        },
        editDone: function(e) {
            e.preventDefault();
            var text = this.parseText(this.textarea.val());
            return text.length ? (this.model.set({
                text: text
            }), this.dfd.resolve(this.model), void 0) : alert("批注不能为空")
        },
        cancel: function(e) {
            e.preventDefault(), this.dfd.reject()
        }
    });
    return NoteInlineForm
}),
 define("reader/views/reading/annotations_panel/annotations_item", ["jquery", "backbone", "underscore", "reader/views/reading/annotations_panel/note_inline_form", "reader/views/reading/tips/sharing_tip"], function($, Backbone, _, NoteInlineForm, SharingForm) {
    var AnnotationsItem = Backbone.View.extend({
        tagName: "li",
        className: "annotations-item",
        tmpl: $("#tmpl-annotations-panel-item").html(),
        initialize: function(options) {
            this.info = options.info, this.config = options.config, this.shareTip = options.shareTip, this.annotations = options.annotations, this.listenTo(this.model, "remove", this.destroy)
        },
        events: {
            "click .delete-annotation": "deleteAnnotation",
            "click .modify-annotation": "editNote",
            "click .jump-annotation": "jumpAnnotation",
            "click .share-annotation": "shareAnnotation"
        },
        render: function() {
            return this.$el.html(_.template(this.tmpl, _.extend({
                isNote: "note" === this.info.get("type")
            }, this.info.pick("percent", "text"), this.model.pick("note"), {
                create_time: this.printTime(this.info.get("create_time"))
            }))), this
        },
        printTime: function() {
            function pad(n) {
                return (10 > n ? "0" : "") + n
            }
            return function(ISOTime) {
                var date = new Date(ISOTime);
                return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds())
            }
        }(),
        htmlNoteArea: function(html) {
            this.$(".note").html(_.escape(html))
        },
        editNote: function(e) {
            e.preventDefault();
            var model = this.model,
                note = model.get("note"),
                NoteModel = Backbone.Model.extend({
                    defaults: {
                        text: ""
                    }
                }),
                noteInlineForm = new NoteInlineForm({
                    model: new NoteModel({
                        text: note
                    })
                }),
                noteArea = this.$(".note"),
                self = this;
            noteArea.html(noteInlineForm.render().el), noteInlineForm.autoResize().focus();
            var modifyBtn = this.$(".modify-annotation");
            modifyBtn.hide(), noteInlineForm.promise.done(function(textModel) {
                model.set("note", textModel.get("text"))
            }).always(function() {
                self.htmlNoteArea(model.get("note")), modifyBtn.show()
            })
        },
        jumpAnnotation: function(e) {
            e.preventDefault();
            var stamp = this.model.getStamp();
            this.config.trigger("jump:stamp", stamp)
        },
        deleteAnnotation: function(e) {
            e.preventDefault();
            var type = this.model.isUnderline() ? "划线" : "批注",
                result = confirm("确定删除这条{type}吗？".replace("{type}", type));
            result && this.model.destroy()
        },
        shareAnnotation: function(e) {
            e.preventDefault();
            var el = $(e.currentTarget),
                model = this.model,
                closeShareTip = _.bind(function() {
                    this.shareTip.hide()
                }, this),
                sharingForm = new SharingForm({
                    model: model,
                    onCloseTip: closeShareTip,
                    url: "/j/share/rec_annotation",
                    extraParam: {
                        annotation_id: model.get("id"),
                        works_id: model.articleId
                    }
                });
            this.shareTip.set({
                target: el,
                content: sharingForm.render().el,
                className: "textarea-tip"
            }).show()
        },
        destroy: function() {
            this.annotations.remove(this.info), this.remove()
        }
    });
    return AnnotationsItem
}),
 define("reader/models/annotation_info", ["backbone", "underscore"], function(Backbone) {
    var AnnotationInfo = Backbone.Model.extend({
        parse: function(data) {
            return data.percent = parseInt(data.percent, 10), data
        }
    });
    return AnnotationInfo
}),
 define("reader/collections/annotation_infos", ["backbone", "underscore", "jquery", "reader/models/annotation_info"], function(Backbone, _, $, AnnotationInfo) {
    var AnnotationInfos = Backbone.Collection.extend({
        url: function() {
            return "/j/article_v2/" + this.articleId + "/get_annotations?include_extra_fields=true"
        },
        model: AnnotationInfo,
        initialize: function(attrs, options) {
            this.articleId = options.articleId
        }
    });
    return AnnotationInfos
}),
 define("reader/views/reading/annotations_panel/view", ["jquery", "backbone", "underscore", "reader/collections/annotation_infos", "reader/views/reading/annotations_panel/annotations_item", "reader/views/reading/mixins/panel", "reader/modules/tooltip"], function($, Backbone, _, AnnotationInfos, AnnotationsItem, Panel, Tooltip) {
    var LABEL_NOT_ANNOTATIONS = "你还没添加批注哦!",
        LABEL_LOADING = "加载中...",
        LABEL_ERROR = "出错了",
        SHOW = !0,
        HIDE = !1,
        AnnotationsPanel = Backbone.View.extend({
            tmpl: $("#tmpl-annotations-panel").html(),
            initialize: function(options) {
                this.app = options.app, this.config = options.config, this.sortType = "time", this.list = $("<ul>", {
                    "class": "annotations-list"
                }), this.textBox = $("<div>", {
                    "class": "text-box"
                }), this.shareTip = new Tooltip, this.$el.on("scroll", _.throttle(_.bind(this.scroll, this), 300))
            },
            events: {
                "action:expand": "render",
                "click .filter-tabs a": "filter",
                "click .close-panel-lnk": "closePanel"
            },
            render: function() {
                this.$el.empty(), this.$el.html(_.template(this.tmpl)), this.filterTabs = this.$(".filter-tabs"), this.panelBody = this.$(".panel-body"), this.renderFitlerTabs();
                var markings = this.app.model.book.markings,
                    markingsLength = markings.length;
                if (this.filterTabs.toggle(HIDE), !markingsLength) return this.renderTextBox(LABEL_NOT_ANNOTATIONS), this;
                this.renderTextBox(LABEL_LOADING);
                var annotations = this.annotations = new AnnotationInfos(null, {
                    articleId: this.app.model.book.id
                });
                return annotations.on("remove", this.detectAnnotationsExist, this), annotations.fetch({
                    success: $.proxy(function() {
                        this.renderListBy(this.sortType), this.panelBody.html(this.list), this.filterTabs.toggle(SHOW)
                    }, this),
                    error: $.proxy(function() {
                        this.renderTextBox(LABEL_ERROR)
                    }, this)
                }), this
            },
            scroll: function() {
                var tip = this.shareTip;
                tip.isVisible() && tip.hide()
            },
            detectAnnotationsExist: function() {
                return this.annotations.length ? !0 : (this.filterTabs.toggle(HIDE), this.renderTextBox(LABEL_NOT_ANNOTATIONS), void 0)
            },
            renderTextBox: function(text) {
                this.panelBody.html(this.textBox.text(text))
            },
            filter: function(e) {
                var el = $(e.currentTarget),
                    type = el.data("sort-type");
                this.sortType === type || this.filterTabs.hasClass("disabled") || (this.sortType = type, this.renderFitlerTabs(), this.renderListBy(this.sortType))
            },
            renderFitlerTabs: function() {
                var filterTabs = this.filterTabs,
                    handlers = filterTabs.find("a"),
                    handler = handlers.filter("a[data-sort-type=" + this.sortType + "]");
                handlers.toggleClass("actived", !1), handler.addClass("actived")
            },
            renderListBy: function(sortType) {
                this.list.empty(), this.annotations.length && _.each(this.getAnnotationViewsBy(sortType), function(view) {
                    this.list.append(view.render().el)
                }, this)
            },
            sortIterator: {
                time: function(annotation) {
                    return -new Date(annotation.get("create_time"))
                },
                percent: function(annotation) {
                    return annotation.get("percent")
                }
            },
            getAnnotationViewsBy: function(sortType) {
                var infos = this.getAnnotationInfosBy(sortType),
                    markings = this.app.model.book.markings,
                    views = [],
                    self = this;
                return _.each(infos, function(info) {
                    views.push(new AnnotationsItem({
                        model: markings.get(info.id),
                        info: info,
                        config: self.config,
                        annotations: self.annotations,
                        shareTip: self.shareTip
                    }))
                }), views
            },
            getAnnotationInfosBy: function(sortType) {
                var annotations = this.annotations;
                return _.clone(annotations.sortBy(this.sortIterator[sortType]))
            }
        });
    return _.extend(AnnotationsPanel.prototype, Panel), AnnotationsPanel
}),
 define("reader/views/reading/page_number", ["jquery", "backbone", "underscore", "reader/modules/ga"], function($, Backbone, _, ga) {
    var PageNumber = Backbone.View.extend({
        el: ".page-number",
        initialize: function(options) {
            this.listenTo(this.model, "change:currPage", this.updatePageNumber), this.jumpSection = this.$(".page-jump"), this.form = this.$(".page-form"), this.formInput = this.$(".page-input"), this.currPage = this.$(".curr-num"), this.pagination = options.pagination, this.app = options.app, this.body = $("body"), this.win = $(window), this.formInput.focus(this.focusPageInput), this.on("view:openPageForm", this.openPageForm)
        },
        events: {
            "click .page-info": "openPageFormOnClick",
            "submit .page-form": "submitPageForm",
            "click .page-jump": "stopPropagation"
        },
        render: function() {
            this.setTotalPageNum(), this.updatePageNumber(), this.togglePageNumber(), this.win.resize(_.debounce(_.bind(this.togglePageNumber, this), 60))
        },
        togglePageNumber: function() {
            this.app.fitForMobile || this.$el.toggle(this.win.width() >= 1024)
        },
        setTotalPageNum: function() {
            var totalPage = this.model.get("totalPage");
            totalPage = this.pagination.isGift ? --totalPage : totalPage, this.$(".total-num").text(totalPage)
        },
        stopPropagation: function(e) {
            $(e.target).is("[type=submit]") || e.stopPropagation()
        },
        openPageFormOnClick: function(e) {
            e.preventDefault(), this.$el.hasClass("on") || (e.stopPropagation(), this.openPageForm())
        },
        openPageForm: function() {
            this.$el.addClass("on"), this.jumpSection.show(), this.customPage(), this.formInput.focus(), this.body.on("click.pageNumber", $.proxy(this.closePageFormOnClick, this))
        },
        closePageFormOnClick: function(e) {
            $(e.target).is("[type=submit]") || (e.preventDefault(), this.closePageForm())
        },
        closePageForm: function() {
            this.$el.removeClass("on"), this.jumpSection.hide(), this.formInput.blur(), this.body.off(".pageNumber")
        },
        customPage: function() {
            var model = this.model;
            this.formInput.val(model.get("currPage"))
        },
        focusPageInput: function() {
            var formInput = $(this);
            _.defer(function() {
                formInput.select()
            })
        },
        updatePageNumber: function() {
            var currPage = this.model.get("currPage"),
                progress = this.model.get("progress");
            this.pagination.isGift && (currPage = 1 !== currPage ? --currPage : currPage), progress && (progress = Math.round(progress), this.$(".progress-num").text(progress + "%")), this.currPage.text(currPage), this.jumpSection.is(":hidden") || this.customPage()
        },
        submitPageForm: function(e) {
            e.preventDefault();
            var model = this.model,
                targetPage = +this.formInput.val();
            targetPage = this.pagination.isGift ? ++targetPage : targetPage, this.closePageForm(), model.get("currPage") !== targetPage && (this.pagination.hasInputPage = 1, model.setCurrPage(targetPage), ga._trackEvent("gotoPage"))
        }
    });
    return PageNumber
}),
 define("reader/views/reading/progress", ["backbone", "underscore", "jquery"], function(Backbone, _, $) {
    var Progress = Backbone.View.extend({
        initialize: function() {
            this.win = $(window), this.body = $("body")
        },
        render: function() {
            var pid = "reading-progress",
                max = 100;
            return this.$el = $("<progress>", {
                role: "progressbar",
                "aria-valuemin": 0,
                "aria-valuemax": max,
                id: pid,
                max: max
            }), this.body.append(this.$el), this.win.resize(_.debounce(_.bind(this._update, this), 80)), this
        },
        update: function() {
            var progress = this.model.get("progress"),
                layout = localStorage.layout || "horizontal",
                position = this.convertToPosition(layout);
            return this.setPosition(position), this.setValue(progress), this
        },
        setValue: function(progress) {
            progress = parseFloat(progress) || 0, this._valuenow = progress;
            var trackLength = this.win.height(),
                needPercent = !! /(top|bottom)/.test(this._position),
                remain = 100 - progress;
            return this.$el.val(progress).attr("aria-valuenow", progress), this._attrsAsProps() ? (this.$el.css({
                width: needPercent ? progress + "%" : progress / 100 * trackLength + "px",
                "padding-right": needPercent ? remain + "%" : remain / 100 * trackLength + "px"
            }), this) : this
        },
        _attrsAsProps: function() {
            return !!/msie (8|9)/i.test(navigator.userAgent)
        },
        _update: function() {
            this.update(this._position, this._valuenow)
        },
        setPosition: function(position) {
            var offset = 3,
                w = this.win.height(),
                t = w / 2 - offset,
                pos = "pos-" + position,
                errorMsg = "Invalid param!You can only use one of the positions:top | right | bottom | left.";
            switch (this._position = position, position) {
                case "top":
                case "right":
                    this.$el.css({
                        width: w,
                        top: t
                    });
                    break;
                case "bottom":
                case "left":
                    this.$el.removeAttr("style");
                    break;
                default:
                    throw Error(errorMsg)
            }
            return this.$el.attr("class", pos), this
        },
        positionMap: {
            vertical: "right",
            horizontal: "bottom"
        },
        convertToPosition: function(layout) {
            return this.positionMap[layout]
        }
    });
    return Progress
}),
 define("ui/collapse", ["jquery"], function($) {
    var SHOW = !0,
        HIDE = !1,
        defaultOptions = {
            according: !0,
            allowDisabled: !1,
            activeClass: "active",
            show: function(content) {
                return content.show()
            },
            hide: function(content) {
                return content.hide()
            },
            useCustomShowAndHide: !1,
            toggle: function(content) {
                var options = this.options;
                return content[options.toggleType](options.toggleDuration)
            },
            toggleType: "toggle",
            toggleDuration: null
        }, autoSplit = function(obj) {
            return obj instanceof jQuery ? obj.map(function() {
                return $(this)
            }) : void 0
        }, Collapse = function(handlers, contents, options) {
            this.options = $.extend({}, defaultOptions, options), this.activeClass = this.options.activeClass, this.allowDisabled = this.options.allowDisabled, this.handlers = handlers, this.contents = contents, this.transitioning = {}, this.listen()
        };
    return Collapse.fromAutoSplit = function(handlers, contents, options) {
        return new Collapse(autoSplit(handlers), autoSplit(contents), options)
    }, $.extend(Collapse.prototype, {
        listen: function() {
            var self = this;
            $.each(this.handlers, function(handlerIndex, elem) {
                var handler = $(elem);
                handler.on("click", function() {
                    if (!self.allowDisabled || !handler.hasClass("disabled")) {
                        var isOpened = handler.hasClass(self.activeClass);
                        if (!self.transitioning[handlerIndex]) return isOpened ? self.close(handlerIndex) : (self.open(handlerIndex), void 0)
                    }
                });
                var content = self.contents[handlerIndex];
                content.on("close.self", $.proxy(self.hideAll, self))
            })
        },
        findActived: function(callBack) {
            var self = this;
            $.each(this.handlers, function(index, handler) {
                var transitioning = self.transitioning[index],
                    isActived = handler.hasClass(self.activeClass);
                transitioning && isActived || (isActived || transitioning) && callBack.call(self, index)
            })
        },
        close: function(handlerIndex) {
            this.action(handlerIndex, HIDE)
        },
        open: function(handlerIndex) {
            this.options.according && this.hideAll(), this.action(handlerIndex, SHOW)
        },
        getActionFn: function(showOrHide) {
            return this.options.useCustomShowAndHide ? this.options[showOrHide ? "show" : "hide"] : this.options.toggle
        },
        action: function(handlerIndex, showOrHide) {
            var content = this.contents[handlerIndex],
                handler = this.handlers[handlerIndex],
                transitioning = this.transitioning[handlerIndex],
                actionType = showOrHide ? "expand" : "collapse",
                action = this.getActionFn(showOrHide),
                self = this;
            transitioning && content.stop(), this.transitioning[handlerIndex] = !0, action.call(this, content).promise().done(function() {
                handler[showOrHide ? "addClass" : "removeClass"](self.activeClass), content.trigger("action:" + actionType, content).trigger("action:toggle", [content, actionType]), self.transitioning[handlerIndex] = !1
            })
        },
        hideAll: function() {
            this.findActived(this.close)
        },
        disableHandlers: function() {
            $.each(this.handlers, function(index, handler) {
                handler.addClass("disabled")
            })
        }
    }), Collapse
}),
 define("reader/views/reading/pagination", ["jquery", "backbone", "underscore", "ui/collapse", "mod/detector", "reader/modules/ga", "reader/views/reading/progress", "reader/views/reading/page_number", "reader/views/reading/annotations_panel/view", "reader/views/reading/toc"], function($, Backbone, _, Collapse, detector, ga, Progress, PageNumber, AnnotationsPanel, Toc) {
    var Pagination = Backbone.View.extend({
        el: ".paging",
        initialize: function(app, config, vent) {
            _.bindAll(this, "pageJump", "closeTips", "closePopups", "initPagination", "verticalScroll", "saveReadingProgress", "resetHeight", "resizePanel", "togglePanel", "processScrollingEvent", "toggleShortcutTips"), this.win = $(window), this.body = $("body"), this.scrollBody = $("html, body"), this.app = app, this.hasInputPage = 0, this.config = config, this.vent = vent, this.vent.on({
                "paging:done": this.initPagination,
                "popups:close": this.closePopups,
                "shortcutTips:close": this.closeTips,
                "shortcutTips:toggle": this.toggleShortcutTips,
                "paging:toggle": this.toggle,
                "paging:hide": this.hide
            }), this.paging = this.$el, this.tocView = new Toc({
                el: this.$(".toc"),
                app: this.app,
                config: this.config,
                pagination: this
            }), this.toc = this.tocView.$el, this.tocSwitcher = this.$(".toggle-toc"), this.annotationsPanelView = new AnnotationsPanel({
                el: ".content-annotations-panel",
                app: this.app,
                config: this.config
            }), this.annotationsPanel = this.annotationsPanelView.$el, this.annotationsPanelSwitcher = this.$(".toggle-annotations-panel"), this.switcher = new Collapse([this.tocSwitcher, this.annotationsPanelSwitcher], [this.toc, this.annotationsPanel], {
                allowDisabled: !0
            }), this.config.on("jump:stamp", function() {
                this.switcher.hideAll()
            }, this), this.toc.on("action:toggle", this.togglePanel).on("action:toggle", $.proxy(function(e, action) {
                this.trigger("toc:toggled", action)
            }, this)).on("action:expand", function() {
                ga._trackEvent("openToc")
            }), this.annotationsPanel.on("action:toggle", this.togglePanel), this.pageForm = this.$(".page-form"), this.pagePrev = this.$(".page-prev"), this.pageNext = this.$(".page-next"), this.shortcutTips = this.$(".shortcut-tips"), this.emUnitBenchmark = 16, this.isShown = !! this.$el.is(":visible"), this.progressBar = new Progress({
                model: this.config
            }), this.pageNumber = new PageNumber({
                model: this.config,
                pagination: this,
                app: this.app
            })
        },
        render: function(article, book) {
            this.article = article, this.switcher.disableHandlers(), this.book = book, this.pageHeight = localStorage.pageHeight, this.pageOffset = this.config.get("pageOffset"), this.isSample = this.book.get("isSample"), this.isGift = this.book.get("isGift"), this.contentsPaddingTop = parseFloat(this.toc.css("paddingTop")), _.defer(_.bind(function() {
                this.articleInnerPadding = this.app.articleInner.css("paddingTop")
            }, this)), this.resetPanelAsResize(), this.app.fitForMobile || this.progressBar.render(), this.trigger("view:render")
        },
        events: {
            "click .paging-buttons li": "deselectAll",
            "click .page-prev, .page-next": "pageTurning",
            "click .close-tips": "closeTips"
        },
        dealingWithScrollbar: function(action) {
            var opened = "expand" === action;
            this.body.css("overflow", opened ? "hidden" : "auto")
        },
        resetPanelAsResize: function() {
            this.win.resize(_.debounce(this.resizePanel, 80))
        },
        resizePanel: function() {
            this.resetHeight(this.toc), this.resetHeight(this.annotationsPanel)
        },
        togglePanel: function(e, content, action) {
            this.dealingWithScrollbar(action), this.resetHeight(content)
        },
        togglePagingBtns: function(layout) {
            this.$el.find(".page-prev, .page-next").toggle("horizontal" === layout)
        },
        deselectAll: function(e) {
            this.closeTips();
            var el = $(e.currentTarget);
            el.is(".list-icon-outer") || this.switcher.hideAll(), this.paging.find(".on").not(el).removeClass("on")
        },
        closePopups: function() {
            this.switcher.hideAll(), this.paging.find(".on").removeClass("on")
        },
        closeTips: function() {
            this.shortcutTips.hide(), $("i.tips").remove()
        },
        toggleShortcutTips: function() {
            this.shortcutTips.toggle()
        },
        processScrollingEvent: function(layout) {
            "vertical" === layout ? this.win.scroll(_.debounce(this.verticalScroll, 150)) : this.win.off("scroll")
        },
        initAnnotationsPanel: function() {
            this.annotationsPanelSwitcher.removeClass("disabled")
        },
        initToc: function(list) {
            var hasToc = !! list.length;
            this.tocSwitcher[hasToc ? "removeClass" : "addClass"]("disabled"), this.tocView.render(list), this.trigger("list:render")
        },
        initPagination: function(list) {
            this.initAnnotationsPanel(), this.pageNumber.render(), this.initToc(list)
        },
        resetHeight: function(el) {
            this.app.fitForMobile || el.height(this.win.height() / 16 - 5 + "em")
        },
        isNoNeedHistory: function(prevPage, currPage) {
            var pageStep = Math.abs(currPage - prevPage);
            return !!(prevPage ? pageStep > 1 ? 0 : 1 : 0)
        },
        verticalScroll: function() {
            var articleInnerSink = parseInt(this.articleInnerPadding, 10),
                top = this.win.scrollTop(),
                prevPage = parseInt(this.pageNumber.currPage.text(), 10) || 0,
                currPage = Math.ceil((top - articleInnerSink + 1) / this.pageHeight);
            currPage = 0 === currPage ? 1 : currPage;
            var fakeCurrPage = (this.isNoNeedHistory(prevPage, currPage), this.isGift ? currPage - 1 : currPage);
            this.hasInputPage || (this.config.setCurrPage(currPage, {
                preventPageJump: !0
            }), this.saveReadingProgress()), (prevPage !== fakeCurrPage || this.hasInputPage) && (this.vent.trigger("pages:renderFull"), this.updateProgressBar(), this.hasInputPage = 0)
        },
        updateProgressBar: function() {
            this.progressBar.update()
        },
        removeProgressBar: function() {
            this.progressBar.remove()
        },
        saveReadingProgress: _.debounce(function() {
            var progress = (this.config.get("currPage") / this.config.get("totalPage")).toFixed(4);
            isNaN(progress) || this.book.set({
                progress: progress
            })
        }, 800),
        pageJump: function(config, currPage, options) {
            if (!(!currPage || options && options.preventPageJump)) {
                var pageWidth = this.config.get("pageWidth"),
                    prevPage = config.previous("currPage") || 0,
                    pageStep = Math.abs(currPage - prevPage),
                    isForward = currPage > prevPage ? 1 : 0,
                    layout = localStorage.layout;
                if (this.updateProgressBar(), this.app.fitForMobile && this.vent.trigger("page:freeze"), "horizontal" === layout) {
                    var resetPosition = isForward ? {
                        right: "auto",
                        left: 2 === currPage ? 0 : -pageWidth + "em"
                    } : {
                        right: (currPage > 1 ? 0 : -pageWidth) - this.pageOffset + "em",
                        left: "auto"
                    }, slideStep = "-=" + pageWidth + "em",
                        slideProps = {}, duration = detector.hasTouch() ? 300 : 1;
                    if (this.article.css(resetPosition), this.vent.trigger("pages:render"), pageStep > 1 || 0 === pageStep || !prevPage) return this.article.css({
                        left: 1 === currPage ? 0 : -pageWidth + "em",
                        right: "auto"
                    }), this.vent.trigger("page:unfreeze").trigger("page:scrollTop", 1), void 0;
                    slideProps[isForward ? "left" : "right"] = slideStep, this.article.animate(slideProps, duration, _.bind(function() {
                        this.vent.trigger("page:scrollTop", 1), this.vent.trigger("horizontal:page:clearPreload", isForward), this[isForward ? "pageNext" : "pagePrev"].removeClass("on"), this.vent.trigger("page:unfreeze")
                    }, this)), this.trigger("page:updated", currPage)
                } else this.win.scrollTop(), this.vent.trigger("pages:renderFull"), this.scrollBody.animate({
                    scrollTop: (currPage - 1) * this.pageHeight + (1 === currPage ? 0 : 80) + "px"
                }, 1 === pageStep ? 400 : 0, $.proxy(function() {
                    this[isForward ? "pageNext" : "pagePrev"].removeClass("on"), this.vent.trigger("page:unfreeze")
                }, this))
            }
        },
        pageTurning: _.debounce(function(e) {
            this.switcher.hideAll(), this.hasInputPage = 1;
            var direc = e.target.className,
                currPage = this.config.get("currPage"),
                totalPage = this.config.get("totalPage"),
                isLastPage = currPage === totalPage ? 1 : 0,
                isFirstPage = 1 === currPage ? 1 : 0,
                isPrev = "page-prev" === direc ? 1 : 0,
                pagingDirection = isPrev ? "pagePrev" : "pageNext";
            isPrev && isFirstPage || !isPrev && isLastPage || ("horizontal" === localStorage.layout && this.config.setCurrPage((isPrev ? -1 : 1) + currPage), this[pagingDirection].addClass("on"))
        }, 150),
        hide: function() {
            return this.isShown ? (this.isShown = !1, this.$el.hide(), void 0) : this
        },
        toggle: function() {
            return this.$el[this.isShown ? "hide" : "show"](), this.isShown = this.isShown ? !1 : !0, this
        }
    }),
        AnonymousMixin = Ark.me.isAnonymous ? {
            initAnnotationsPanel: $.noop
        } : {};
    return _.extend(Pagination.prototype, AnonymousMixin), Pagination
}),
 define("reader/modules/prettify", function() {
    function Hex64(key) {
        this._key = [], this._tbl = {};
        for (var _i = 0; 64 > _i; ++_i) this._key[_i] = _hexCHS.charAt(key[_i]), this._tbl[this._key[_i]] = _i;
        this._pad = _hexCHS.charAt(64)
    }
    var _hexCHS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$_~";
    Hex64.prototype.dec = function(s) {
        var _n1, _n2, _n3, _n4, _sa = [],
            _i = 0,
            _c = 0;
        for (s = s.replace(/[^0-9A-Za-z$_~]/g, ""); s.length > _i;) _n1 = this._tbl[s.charAt(_i++)], _n2 = this._tbl[s.charAt(_i++)], _n3 = this._tbl[s.charAt(_i++)], _n4 = this._tbl[s.charAt(_i++)], _sa[_c++] = _n1 << 2 | _n2 >> 4, _sa[_c++] = (15 & _n2) << 4 | _n3 >> 2, _sa[_c++] = (3 & _n3) << 6 | _n4;
        var _e2 = s.slice(-2);
        return _e2.charAt(0) === this._pad ? _sa.length = _sa.length - 2 : _e2.charAt(1) === this._pad && (_sa.length = _sa.length - 1), Hex64._1to2(_sa)
    }, Hex64._1to2 = function(a) {
        for (var _2b = !1, _rs = "", _i = 0; a.length > _i; ++_i) {
            var _c = a[_i];
            29 !== _c ? _rs += _2b ? String.fromCharCode(256 * _c + a[++_i]) : String.fromCharCode(_c) : _2b = !_2b
        }
        return _rs
    };
    var _key = [38, 48, 18, 11, 26, 19, 55, 58, 10, 33, 34, 49, 14, 25, 44, 52, 61, 16, 2, 56, 23, 29, 45, 9, 3, 12, 39, 30, 42, 47, 22, 21, 60, 1, 54, 28, 57, 17, 27, 15, 40, 46, 43, 13, 0, 51, 35, 63, 36, 50, 6, 32, 4, 31, 62, 5, 24, 8, 53, 59, 41, 20, 7, 37],
        decrypt = new Hex64(_key);
    return decrypt
}),
 define("reader/modules/typesetting", ["jquery", "underscore", "backbone"], function($, _) {
    function actionTrans(tag, str, reverse) {
        var method = reverse ? "toPseudo" : "toHtml";
        return $.map(tag, function(v) {
            function transTag(str) {
                return str = str.replace(source, target), source.test(str) ? transTag(str) : str
            }
            var source = tagRegex[v][method].source,
                target = tagRegex[v][method].target;
            str = transTag(str)
        }), str
    }

    function textIterator(paras, iterator) {
        _.each(paras, function(para) {
            var paraData = para.data;
            _.each(["text", "legend", "full_legend"], function(attr) {
                paraData && paraData[attr] && (paraData[attr] = iterator.call(this, paraData[attr]))
            })
        })
    }

    function wrapFormula(paras) {
        var info = wrapFormulaInfo;
        return textIterator(paras, function(text) {
            return text.replace(info.source, info.target)
        }), paras
    }

    function transformParas(tag, paras) {
        return textIterator(paras, function(text) {
            return actionTrans(tag, _.escape(text))
        }), paras
    }

    function transform(tag, str) {
        return actionTrans(tag, str)
    }
    var tagTmpls = {
        sup: {
            html: _.template('<sup data-text="{{= text}}"></sup>'),
            pseudo: _.template("<注释开始>{{= text}}</注释结束>")
        },
        em: {
            html: _.template('<em class="emphasize">{{= text}}</em>'),
            pseudo: _.template("<着重开始>{{= text}}</着重结束>")
        },
        code: {
            html: _.template((/webkit/i.test(navigator.userAgent) ? "<wbr>" : "") + '<code class="code-inline">{{= text}}</code>'),
            pseudo: _.template("<代码开始>{{= text}}</代码结束>")
        },
        i: {
            html: _.template('<i class="regularscript">{{= text}}</i>'),
            pseudo: _.template("<楷体开始>{{= text}}</楷体结束>")
        },
        del: {
            html: _.template('<del class="strikethrough">{{= text}}</del>'),
            pseudo: _.template("<删除线开始>{{= text}}</删除线结束>")
        }
    }, tagRegex = {
            sup: {
                toHtml: {
                    source: /(<|&lt;)注释开始(>|&gt;)([\s\S]+?)(<|&lt;)(\/|&#x2F;)注释结束(>|&gt;)/g,
                    target: tagTmpls.sup.html({
                        text: "$3"
                    })
                },
                toPseudo: {
                    source: /<sup [^>]*data-text="([\s\S]+?)"[^>]*><\/sup>/g,
                    target: tagTmpls.sup.pseudo({
                        text: "$1"
                    })
                }
            },
            em: {
                toHtml: {
                    source: /(<|&lt;)着重开始(>|&gt;)([\s\S]+?)(<|&lt;)(\/|&#x2F;)着重结束(>|&gt;)/g,
                    target: tagTmpls.em.html({
                        text: "$3"
                    })
                },
                toPseudo: {
                    source: /<em[^>]*>([\s\S]+?)<\/em>/g,
                    target: tagTmpls.em.pseudo({
                        text: "$1"
                    })
                }
            },
            code: {
                toHtml: {
                    source: /(<|&lt;)代码开始(>|&gt;)([\s\S]+?)(<|&lt;)(\/|&#x2F;)代码结束(>|&gt;)/g,
                    target: tagTmpls.code.html({
                        text: "$3"
                    })
                },
                toPseudo: {
                    source: /<code[^>]*>([\s\S]+?)<\/code>/g,
                    target: tagTmpls.code.pseudo({
                        text: "$1"
                    })
                }
            },
            i: {
                toHtml: {
                    source: /(<|&lt;)楷体开始(>|&gt;)([\s\S]+?)(<|&lt;)(\/|&#x2F;)楷体结束(>|&gt;)/g,
                    target: tagTmpls.i.html({
                        text: "$3"
                    })
                },
                toPseudo: {
                    source: /<i[^>]*>([\s\S]+?)<\/i>/g,
                    target: tagTmpls.i.pseudo({
                        text: "$1"
                    })
                }
            },
            del: {
                toHtml: {
                    source: /(<|&lt;)删除线开始(>|&gt;)([\s\S]+?)(<|&lt;)(\/|&#x2F;)删除线结束(>|&gt;)/g,
                    target: tagTmpls.del.html({
                        text: "$3"
                    })
                },
                toPseudo: {
                    source: /<del[^>]*>([\s\S]+?)<\/del>/g,
                    target: tagTmpls.del.pseudo({
                        text: "$1"
                    })
                }
            }
        }, wrapFormulaInfo = {
            source: /\\\(([\s\S]+?)\\\)/g,
            target: '<span class="mathjax-container">$&</span>'
        }, exports = {
            tagRegex: tagRegex,
            transform: transform,
            transformParas: transformParas,
            wrapFormula: wrapFormula,
            tagTmpls: tagTmpls
        };
    return exports
}),
 define("reader/modules/split_code_line", ["jquery", "underscore"], function() {
    var isIE8 = /msie 8/i.test(navigator.userAgent),
        splitCodeLine = function(text) {
            return text
        };
    return isIE8 && (splitCodeLine = function(text) {
        var lines = text.split("\n");
        return '<span class="line">' + lines.join('</span><span class="line">') + "</span>"
    }, splitCodeLine.doSplit = !0), splitCodeLine
}),
 define("reader/modules/is_mathplayer_installed", function() {
    return function() {
        try {
            return new ActiveXObject("MathPlayer.Factory.1"), !0
        } catch (err) {
            return !1
        }
    }
}),
 define("reader/modules/paging", ["jquery", "underscore", "reader/app", "reader/modules/typesetting", "reader/modules/is_mathplayer_installed", "reader/modules/split_code_line"], function($, _, app, typesetting, isMPInstalled, splitCodeLine) {
    function pxToEm(pixels, benchmark) {
        return +pixels / (benchmark || 16)
    }

    function fillHeight(height, lineHeight) {
        var remainder = height % lineHeight;
        return height + (lineHeight - remainder)
    }

    function paging(opts) {
        function pagingAction() {
            var header, headerRows, paragraphs, stories = content.find(".story"),
                storyTotal = stories.length;
            _.each(stories, function(story) {
                story = $(story), header = story.find(".info"), paragraphs = story.find("p"), headerRows = fillHeight(header.height(), lineHeight) / lineHeight + headerBottomRows, title = header.find(TITLE).text(), page = {
                    paragraphs: [],
                    pagination: pagination
                }, rows = rowsPerPage - headerRows, page.info = {
                    title: title,
                    subtitle: header.find(SUBTITLE).text(),
                    orig_author: header.find(AUTHOR).text(),
                    translator: header.find(TRANSLATOR).text(),
                    height: pxToEm(headerRows * lineHeight)
                }, page.content = {
                    height: pxToEm(pageHeight - headerRows * lineHeight)
                }, parseText(paragraphs)
            }), content.css("visibility", "visible"), dfd.resolve(new BookContent({
                body: book,
                posts: posts,
                gift: gift,
                contents: processContents(book, storyTotal),
                pidAndPageMap: pidAndPageMap,
                pageAndOffsetRowMap: pageAndOffsetRowMap
            }))
        }

        function parseText(paragraphs) {
            function createNewPage() {
                rows !== rowsPerPage && book.push(page), page = {
                    paragraphs: [],
                    pagination: book.length + 1
                }, rows = rowsPerPage
            }
            var p, pid, pRows, pOuterHeight, pExtraHeight, pTypes, pType, pContent, pTotal, canBreak, notIntHeight, isConfinedToPageHeight, offsetRows, offsetHeight, illusOffset, matchedType, extraData = {};
            _.each(paragraphs, function(v, i) {
                function createBasicData() {
                    return {
                        text: pContent,
                        klass: pTypes,
                        pid: pid,
                        type: pType
                    }
                }
                return p = $(v), p.hasClass("breaker") && rows >= 0 ? createNewPage() : (0 === rows && createNewPage(), pOuterHeight = p.outerHeight(!0), pExtraHeight = pOuterHeight - p.height(), pOuterHeight % lineHeight && (pOuterHeight = fillHeight(pOuterHeight, lineHeight), p.addClass("baffling")), pTypes = p.attr("class"), canBreak = /code|paragraph/.test(pTypes), notIntHeight = /illus|baffling/.test(pTypes), pRows = pOuterHeight / lineHeight, pTotal = paragraphs.length, pid = p.data("pid"), pContent = $.trim(p.html()), matchedType = /illus|code/.exec(pTypes), pType = matchedType && matchedType[0] || "paragraph", isConfinedToPageHeight = pOuterHeight > pageHeight && !canBreak, extraData = {}, rows -= pRows, (rows >= 0 || 0 > rows && pRows > 1 && canBreak) && (notIntHeight && (extraData = {
                    height: pxToEm(pOuterHeight - pExtraHeight)
                }), page.paragraphs.push(_.extend(createBasicData(), extraData)), pidAndPageMap[pid] = [page.pagination]), 0 > rows && function crossPage() {
                    extraData = {}, book.push(page), isConfinedToPageHeight && (pRows = rowsPerPage), offsetRows = rows + pRows, offsetHeight = offsetRows * lineHeight, notIntHeight && (extraData = {
                        height: pxToEm((isConfinedToPageHeight ? pageHeight : pOuterHeight) - pExtraHeight)
                    }), canBreak && _.extend(extraData, {
                        offset: pxToEm(offsetHeight)
                    }), page = {
                        paragraphs: [_.extend(createBasicData(), extraData)],
                        pagination: book.length + 1
                    }, pidAndPageMap[pid] ? pidAndPageMap[pid].push(page.pagination) : pidAndPageMap[pid] = [page.pagination], canBreak && (pageAndOffsetRowMap[pid] ? pageAndOffsetRowMap[pid].push(offsetRows) : pageAndOffsetRowMap[pid] = [0, offsetRows]), illusOffset = canBreak ? 0 : offsetRows, rows = rows + rowsPerPage - illusOffset, 0 > rows && crossPage()
                }(), i + 1 === pTotal && book.push(page), pagination = book.length + 1, void 0)
            })
        }

        function processContents(book, storyTotal) {
            var contents = [];
            return _.each(book, function(page, idx) {
                storyTotal > 1 ? page.info && (title = $.trim(page.info.title), contents.push({
                    pageNum: idx + 1,
                    text: title
                })) : _.each(page.paragraphs, function(p) {
                    p.klass && -1 !== _.indexOf(p.klass.split(/\s+/), "headline") && contents.push({
                        pageNum: idx + 1,
                        text: p.text.replace(tagRegex.sup.toPseudo.source, "").replace(tagRegex.em.toPseudo.source, "$1")
                    })
                }), page.title = title
            }), contents
        }
        opts = _.defaults(opts, {
            lineHeight: 32,
            pageHeight: 768
        });
        var dfd = $.Deferred(),
            lineHeight = opts.lineHeight,
            pageHeight = opts.pageHeight,
            hasFormula = opts.metadata.hasFormula,
            loadingHint = $(".loading-hint"),
            content = opts.typePage.find(".content"),
            rowsPerPage = pageHeight / lineHeight,
            headerBottomRows = 2,
            book = [],
            page = {}, pidAndPageMap = {}, pageAndOffsetRowMap = {}, title = "",
            rows = 0,
            pagination = 1,
            posts = opts.data.posts,
            gift = opts.data.gift;
        return app.pageInfo = {
            pageHeight: pageHeight
        }, isIE && hasFormula && !isMPInstalled() ? (loadingHint.remove(), content.html($("#tmpl-mathplayer-hint").html()), dfd.reject(), dfd.promise()) : (opts.data.splitCode = splitCodeLine, content.css("visibility", "hidden").html(_.template(opts.template.article, opts.data)), hasFormula ? require(["backbone", "mathjax"], function(Backbone) {
            loadingHint.remove();
            var Hub = window.MathJax.Hub;
            Backbone.history.bind("all", function(route, router, name) {
                $("#MathJax_Message").is(":visible") && "home" === name && (location.href = "/reader/")
            }), Hub.Queue(["Typeset", Hub, content[0]], [pagingAction])
        }) : /msie 10.0/i.test(navigator.userAgent) ? _.delay(pagingAction, 180) : pagingAction(), dfd.promise())
    }
    var BookContent = function(attrs) {
        _.extend(this, attrs), this.isGift() && this.addGiftContent()
    };
    _.extend(BookContent.prototype, {
        isEmpty: function() {
            return !this.body
        },
        isGift: function() {
            return !!this.gift
        },
        isPara: function(obj) {
            return "paragraph" === obj.type
        },
        addGiftContent: function() {
            var gift = (this.body, this.gift);
            return this.body.unshift({
                note: {
                    recipient: Ark.me.name,
                    words: gift.words,
                    sender: gift.sender,
                    date: gift.date
                }
            }), this
        },
        getParagraph: function(pid) {
            var paragraph, paginations = this.findPaginations(pid),
                page = this.getPage(paginations[0]),
                paragraphs = page.paragraphs;
            return paragraph = _.find(paragraphs, function(obj) {
                return obj.pid === pid
            })
        },
        getPage: function(pagination) {
            return this.body[pagination]
        },
        getPages: function(start, end) {
            return this.body.slice(start, end)
        },
        findPaginations: function(pid) {
            return this.pidAndPageMap[pid]
        },
        findPageOffsetInfo: function(pid) {
            return this.pageAndOffsetRowMap[pid]
        },
        findStampOffset: function(pid, pagination) {
            var paginations = this.findPaginations(pid);
            if (2 > paginations.length) return 0;
            var offsetRows = this.findPageOffsetInfo(pid),
                pageIndex = _.indexOf(paginations, pagination);
            return offsetRows[pageIndex]
        },
        getParasIndexs: function() {
            var parasIndexs = _.chain(this.posts).map(function(post) {
                return post.contents
            }).flatten(!0).filter(function(content) {
                return "paragraph" === content.type
            }).map(function(paragraph) {
                return paragraph.id
            }).value();
            return parasIndexs
        }
    });
    var TITLE = "h1",
        SUBTITLE = "h2",
        AUTHOR = ".orig-author",
        TRANSLATOR = ".translator",
        tagRegex = typesetting.tagRegex,
        isIE = /msie/i.test(navigator.userAgent);
    return paging
}),
 define("reader/modules/tinytips", ["jquery", "underscore", "backbone", "reader/modules/bubble"], function($, _, Backbone, Bubble) {
    var body = $("body"),
        win = $(window),
        CSS_TIPS = ".tips-outer",
        eventName = "ontouchstart" in window ? "tap.tips" : "click.tips",
        TMPL_TIPS = $.trim($("#tmpl-tips").html()),
        boundaryConf = {
            horizontal: {
                percent: [.3, .7],
                direct: ["left", "center", "right"]
            }
        }, ARROW_POS = {
            left: .1,
            center: .5,
            right: .9
        }, ARROW_HEIGHT = 10,
        defaults = {
            html: TMPL_TIPS,
            contentClass: ".footnote"
        }, TinyTips = Bubble.extend({
            _super: Bubble.prototype,
            constructor: function(opt) {
                opt = $.extend({}, defaults, opt), this.removeAll(), this.bindEvents(), this._super.constructor.call(this, opt)
            },
            _getDirection: function(target) {
                var offset = target.offset(),
                    leftPercent = offset.left / win.width(),
                    horizontalConf = (offset.top / win.height(), boundaryConf.horizontal);
                return boundaryConf.vertical, {
                    horizontal: horizontalConf.direct[_.sortedIndex(horizontalConf.percent, leftPercent)],
                    vertical: 0 > offset.top - this._node.outerHeight() - 12 ? "top" : "bottom"
                }
            },
            setPosition: function(target) {
                var tar = $(target),
                    tarOffset = tar.offset(),
                    bubbleWidth = this._node.outerWidth(),
                    position = {}, district = this._getDirection.call(this, tar);
                return position.left = tarOffset.left + tar.width() / 2 - bubbleWidth * ARROW_POS[district.horizontal], "top" === district.vertical ? position.top = tarOffset.top + ARROW_HEIGHT + tar.height() : position.bottom = win.height() - tarOffset.top + ARROW_HEIGHT, this._node[0].className = this._node[0].className.replace(/\s*arrow-\w+\s*/g, " "), this._node.removeAttr("style").addClass("arrow-" + district.vertical).addClass("arrow-" + district.horizontal).css(position), this.opt.width && this._node.width(this.opt.width), this
            },
            update: function() {
                this._super.update.apply(this, arguments), this.opt.hasFormula && window.MathJax.Hub.Typeset(this._node)
            },
            removeAll: function() {
                var tips = $(CSS_TIPS);
                tips.length && tips.remove()
            },
            destroy: function() {
                var self = this;
                this._node.fadeOut(200, function() {
                    self._super.destroy.apply(this, arguments)
                })
            },
            bindEvents: function() {
                var self = this;
                body.on(eventName, function(e) {
                    e.target.tagName !== self._config.target[0].tagName && self.destroy()
                })
            }
        });
    return TinyTips
}),
 define("reader/modules/split_to_span", ["jquery", "underscore", "reader/modules/typesetting"], function($, _, typesetting) {
    function splitToSpan(text) {
        var fragment = $("<div>").html(text),
            offset = 0;
        return getChildSplitText(fragment[0], offset).html
    }

    function getChildSplitText(root, offset) {
        for (var node, textLength, text, textNode, ret = "", result = {}, nodes = root.childNodes, length = nodes.length, index = 0; length > index;) node = nodes[index], $.nodeName(node, "span") && rMath.test(node.className) ? (textNode = node.getElementsByTagName("script")[0], text = textNode.textContent || $.trim(textNode.innerHTML), textLength = text.length, ret += utils.makeWord(node.innerHTML, offset, textLength), index += 1, offset += textLength) : (result = splitNode(node, offset), ret += result.html, offset = result.offset, index++);
        return {
            html: ret,
            offset: offset
        }
    }

    function splitNode(n, offset) {
        var result, nodeName = n.nodeName.toLowerCase();
        if (3 === n.nodeType) return result = getSplitText(n, offset), {
            html: result.html,
            offset: result.offset
        };
        if (1 !== n.nodeType) throw "nodetype error";
        if (-1 !== _.indexOf(IGNORE_SPLIT_TAGS, nodeName)) return {
            html: n.outerHTML,
            offset: offset
        };
        if ("code" === nodeName) {
            var text = n.textContent || $.trim(n.innerHTML),
                length = text.length;
            return {
                html: utils.makeWord(n.outerHTML, offset, length),
                offset: offset + length
            }
        }
        return -1 !== _.indexOf(SPLIT_TAGS, nodeName) ? (result = getChildSplitText(n, offset), {
            html: typesetting.tagTmpls[nodeName].html({
                text: result.html
            }),
            offset: result.offset
        }) : void 0
    }

    function getSplitText(node, offset) {
        var processor = new SplitProcessor(node, offset);
        return processor.getResult()
    }
    var utils = {
        makeWord: function(html, offset, length) {
            return '<span class="word" data-length="' + length + '" data-offset="' + offset + '">' + html + "</span>"
        },
        rTwoSpanEnd: /<\/span><\/span>$/
    }, IGNORE_SPLIT_TAGS = ["sup", "wbr"],
        SPLIT_TAGS = ["em", "i", "del"],
        rMath = /mathjax-container/,
        SplitProcessor = function(node, offset) {
            this.contents = [], this.types = [], this.step = -1, this.offset = offset, this.iterator = new WordIterator(node)
        };
    SplitProcessor.prototype.doIterator = function() {
        var func = function() {
            this.generatorSpan()
        };
        return /webkit/i.test(navigator.userAgent) && (func = function() {
            this.detectChinesePunctuation(), this.generatorSpan()
        }), func
    }(), SplitProcessor.prototype.detectChinesePunctuation = function() {
        var token = this.token,
            type = token.type;
        0 > this.step && "en" !== type || (this.advanceIsWord() && this.currentIsType(["punc-not-allowed-at-end", "punc-not-allowed-start-and-end"]) && (type = "word"), 1 > this.step && this.advanceIsType("punc-not-allowed-start-and-end") || type in this.typeHandler && this.typeHandler[type].call(this))
    }, SplitProcessor.prototype.typeHandler = {
        "punc-not-allowed-at-start": function() {
            this.currentIsWord() ? this.autoWbr() : this.step >= 1 && this.currentIsType("punc-not-allowed-at-start") && this.currentIsWbred() && this.insertToPrevWbr()
        },
        "punc-not-allowed-start-and-end": function() {
            this.autoWbr()
        },
        en: function() {
            var token = this.token;
            1 >= token.word.length || (token.html = (this.currentIsType("space") ? "" : "<wbr>") + token.html.replace('class="word"', 'class="en word"'))
        },
        word: function() {
            this.autoWbr()
        },
        "punc-not-allowed-break": function() {
            this.currentIsType("punc-not-allowed-break") && this.autoWbr()
        }
    }, SplitProcessor.prototype.currentIsWord = function() {
        return this.isWord(this.types[this.step])
    }, SplitProcessor.prototype.currentIsType = function(types) {
        return this.isType(this.types[this.step], types)
    }, SplitProcessor.prototype.currentIsWbred = function() {
        return utils.rTwoSpanEnd.test(this.contents[this.step])
    }, SplitProcessor.prototype.advanceIsWord = function() {
        return this.isWord(this.token.type)
    }, SplitProcessor.prototype.advanceIsType = function(types) {
        return this.isType(this.token.type, types)
    }, SplitProcessor.prototype.isType = function(currentType, types) {
        return _.isArray(types) ? _.contains(types, currentType) : types === currentType
    }, SplitProcessor.prototype.isWord = function(type) {
        return "cjk" === type || "en" === type
    }, SplitProcessor.prototype.generatorSpan = function() {
        var token = this.token;
        this.types.push(token.type), this.contents.push(token.html), this.step++
    }, SplitProcessor.prototype.autoWbr = function() {
        "space" !== this.types[this.step] && this[this.currentIsWbred() ? "insertToPrevWbr" : "wrapWbr"]()
    }, SplitProcessor.prototype.wrapWbr = function() {
        this.contents[this.step] = '<span class="wbr">' + this.contents[this.step], this.token.html = this.token.html + "</span>"
    }, SplitProcessor.prototype.insertToPrevWbr = function() {
        this.contents[this.step] = this.contents[this.step].slice(0, -7), this.token.html += "</span>"
    }, SplitProcessor.prototype.getResult = function() {
        for (; this.iterator.hasNext();) {
            this.token = this.iterator.next();
            var word = this.token.word,
                wordLength = word.length;
            this.token.html = utils.makeWord(_.escape(word), this.offset, wordLength), this.doIterator(), this.offset += wordLength
        }
        return {
            html: this.contents.join(""),
            offset: this.offset
        }
    };
    var WordIterator = function(node) {
        this.node = node, this.current = null, this.value = node.nodeValue, this.length = node.length, this.index = 0
    };
    return _.extend(WordIterator.prototype, {
        rPuncNotAllowedAtStart: /[\!%\),\.:;\?\]\}¢°’”‟›℃∶、。》〕〗〞﹚﹜！％），．：；？］｝]/,
        rPuncNotAllowedAtEnd: /[$(£¥﹙﹛《〈「『〔〖〝＄（．［｛￡￥]/,
        rPuncNotAllowedBreak: /[—…‥]/,
        rPuncNotAllowedStartAndEnd: /[“'‘]/,
        rEnPunc: /[\x21-\x23\x25-\x2A\x2C-\x2F\x3A\x3B\x3F\x40\x5B-\x5D\x5F\x7B\x7D\xA1\xAB\xAD\xB7\xBB\xBF\u0374\u0375\u037E\u0387\u055A-\u055F\u0589\u05BE\u05C0\u05C3\u05F3\u05F4\u060C\u061B\u061F\u066A-\u066D\u06D4\u0964\u0965\u0970\u0E2F\u0E5A\u0E5B\u0EAF\u0F04-\u0F12\u0F3A-\u0F3D\u0F85\u10FB\u2010-\u2027\u2030-\u2043\u2045\u2046\u207D\u207E\u208D\u208E\u2329\u232A\u3001-\u3003\u3006\u3008-\u3011\u3014-\u301F\u3030\u30FB\uFD3E\uFD3F\uFE30-\uFE44\uFE49-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF61-\uFF65]/,
        hasNext: function() {
            return this.index < this.length
        },
        next: function() {
            var result = this.getWholeWord(),
                word = result[0],
                type = result[1];
            return this.index += word.length, this.current = {
                word: word,
                type: type
            }, this.current
        }
    }), WordIterator.prototype.getWholeWord = function() {
        var str = this.value,
            i = this.index,
            code = str.charCodeAt(i),
            character = str.charAt(i),
            ret = "";
        if (isNaN(code)) return [];
        if (32 === code) {
            do ret += str.charAt(i++); while (32 === str.charCodeAt(i));
            return [ret, "space"]
        }
        if (this.rPuncNotAllowedAtStart.test(character)) return [character, "punc-not-allowed-at-start"];
        if (this.rPuncNotAllowedAtEnd.test(character)) return [character, "punc-not-allowed-at-end"];
        if (this.rPuncNotAllowedBreak.test(character)) return [character, "punc-not-allowed-break"];
        if (this.rPuncNotAllowedStartAndEnd.test(character)) return [character, "punc-not-allowed-start-and-end"];
        if (code >= 33 && 591 >= code || this.rEnPunc.test(str.charAt(i))) {
            var currCharCode = code,
                currChar = character;
            do ret += currChar, currChar = str.charAt(++i), currCharCode = str.charCodeAt(i); while (currCharCode >= 33 && 591 >= currCharCode || this.rEnPunc.test(currChar));
            return [ret, "en"]
        }
        if (55296 > code || code > 57343) return [character, "cjk"];
        if (code >= 55296 && 56319 >= code) {
            if (i + 1 >= str.length) throw "High surrogate without following low surrogate";
            var next = str.charCodeAt(i + 1);
            if (56320 > next || next > 57343) throw "High surrogate without following low surrogate";
            return [character + str.charAt(i + 1), "cjk"]
        }
        if (0 === i) throw "Low surrogate without preceding high surrogate";
        var prev = str.charCodeAt(i - 1);
        if (55296 > prev || prev > 56319) throw "Low surrogate without preceding high surrogate";
        return []
    }, splitToSpan
}),
 define("reader/views/reading/modules/build_line_info", ["jquery", "underscore"], function($, _) {
    function buildLineInfo(para, rawPara) {
        function makeNewLine(el, startInfo, lineBreak) {
            start = startInfo, info.lines[++lineIndex] = [], info.index.top[lineIndex] = start.top, info.index.bottom[lineIndex] = start.bottom, info.index.offset[lineIndex] = +el.getAttribute("data-offset"), lineBreak && (info.index.lineBreak[lineIndex] = !0)
        }

        function crossLine(el, rawWord, rects) {
            _.each(rects, function(rect, idx) {
                var spanInfo = {
                    top: rect.top - paraBCR.top,
                    left: rect.left - paraBCR.left,
                    width: rect.width,
                    height: rect.height,
                    span: rawWord,
                    lineBreak: !0
                };
                if (!start || start.bottom < spanInfo.top) {
                    var startInfo = {
                        top: spanInfo.top,
                        bottom: spanInfo.top + spanInfo.height
                    };
                    makeNewLine(el, startInfo, idx > 0)
                }
                var lineContainer = info.lines[lineIndex];
                lineContainer.push(spanInfo)
            })
        }
        rawPara = rawPara ? rawPara : para;
        var info, paraDom = para[0],
            paraTop = paraDom.offsetTop,
            paraLeft = paraDom.offsetLeft,
            paraWidth = paraDom.offsetWidth,
            paraHeight = paraDom.offsetHeight,
            words = para.find(".word"),
            rawWords = rawPara ? rawPara.find(".word") : words,
            paraBCR = para[0].getBoundingClientRect();
        info = {
            lines: [],
            index: {
                top: [],
                bottom: [],
                offset: [],
                lineBreak: {}
            },
            height: paraHeight,
            width: paraWidth
        };
        var start, lineIndex = -1;
        return words.each(function(index) {
            var el = this,
                top = el.offsetTop - paraTop,
                left = el.offsetLeft - paraLeft,
                bottom = top + el.offsetHeight,
                width = el.offsetWidth,
                height = el.offsetHeight,
                rects = el.getClientRects();
            if (rects.length > 1) return crossLine(el, rawWords[index], rects);
            if (!start || top > start.bottom) {
                var startInfo = {
                    top: top,
                    bottom: top + height
                };
                makeNewLine(el, startInfo)
            }
            start.top > top ? start.top = top : bottom > start.bottom && (start.bottom = bottom);
            var lineContainer = info.lines[lineIndex],
                spanInfo = {
                    top: top,
                    left: left,
                    width: width,
                    height: height,
                    span: rawWords[index]
                };
            lineContainer.push(spanInfo)
        }), info
    }
    return function(para) {
        var info = para.data("info");
        if (info) return info;
        var fakePara = para.clone(),
            container = $("<div>", {
                "class": "build-line-info-container is-annotation-enabled"
            }),
            paraContainer = $("<div>", {
                "class": "content"
            });
        return container.append(paraContainer).appendTo("body"), paraContainer.html(fakePara), info = buildLineInfo(fakePara, para), container.remove(), para.data("info", info), info
    }
}),
 define("reader/views/reading/tips/note_form", ["jquery", "backbone", "underscore", "reader/modules/form_util"], function($, Backbone, _, FormUtil) {
    var NoteForm = Backbone.View.extend({
        tmplHTML: $("#tmpl-selection-tip-note-form").html(),
        tagName: "form",
        className: "note-form",
        initialize: function(options) {
            this.model = options.model, this.addNote = options.addNote, this.cancelForm = options.onCancel, this.content = options.content || ""
        },
        events: {
            submit: "submitNoteForm",
            "click .ln-cancel": "cancelForm"
        },
        render: function() {
            return this.$el.html(_.template(this.tmplHTML, {
                content: this.content
            })), FormUtil.ctrlEnterForm(this.$el), this
        },
        submitNoteForm: function(e) {
            e.preventDefault();
            var form = $(e.target),
                note = this.parseText(form.find("textarea[name=text]").val());
            return note ? (this.addNote(note), void 0) : (alert("请填写批注内容"), void 0)
        },
        parseText: function(text) {
            return $.trim(text).replace(/\n/g, " ")
        }
    });
    return NoteForm
}),
/*!
 * zeroclipboard
 * The Zero Clipboard library provides an easy way to copy text to the clipboard using an invisible Adobe Flash movie, and a JavaScript interface.
 * Copyright 2012 Jon Rohan, James M. Greene, .
 * Released under the MIT license
 * http://jonrohan.github.com/ZeroClipboard/
 * v1.1.7
 */

function() {
    "use strict";
    var currentElement, _getStyle = function(el, prop) {
            var y = el.style[prop];
            if (el.currentStyle ? y = el.currentStyle[prop] : window.getComputedStyle && (y = document.defaultView.getComputedStyle(el, null).getPropertyValue(prop)), "auto" == y && "cursor" == prop)
                for (var possiblePointers = ["a"], i = 0; possiblePointers.length > i; i++)
                    if (el.tagName.toLowerCase() == possiblePointers[i]) return "pointer";
            return y
        }, _elementMouseOver = function(event) {
            if (ZeroClipboard.prototype._singleton) {
                event || (event = window.event);
                var target;
                this !== window ? target = this : event.target ? target = event.target : event.srcElement && (target = event.srcElement), ZeroClipboard.prototype._singleton.setCurrent(target)
            }
        }, _addEventHandler = function(element, method, func) {
            element.addEventListener ? element.addEventListener(method, func, !1) : element.attachEvent && element.attachEvent("on" + method, func)
        }, _removeEventHandler = function(element, method, func) {
            element.removeEventListener ? element.removeEventListener(method, func, !1) : element.detachEvent && element.detachEvent("on" + method, func)
        }, _addClass = function(element, value) {
            if (element.addClass) return element.addClass(value), element;
            if (value && "string" == typeof value) {
                var classNames = (value || "").split(/\s+/);
                if (1 === element.nodeType)
                    if (element.className) {
                        for (var className = " " + element.className + " ", setClass = element.className, c = 0, cl = classNames.length; cl > c; c++) 0 > className.indexOf(" " + classNames[c] + " ") && (setClass += " " + classNames[c]);
                        element.className = setClass.replace(/^\s+|\s+$/g, "")
                    } else element.className = value
            }
            return element
        }, _removeClass = function(element, value) {
            if (element.removeClass) return element.removeClass(value), element;
            if (value && "string" == typeof value || void 0 === value) {
                var classNames = (value || "").split(/\s+/);
                if (1 === element.nodeType && element.className)
                    if (value) {
                        for (var className = (" " + element.className + " ").replace(/[\n\t]/g, " "), c = 0, cl = classNames.length; cl > c; c++) className = className.replace(" " + classNames[c] + " ", " ");
                        element.className = className.replace(/^\s+|\s+$/g, "")
                    } else element.className = ""
            }
            return element
        }, _getDOMObjectPosition = function(obj) {
            var info = {
                left: 0,
                top: 0,
                width: obj.width || obj.offsetWidth || 0,
                height: obj.height || obj.offsetHeight || 0,
                zIndex: 9999
            }, zi = _getStyle(obj, "zIndex");
            for (zi && "auto" != zi && (info.zIndex = parseInt(zi, 10)); obj;) {
                var borderLeftWidth = parseInt(_getStyle(obj, "borderLeftWidth"), 10),
                    borderTopWidth = parseInt(_getStyle(obj, "borderTopWidth"), 10);
                info.left += isNaN(obj.offsetLeft) ? 0 : obj.offsetLeft, info.left += isNaN(borderLeftWidth) ? 0 : borderLeftWidth, info.top += isNaN(obj.offsetTop) ? 0 : obj.offsetTop, info.top += isNaN(borderTopWidth) ? 0 : borderTopWidth, obj = obj.offsetParent
            }
            return info
        }, _noCache = function(path) {
            var client = ZeroClipboard.prototype._singleton;
            return client.options.useNoCache ? (path.indexOf("?") >= 0 ? "&nocache=" : "?nocache=") + (new Date).getTime() : ""
        }, _vars = function(options) {
            var str = [];
            return options.trustedDomains && ("string" == typeof options.trustedDomains ? str.push("trustedDomain=" + options.trustedDomains) : str.push("trustedDomain=" + options.trustedDomains.join(","))), str.join("&")
        }, _inArray = function(elem, array) {
            if (array.indexOf) return array.indexOf(elem);
            for (var i = 0, length = array.length; length > i; i++)
                if (array[i] === elem) return i;
            return -1
        }, _prepGlue = function(elements) {
            if ("string" == typeof elements) throw new TypeError("ZeroClipboard doesn't accept query strings.");
            return elements.length ? elements : [elements]
        }, ZeroClipboard = function(elements, options) {
            if (elements && (ZeroClipboard.prototype._singleton || this).glue(elements), ZeroClipboard.prototype._singleton) return ZeroClipboard.prototype._singleton;
            ZeroClipboard.prototype._singleton = this, this.options = {};
            for (var kd in _defaults) this.options[kd] = _defaults[kd];
            for (var ko in options) this.options[ko] = options[ko];
            this.handlers = {}, ZeroClipboard.detectFlashSupport() && _bridge()
        }, gluedElements = [];
    ZeroClipboard.prototype.setCurrent = function(element) {
        currentElement = element, this.reposition(), element.getAttribute("title") && this.setTitle(element.getAttribute("title")), this.setHandCursor("pointer" == _getStyle(element, "cursor"))
    }, ZeroClipboard.prototype.setText = function(newText) {
        newText && "" !== newText && (this.options.text = newText, this.ready() && this.flashBridge.setText(newText))
    }, ZeroClipboard.prototype.setTitle = function(newTitle) {
        newTitle && "" !== newTitle && this.htmlBridge.setAttribute("title", newTitle)
    }, ZeroClipboard.prototype.setSize = function(width, height) {
        this.ready() && this.flashBridge.setSize(width, height)
    }, ZeroClipboard.prototype.setHandCursor = function(enabled) {
        this.ready() && this.flashBridge.setHandCursor(enabled)
    }, ZeroClipboard.version = "1.1.7";
    var _defaults = {
        moviePath: "ZeroClipboard.swf",
        trustedDomains: null,
        text: null,
        hoverClass: "zeroclipboard-is-hover",
        activeClass: "zeroclipboard-is-active",
        allowScriptAccess: "sameDomain",
        useNoCache: !0
    };
    ZeroClipboard.setDefaults = function(options) {
        for (var ko in options) _defaults[ko] = options[ko]
    }, ZeroClipboard.destroy = function() {
        ZeroClipboard.prototype._singleton.unglue(gluedElements);
        var bridge = ZeroClipboard.prototype._singleton.htmlBridge;
        bridge.parentNode.removeChild(bridge), delete ZeroClipboard.prototype._singleton
    }, ZeroClipboard.detectFlashSupport = function() {
        var hasFlash = !1;
        if ("function" == typeof ActiveXObject) try {
            new ActiveXObject("ShockwaveFlash.ShockwaveFlash") && (hasFlash = !0)
        } catch (error) {}
        return !hasFlash && navigator.mimeTypes["application/x-shockwave-flash"] && (hasFlash = !0), hasFlash
    };
    var _bridge = function() {
        var client = ZeroClipboard.prototype._singleton,
            container = document.getElementById("global-zeroclipboard-html-bridge");
        if (!container) {
            var html = '      <object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" id="global-zeroclipboard-flash-bridge" width="100%" height="100%">         <param name="movie" value="' + client.options.moviePath + _noCache(client.options.moviePath) + '"/>         <param name="allowScriptAccess" value="' + client.options.allowScriptAccess + '"/>         <param name="scale" value="exactfit"/>         <param name="loop" value="false"/>         <param name="menu" value="false"/>         <param name="quality" value="best" />         <param name="bgcolor" value="#ffffff"/>         <param name="wmode" value="transparent"/>         <param name="flashvars" value="' + _vars(client.options) + '"/>         <embed src="' + client.options.moviePath + _noCache(client.options.moviePath) + '"           loop="false" menu="false"           quality="best" bgcolor="#ffffff"           width="100%" height="100%"           name="global-zeroclipboard-flash-bridge"           allowScriptAccess="always"           allowFullScreen="false"           type="application/x-shockwave-flash"           wmode="transparent"           pluginspage="http://www.macromedia.com/go/getflashplayer"           flashvars="' + _vars(client.options) + '"           scale="exactfit">         </embed>       </object>';
            container = document.createElement("div"), container.id = "global-zeroclipboard-html-bridge", container.setAttribute("class", "global-zeroclipboard-container"), container.setAttribute("data-clipboard-ready", !1), container.style.position = "absolute", container.style.left = "-9999px", container.style.top = "-9999px", container.style.width = "15px", container.style.height = "15px", container.style.zIndex = "9999", container.innerHTML = html, document.body.appendChild(container)
        }
        client.htmlBridge = container, client.flashBridge = document["global-zeroclipboard-flash-bridge"] || container.children[0].lastElementChild
    };
    ZeroClipboard.prototype.resetBridge = function() {
        this.htmlBridge.style.left = "-9999px", this.htmlBridge.style.top = "-9999px", this.htmlBridge.removeAttribute("title"), this.htmlBridge.removeAttribute("data-clipboard-text"), _removeClass(currentElement, this.options.activeClass), currentElement = null, this.options.text = null
    }, ZeroClipboard.prototype.ready = function() {
        var ready = this.htmlBridge.getAttribute("data-clipboard-ready");
        return "true" === ready || ready === !0
    }, ZeroClipboard.prototype.reposition = function() {
        if (!currentElement) return !1;
        var pos = _getDOMObjectPosition(currentElement);
        this.htmlBridge.style.top = pos.top + "px", this.htmlBridge.style.left = pos.left + "px", this.htmlBridge.style.width = pos.width + "px", this.htmlBridge.style.height = pos.height + "px", this.htmlBridge.style.zIndex = pos.zIndex + 1, this.setSize(pos.width, pos.height)
    }, ZeroClipboard.dispatch = function(eventName, args) {
        ZeroClipboard.prototype._singleton.receiveEvent(eventName, args)
    }, ZeroClipboard.prototype.on = function(eventName, func) {
        for (var events = ("" + eventName).split(/\s/g), i = 0; events.length > i; i++) eventName = events[i].toLowerCase().replace(/^on/, ""), this.handlers[eventName] || (this.handlers[eventName] = func);
        this.handlers.noflash && !ZeroClipboard.detectFlashSupport() && this.receiveEvent("onNoFlash", null)
    }, ZeroClipboard.prototype.addEventListener = ZeroClipboard.prototype.on, ZeroClipboard.prototype.off = function(eventName, func) {
        for (var events = ("" + eventName).split(/\s/g), i = 0; events.length > i; i++) {
            eventName = events[i].toLowerCase().replace(/^on/, "");
            for (var event in this.handlers) event === eventName && this.handlers[event] === func && delete this.handlers[event]
        }
    }, ZeroClipboard.prototype.removeEventListener = ZeroClipboard.prototype.off, ZeroClipboard.prototype.receiveEvent = function(eventName, args) {
        eventName = ("" + eventName).toLowerCase().replace(/^on/, "");
        var element = currentElement;
        switch (eventName) {
            case "load":
                if (args && 10 > parseFloat(args.flashVersion.replace(",", ".").replace(/[^0-9\.]/gi, ""))) return this.receiveEvent("onWrongFlash", {
                    flashVersion: args.flashVersion
                }), void 0;
                this.htmlBridge.setAttribute("data-clipboard-ready", !0);
                break;
            case "mouseover":
                _addClass(element, this.options.hoverClass);
                break;
            case "mouseout":
                _removeClass(element, this.options.hoverClass), this.resetBridge();
                break;
            case "mousedown":
                _addClass(element, this.options.activeClass);
                break;
            case "mouseup":
                _removeClass(element, this.options.activeClass);
                break;
            case "datarequested":
                var targetId = element.getAttribute("data-clipboard-target"),
                    targetEl = targetId ? document.getElementById(targetId) : null;
                if (targetEl) {
                    var textContent = targetEl.value || targetEl.textContent || targetEl.innerText;
                    textContent && this.setText(textContent)
                } else {
                    var defaultText = element.getAttribute("data-clipboard-text");
                    defaultText && this.setText(defaultText)
                }
                break;
            case "complete":
                this.options.text = null
        }
        if (this.handlers[eventName]) {
            var func = this.handlers[eventName];
            "function" == typeof func ? func.call(element, this, args) : "string" == typeof func && window[func].call(element, this, args)
        }
    }, ZeroClipboard.prototype.glue = function(elements) {
        elements = _prepGlue(elements);
        for (var i = 0; elements.length > i; i++) - 1 == _inArray(elements[i], gluedElements) && (gluedElements.push(elements[i]), _addEventHandler(elements[i], "mouseover", _elementMouseOver))
    }, ZeroClipboard.prototype.unglue = function(elements) {
        elements = _prepGlue(elements);
        for (var i = 0; elements.length > i; i++) {
            _removeEventHandler(elements[i], "mouseover", _elementMouseOver);
            var arrayIndex = _inArray(elements[i], gluedElements); - 1 != arrayIndex && gluedElements.splice(arrayIndex, 1)
        }
    }, "undefined" != typeof module ? module.exports = ZeroClipboard : "function" == typeof define && define.amd ? define("lib/ZeroClipboard/ZeroClipboard", function() {
        return ZeroClipboard
    }) : window.ZeroClipboard = ZeroClipboard
}(),
 define("mod/preload", ["jquery"], function($) {
    var preload = function(srcArrayOrSrc) {
        if (srcArrayOrSrc) {
            var srcArray = $.isArray(srcArrayOrSrc) ? srcArrayOrSrc : [srcArrayOrSrc];
            $.each(srcArray, function(index, src) {
                (new Image).src = src
            })
        }
    };
    return preload
}),
 define("reader/modules/create_zclipboard", ["jquery", "backbone", "underscore", "mod/preload", "lib/ZeroClipboard/ZeroClipboard"], function($, Backbone, _, preload, ZeroClipboard) {
    window.ZeroClipboard = ZeroClipboard;
    var createZClipboard = function(el) {
        var zClipSingleton = ZeroClipboard.prototype._singleton;
        zClipSingleton && zClipSingleton.htmlBridge && ZeroClipboard.destroy(), ZeroClipboard.prototype._singleton = null;
        var clip = new ZeroClipboard(el, {
            moviePath: Ark.ZeroClipboardPath,
            useNoCache: !0,
            hoverClass: "is-hover",
            activeClass: "is-active",
            allowScriptAccess: "always",
            trustedDomains: ["*"]
        });
        return clip.on("mousedown", function() {
            el.trigger("zeroclipboard-mousedown")
        }), clip.on("noflash wrongflash", function() {
            el.hide()
        }), clip.on("complete", function() {
            el.trigger("zeroclipboard-complete"), clip.reposition()
        }), clip
    };
    return window.clipboardData || preload(Ark.ZeroClipboardPath), createZClipboard
}),
 define("reader/views/reading/tips/mixins/copy_btn", ["jquery", "backbone", "underscore", "reader/modules/create_zclipboard", "reader/modules/toast"], function($, Backbone, _, createZClipboard, Toast) {
    var CopyBtnMixin = {
        createCopyBtn: function() {
            var copyBtn = this.$el.find(".copy"),
                self = this;
            return window.clipboardData ? (copyBtn.on("click", function() {
                var text = self.model.getTextFromRanges(),
                    success = window.clipboardData.setData("TEXT", text);
                Toast.toast(success ? "内容已成功复制到剪贴板" : "复制失败，浏览器禁止了复制"), self.clear()
            }), void 0) : (copyBtn.on("zeroclipboard-mousedown", _.bind(this.copyFromSelection, this)).on("zeroclipboard-complete", function() {
                Toast.toast("内容已成功复制到剪贴板"), self.clear()
            }), this.clip = createZClipboard(copyBtn), void 0)
        },
        copyFromSelection: function() {
            var text = this.model.getTextFromRanges();
            this.clip.setText(text)
        }
    };
    return CopyBtnMixin
}),
 define("reader/views/reading/tips/mixins/form_dialog", ["jquery", "backbone", "underscore", "mod/cursor"], function($, Backbone, _, cursor) {
    var FormDialogFunctions = {
        createFormDialog: function(View, options) {
            var view = new View(options);
            this.$el.html(view.render().el), this.useFormStyle();
            var textarea = this.$("textarea").focus();
            cursor.collapseToEnd(textarea[0])
        },
        useFormStyle: function() {
            this.container.setClass("textarea-tip"), this.updateTipPosition()
        },
        updateTipPosition: function() {
            var ARROW_HEIGHT = 10;
            this.container.update(ARROW_HEIGHT)
        }
    };
    return FormDialogFunctions
}),
 define("reader/views/reading/tips/debug_tip", ["jquery", "backbone", "underscore", "reader/modules/toast", "reader/modules/form_util"], function($, Backbone, _, Toast, FormUtil) {
    var DebugModel = Backbone.Model.extend({
        defaults: {
            annotation: ""
        },
        initialize: function(attrs, options) {
            this.articleId = options.articleId
        },
        url: function() {
            return "/j/article_v2/" + this.articleId + "/erratum"
        }
    }),
        DebugTip = Backbone.View.extend({
            tmpl: $("#tmpl-selection-tip-debug-form").html(),
            tagName: "form",
            className: "debug-form",
            initialize: function(options) {
                this.state = $.Deferred(), this.state.always(options.onCloseTip)
            },
            events: {
                submit: "submitDebugForm",
                "click .ln-cancel": "cancelForm"
            },
            cancelForm: function(e) {
                e.preventDefault(), this.state.reject()
            },
            submitDebugForm: function(e) {
                e.preventDefault();
                var form = $(e.target),
                    note = form.find("textarea[name=text]").val(),
                    debugAnnotation = this.model.toJSON();
                debugAnnotation.note = note;
                var formModel = new DebugModel({
                    annotation: JSON.stringify(debugAnnotation)
                }, {
                    articleId: this.model.articleId
                });
                formModel.save({}, {
                    success: function() {
                        Toast.toast("非常感谢！纠错意见已成功发送")
                    },
                    error: function() {
                        Toast.toast("纠错失败")
                    }
                }), this.state.resolve()
            },
            render: function() {
                return this.$el.html(_.template(this.tmpl, {
                    text: $.trim(this.model.getTextFromRanges())
                })), FormUtil.ctrlEnterForm(this.$el), this
            }
        });
    return DebugTip
}),
 define("reader/views/reading/tips/btns_tip", ["jquery", "backbone", "underscore", "reader/views/reading/tips/debug_tip", "reader/views/reading/tips/sharing_tip", "reader/views/reading/tips/mixins/form_dialog", "reader/views/reading/tips/mixins/copy_btn"], function($, Backbone, _, DebugForm, SharingForm, FormDialogFunctions, CopyBtnMixin) {
    var BtnsTip = Backbone.View.extend({
        className: "action-list",
        tagName: "ul",
        tmplButton: _.template('<li><button class="{{=klass}}">{{=name}}</button>'),
        btns: {
            underline: "划线",
            del: "取消划线",
            note: "批注",
            sharing: "分享",
            debug: "纠错",
            copy: "复制"
        },
        events: {
            "click .underline": "underline",
            "click .note": "note",
            "click .debug": "debug",
            "click .sharing": "sharing",
            "click .del": "del"
        },
        initialize: function(options) {
            this.btnList = options.btnList, this.container = options.container
        },
        render: function() {
            var tmpl = this.tmplButton,
                btns = this.btns,
                self = this;
            return _.each(this.btnList, function(name) {
                self.$el.append(tmpl({
                    klass: name,
                    name: btns[name]
                }))
            }), this.createCopyBtn(), this
        },
        underline: $.noop,
        del: $.noop,
        sharing: function() {
            this.createFormDialog(SharingForm, {
                model: this.model,
                onCloseTip: _.bind(this.clear, this),
                url: "/j/share/rec_works_piece",
                extraParam: {
                    annotation: JSON.stringify(this.model.toJSON()),
                    works_id: this.model.articleId
                }
            })
        },
        debug: function() {
            this.createFormDialog(DebugForm, {
                model: this.model,
                onCloseTip: _.bind(this.clear, this)
            })
        },
        note: $.noop,
        clear: function() {
            this.container.hide()
        }
    });
    return _.extend(BtnsTip.prototype, FormDialogFunctions, CopyBtnMixin), BtnsTip
}),
 define("reader/views/reading/tips/underline_btns", ["jquery", "backbone", "underscore", "reader/app", "reader/views/reading/tips/btns_tip", "reader/views/reading/tips/note_form", "reader/modules/open_login_and_signup"], function($, Backbone, _, app, BtnsTip, NoteForm, openLoginAndSignup) {
    var anonymousOpenLoginDialog = function() {
        openLoginAndSignup(), this.clear()
    }, AnonymousMixin = Ark.me.isAnonymous ? {
            debug: anonymousOpenLoginDialog,
            sharing: anonymousOpenLoginDialog
        } : {}, UnderlineBtns = BtnsTip.extend({
            del: function() {
                this.model.destroy(), this.clear()
            },
            note: function() {
                var self = this;
                this.createFormDialog(NoteForm, {
                    model: this.model,
                    addNote: function(note) {
                        var noteModelJSON = self.model.omit("id"),
                            collection = app.model.book.markings;
                        _.extend(noteModelJSON, {
                            note: note,
                            type: "note"
                        }), collection.add(noteModelJSON), self.clear()
                    },
                    onCancel: function(e) {
                        e.preventDefault(), self.clear()
                    }
                })
            }
        });
    return _.extend(UnderlineBtns.prototype, AnonymousMixin), UnderlineBtns
}),
 define("reader/views/reading/modules/find_span_info", ["jquery"], function($) {
    function findSpanInfo(line, targetOffset, isPreOffset) {
        for (var info, trailingIdx, offset, span, i = 0, len = line.length; len > i; ++i) {
            if (span = $(line[i].span), offset = span.data("offset"), isPreOffset || (offset += span.data("length") - 1), offset > targetOffset) {
                if (0 === i) break;
                trailingIdx = i
            }
            if (offset === targetOffset) {
                info = line[i];
                break
            }
        }
        return info ? info : trailingIdx ? line[trailingIdx - 1] : !1
    }
    return findSpanInfo
}),
 define("reader/views/reading/mixins/plot_marking", ["jquery", "backbone", "underscore", "reader/app", "reader/views/reading/modules/build_line_info", "reader/views/reading/modules/find_span_info"], function($, Backbone, _, app, buildLineInfoFromPara, findSpanInfo) {
    var hightlightPara = {
        plotRange: function(ranges, paragraphs, type) {
            var doms = $();
            return _.each(ranges, function(range, pid) {
                if (pid in paragraphs) {
                    var para = this.paragraphs[pid],
                        text = $.trim(para.text());
                    if (!text.length || para.is(".headline")) return;
                    var dom = this.plotPara(para, range.start, range.end, type);
                    doms = doms.add(dom)
                }
            }, this), doms
        },
        plotPara: function(para, start, end, type) {
            start = start || 0;
            for (var lines, paraInfo = buildLineInfoFromPara(para), lineIds = [], offsets = paraInfo.index.offset, i = 0, offset = offsets[i], nextOffset = offsets[i + 1]; !_.isUndefined(nextOffset) && start >= nextOffset;) {
                if (i += 1, start === nextOffset) {
                    paraInfo.index.lineBreak[i] && lineIds.push(i - 1);
                    break
                }
                offset = nextOffset, nextOffset = offsets[i + 1]
            }
            do lineIds.push(i), offset = nextOffset, nextOffset = offsets[++i]; while (!_.isUndefined(nextOffset) && (end >= nextOffset || !isFinite(end)));
            var linesInfo = {};
            linesInfo[lineIds[0]] = {
                start: start
            };
            var lastLine = lineIds[lineIds.length - 1];
            return linesInfo[lastLine] = _.extend(linesInfo[lastLine] || {}, {
                end: end
            }), _.each(lineIds, function(lineId) {
                var startSpanInfo, endSpanInfo, line = paraInfo.lines[lineId],
                    info = linesInfo[lineId];
                info && (_.isUndefined(info.start) || (startSpanInfo = findSpanInfo(line, start, !0)), _.isUndefined(info.end) || (endSpanInfo = findSpanInfo(line, end)));
                var lineBox = this.plotLine(para, line, type, startSpanInfo, endSpanInfo);
                lines = lines ? lines.add(lineBox) : lineBox
            }, this), lines
        },
        plotLine: function(para, line, type, startInfo, endInfo) {
            startInfo || (startInfo = _.first(line)), endInfo || (endInfo = _.last(line));
            var top = startInfo.top + para[0].offsetTop,
                height = startInfo.height,
                left = startInfo.left,
                width = endInfo.left + endInfo.width - left;
            return this.drawBox(top, left, height, width).addClass(type)
        },
        drawBox: function(top, left, height, width) {
            return 0 > top || top + height > app.pageInfo.pageHeight ? $() : $("<div></div>", {
                "class": "marking",
                css: {
                    top: top,
                    left: left + 1,
                    height: height,
                    width: width - 1
                }
            })
        }
    };
    return hightlightPara
}),
 define("reader/views/reading/marking/underline", ["jquery", "backbone", "underscore", "reader/views/reading/mixins/plot_marking", "reader/views/reading/tips/underline_btns", "reader/modules/open_login_and_signup"], function($, Backbone, _, plotMarking, UnderlineBtns, openLoginAndSignup) {
    var AnonymousMixin = Ark.me.isAnonymous ? {
        setMarkingTips: function() {
            openLoginAndSignup()
        }
    } : {}, Underline = Backbone.View.extend({
            className: "underline",
            events: {
                click: "clickOnLine",
                mousedown: "fireMouseDownUnderMark"
            },
            initialize: function(opt) {
                this.paragraphs = opt.paragraphs, this.markingTips = opt.markingTips, this.listenTo(this.model, "change", this.render)
            },
            render: function() {
                return this.$el.empty(), this.$el.append(this.plotRange(this.model.getRanges(), this.paragraphs, "underline")), this
            },
            fireMouseDownUnderMark: function(e) {
                this.$el.hide(), this.fireMouseEvent(document.elementFromPoint(e.clientX, e.clientY), e), this.$el.show()
            },
            fireMouseEvent: function(obj, evt) {
                var evtObj, fireOnThis = obj;
                document.createEvent ? (evtObj = document.createEvent("MouseEvents"), evtObj.initMouseEvent(evt.type, !0, !0, window, evt.detail, evt.screenX, evt.screenY, evt.clientX, evt.clientY, evt.ctrlKey, evt.altKey, evt.shiftKey, evt.metaKey, evt.button, null), fireOnThis.dispatchEvent(evtObj)) : document.createEventObject && (evtObj = document.createEventObject(), fireOnThis.fireEvent("on" + evt.type, evtObj))
            },
            clickOnLine: function(e) {
                e.stopPropagation();
                var marking = $(e.target);
                this.setMarkingTips({
                    left: e.pageX,
                    top: marking.offset().top
                }, ["del", "note", "sharing", "copy", "debug"])
            },
            setMarkingTips: function(point, actions) {
                var btns = new UnderlineBtns({
                    model: this.model,
                    btnList: actions,
                    container: this.markingTips
                });
                this.markingTips.set({
                    target: point,
                    className: "btns-tip",
                    content: btns.render().el
                }).show()
            }
        });
    return _.extend(Underline.prototype, plotMarking, AnonymousMixin), Underline
}),
 define("reader/views/reading/marking/others_underline", ["underscore", "reader/views/reading/marking/underline"], function(_, UnderlineView) {
    var OthersUnderlineView = UnderlineView.extend({
        render: function() {
            this.$el.empty(), this.$el.append(this.plotRange(this.model.getRanges(), this.paragraphs, "others-underline"));
            var lines = this.$(".others-underline"),
                model = this.model;
            return _.delay(function() {
                lines.css("opacity", "0")
            }, 3e3), _.delay(function() {
                model.destroy()
            }, 5e3), this
        },
        clickOnLine: function(e) {
            e.stopPropagation()
        }
    });
    return OthersUnderlineView
}),
 define("reader/views/reading/tips/note_display", ["jquery", "backbone", "underscore", "reader/views/reading/tips/sharing_tip", "reader/views/reading/tips/note_form", "reader/views/reading/tips/mixins/form_dialog"], function($, Backbone, _, SharingForm, NoteForm, FormDialogFunctions) {
    var NoteDisplay = Backbone.View.extend({
        tmpl: $("#tmpl-note-display").html(),
        className: "note-display",
        initialize: function(options) {
            this.container = this.markingTips = options.markingTips, this.notes = options.notes
        },
        events: {
            "click .share": "shareNote",
            "click .edit": "editNote",
            "click .delete": "deleteNote",
            "click .pagination a": "turnPage"
        },
        render: function() {
            return this.renderNote(0), this
        },
        renderNote: function(idx) {
            var note = this.notes[idx],
                len = this.notes.length;
            this.$el.html(_.template(this.tmpl, {
                content: note.model.toJSON().note,
                current: idx + 1,
                total: len
            })), 0 === idx && this.$(".prev").addClass("disabled"), idx === len - 1 && this.$(".next").addClass("disabled"), note.model.trigger("note:renderline"), this.markingTips.vent.once("hide", function() {
                note.model.trigger("note:removeline")
            }, this), this.currentIdx = idx, this.trigger("renderNote")
        },
        shareNote: function(e) {
            e.preventDefault();
            var model = this.getCurrentModel();
            this.createFormDialog(SharingForm, {
                model: this.getCurrentModel(),
                onCloseTip: _.bind(function() {
                    this.markingTips.hide()
                }, this),
                url: "/j/share/rec_annotation",
                extraParam: {
                    annotation_id: model.get("id"),
                    works_id: model.articleId
                }
            })
        },
        editNote: function(e) {
            e.preventDefault();
            var self = this,
                model = this.getCurrentModel();
            this.createFormDialog(NoteForm, {
                model: model,
                content: model.get("note"),
                addNote: function(note) {
                    model.set("note", note), self.markingTips.hide()
                },
                onCancel: function(e) {
                    e.preventDefault(), self.markingTips.hide()
                }
            })
        },
        deleteNote: function(e) {
            e.preventDefault();
            var cfm = confirm("真的要删除这条批注吗？");
            cfm && (this.markingTips.hide(), 0 === this.currentIdx && this.notes.length > 1 && this.notes[1].takeOverDot(), this.getCurrentModel().destroy(), this.notes.splice(this.currentIdx, 1))
        },
        turnPage: function(e) {
            e.preventDefault();
            var tar = $(e.currentTarget),
                isPrev = tar.hasClass("prev");
            tar.hasClass("disabled") || (this.getCurrentNote().removeLine(), this.renderNote(isPrev ? this.currentIdx - 1 : this.currentIdx + 1))
        },
        getCurrentNote: function() {
            return this.notes[this.currentIdx || 0]
        },
        getCurrentModel: function() {
            return this.getCurrentNote().model
        }
    });
    return _.extend(NoteDisplay.prototype, FormDialogFunctions), NoteDisplay
}),
 define("reader/views/reading/marking/note", ["jquery", "backbone", "underscore", "reader/app", "reader/views/reading/tips/note_display", "reader/views/reading/modules/build_line_info", "reader/views/reading/modules/find_span_info", "reader/views/reading/mixins/plot_marking"], function($, Backbone, _, app, NoteDisplay, buildLineInfoFromPara, findSpanInfo, plotMarking) {
    var Note = Backbone.View.extend({
        className: "note",
        initialize: function(opt) {
            this.paragraphs = opt.paragraphs, this.markingTips = opt.markingTips, this.markingManager = opt.markingManager, this.listenTo(this.model, "note:renderline", this.renderLine), this.listenTo(this.model, "note:removeline", this.removeLine)
        },
        render: function() {
            var pid = this.model.get("endContainerId"),
                endOffset = this.model.get("endOffset");
            if (pid in this.paragraphs) {
                for (var spanInfo, para = this.paragraphs[pid], info = buildLineInfoFromPara(para), lines = info.lines, i = 0, len = lines.length; len > i && !(spanInfo = findSpanInfo(lines[i], endOffset)); ++i);
                i >= len && (i = len - 1), spanInfo || (spanInfo = _.last(lines[i]));
                var topOffsetFix = lines[i][0].height - 18;
                this._renderDot(para, spanInfo, topOffsetFix)
            }
            return this
        },
        _renderDot: function(para, spanInfo, topOffsetFix) {
            var span = $(spanInfo.span),
                cachedDot = span.data("note-dot");
            if (cachedDot) return this._assignNote(cachedDot), void 0;
            var topOffset = spanInfo.top + para[0].offsetTop;
            if (!(0 > topOffset || topOffset > app.pageInfo.pageHeight)) {
                topOffset += topOffsetFix;
                var dotStyle = {
                    height: 10,
                    width: 10
                }, dotCss = {
                        top: topOffset - dotStyle.height,
                        left: spanInfo.left + (spanInfo.width - dotStyle.width) / 2
                    }, dotDom = $("<div></div>", {
                        "class": "note-dot",
                        css: dotCss
                    });
                this.$el.html(dotDom), dotDom.click(_.bind(function() {
                    var assignedNotes = dotDom.data("notes");
                    this._displayTip(dotDom, assignedNotes)
                }, this)), span.data("note-dot", dotDom), this._assignNote(dotDom)
            }
        },
        _displayTip: function(target, notes) {
            var tip = new NoteDisplay({
                markingTips: this.markingTips,
                notes: notes
            });
            this.markingTips.set({
                target: target,
                className: "btns-tip",
                content: tip.render().el
            }).setClass("note-display-tip").show(), tip.on("renderNote", function() {
                tip.updateTipPosition()
            }), tip.updateTipPosition()
        },
        renderLine: function() {
            this.removeLine(), this.underline = this.plotRange(this.model.getRanges(), this.paragraphs, "underline"), this.$el.append(this.underline), this.hideOtherLines()
        },
        removeLine: function() {
            this.underline && (this.underline.remove(), this.underline = null, this.showOtherLines())
        },
        hideOtherLines: function() {
            this.markingManager.hideAllLines(), this.underline.addClass("highlight")
        },
        showOtherLines: function() {
            this.markingManager.showAllLines()
        },
        _assignNote: function(dot) {
            this.dot = dot;
            var assignedNotes = dot.data("notes") || [];
            assignedNotes.push(this), dot.data("notes", assignedNotes)
        },
        takeOverDot: function() {
            this.$el.append(this.dot)
        }
    });
    return _.extend(Note.prototype, plotMarking), Note
}),
 define("reader/views/reading/marking/selection", ["jquery", "backbone", "underscore", "reader/views/reading/mixins/plot_marking"], function($, Backbone, _, plotMarking) {
    var Selection = Backbone.View.extend({
        className: "selection",
        initialize: function(opt) {
            this.paragraphs = opt.paragraphs, this.listenTo(this.model, "change", this.render)
        },
        render: function() {
            return this.$el.empty(), this.$el.append(this.plotRange(this.model.getRanges(), this.paragraphs, "selection")), this
        }
    });
    return _.extend(Selection.prototype, plotMarking), Selection
}),
 define("reader/views/reading/marking", ["jquery", "backbone", "underscore", "reader/views/reading/marking/underline", "reader/views/reading/marking/selection", "reader/views/reading/marking/note", "reader/views/reading/marking/others_underline"], function($, Backbone, _, UnderlineView, SelectionView, NoteView, OthersUnderlineView) {
    var ViewMap = {
        underline: UnderlineView,
        selection: SelectionView,
        note: NoteView,
        others_underline: OthersUnderlineView
    }, MarkingView = Backbone.View.extend({
            className: "page-marking-container",
            initialize: function(opt) {
                this.paragraphs = opt.paragraphs, this.markingTips = opt.markingTips, this.markingManager = opt.markingManager, this.listenTo(this.model, "change:type", this.render), this.listenTo(this.model, "destroy", this.remove)
            },
            render: function() {
                this.$el.empty();
                var innerView, type = this.model.get("type");
                return type in ViewMap && (innerView = new ViewMap[type]({
                    model: this.model,
                    paragraphs: this.paragraphs,
                    markingTips: this.markingTips,
                    markingManager: this.markingManager
                }), this.$el.append(innerView.render().el)), this
            }
        });
    return MarkingView
}),
 define("reader/models/marking", ["jquery", "backbone", "underscore"], function($, Backbone, _) {
    var Marking = Backbone.Model.extend({
        defaults: {
            note: "",
            middleContainers: [],
            startOffset: 0,
            endOffset: 1 / 0
        },
        initialize: function(attributes, options) {
            this.articleId = options.articleId || this.collection.articleId, this.paragraphsIndex = options.paragraphsIndex || this.collection.paragraphsIndex, this.on("change", function() {
                this.updateRange();
                var changedAttrs = this.changedAttributes();
                "id" in changedAttrs || "r" in changedAttrs || this.trigger("effectiveChange", this)
            }, this), _.bindAll(this, "merge", "comparePoints")
        },
        url: function() {
            return "/j/article_v2/" + this.articleId + "/annotation"
        },
        isUnderline: function() {
            return "underline" === this.get("type")
        },
        getStamp: function() {
            var stamp = {
                pid: this.get("startContainerId"),
                offset: this.get("startOffset")
            };
            return stamp
        },
        getRanges: function() {
            return this._ranges || this.updateRange(), _.clone(this._ranges)
        },
        updateRange: function() {
            var data = this.toJSON();
            this._ranges = {}, this._setUpParaData(this._ranges, data.startContainerId, {
                start: data.startOffset
            }), this._setUpParaData(this._ranges, data.endContainerId, {
                end: data.endOffset
            }), _.each(data.middleContainers.concat([data.startContainerId, data.endContainerId]), function(id) {
                this._setUpParaData(this._ranges, id, {
                    start: this.defaults.startOffset,
                    end: this.defaults.endOffset
                })
            }, this)
        },
        _setUpParaData: function(context, id, data) {
            id = "" + id, context[id] = _.defaults({}, context[id], data)
        },
        setViaPoints: function(start, end) {
            var attrs = _.clone(this.defaults);
            return _.extend(attrs, {
                startContainerId: start.containerId,
                endContainerId: end.containerId,
                startOffset: start.offset,
                endOffset: end.offset
            }), attrs.middleContainers = this.getMiddleContainers(attrs), this.set(attrs)
        },
        getPoints: function() {
            var attrs = this.toJSON();
            return {
                start: {
                    containerId: attrs.startContainerId,
                    offset: attrs.startOffset
                },
                end: {
                    containerId: attrs.endContainerId,
                    offset: attrs.endOffset
                }
            }
        },
        getMiddleContainers: function(data) {
            var startIndex = this.getCidIndex(data.startContainerId),
                endIndex = this.getCidIndex(data.endContainerId);
            return 0 > startIndex || 0 > endIndex ? [] : this.paragraphsIndex.slice(startIndex + 1, endIndex)
        },
        checkConflict: function(otherModel) {
            var thisPoints = this.getPoints(),
                otherPoints = otherModel.getPoints();
            return this.comparePoints(thisPoints.start, otherPoints.end) * this.comparePoints(thisPoints.end, otherPoints.start) > 0 ? !1 : !0
        },
        comparePoints: function(p1, p2) {
            return p1.containerId === p2.containerId ? p1.offset - p2.offset : this.getCidIndex(p1.containerId) - this.getCidIndex(p2.containerId)
        },
        getCidIndex: function(cid) {
            return _.indexOf(this.paragraphsIndex, cid)
        },
        destroy: function(options) {
            options = this._mixInData(options, {
                id: this.id
            }), Backbone.Model.prototype.destroy.call(this, options)
        },
        save: function(attributes, options) {
            var data = _.extend(this.toJSON(), attributes);
            "selection" !== data.type && "others_underline" !== data.type && (this.isNew() ? options = this._mixInData(options, {
                annotation: JSON.stringify(data)
            }) : (data.action = "update", options = this._mixInData(options, {
                annotations: JSON.stringify([data])
            })), Backbone.Model.prototype.save.call(this, attributes, options))
        },
        _mixInData: function(options, data) {
            return options = options ? _.clone(options) : {}, options.data = _.extend({}, options.data, data), options
        },
        merge: function(otherModels) {
            var startPoints = [],
                endPoints = [];
            _.each(otherModels.concat(this), function(model) {
                var points = model.getPoints();
                startPoints.push(points.start), endPoints.push(points.end)
            }), _.each(otherModels, function(model) {
                model.destroy()
            });
            var start = _.first(startPoints.sort(this.comparePoints)),
                end = _.last(endPoints.sort(this.comparePoints));
            this.setViaPoints(start, end), this.save()
        }
    }),
        mixinedMethods = {};
    mixinedMethods.getPlainText = {
        getTextFromRanges: function() {
            var text = "",
                self = this;
            return _.each(this._ranges, function(range, name) {
                var p = $("p[data-pid=" + name + "]").first();
                if (!range.start && range.end === Number.MAX_VALUE) return text += "\n" + self.getTextFromPara(p), void 0;
                var span, offset = 0;
                text && (text += "\n"), _.each(p.find(".word"), function(word) {
                    span = $(word), offset = span.data("offset"), offset >= range.start && range.end >= offset && (text += self.getTextFromPara(span))
                })
            }), text.length > 300 && (text = text.substr(0, 300) + "..."), text
        },
        getTextFromPara: function(elem) {
            var tmpElem, el = $(elem),
                mathJax = el.find(".MathJax, .MathJax_MathML");
            return mathJax.length ? (tmpElem = el.clone(), tmpElem.find(".MathJax, .MathJax_MathML").remove(), tmpElem.find("script").each(function() {
                var el = $(this);
                el.replaceWith(el.html())
            }), tmpElem.text()) : el.text()
        }
    };
    var AnonymousMixin = Ark.me.isAnonymous ? {
        save: $.noop
    } : {};
    return _.extend(Marking.prototype, mixinedMethods.getPlainText, AnonymousMixin), Marking
}),
 define("reader/views/reading/page_marking_manager", ["jquery", "backbone", "underscore", "reader/app", "reader/models/marking", "reader/views/reading/marking"], function($, Backbone, _, app, MarkingModel, MarkingView) {
    var PageMarking = Backbone.View.extend({
        className: "markings-collections",
        initialize: function(options) {
            this.collection = options.collection, this.page = options.page, this.container = options.container, this.markingTips = options.markingTips
        },
        render: function() {
            return this.$el.empty().css({
                top: -app.pageInfo.pageHeight
            }), this._renderMarkings(), this
        },
        _renderMarkings: function() {
            var fragment = document.createDocumentFragment();
            this.collection.each(function(model) {
                if (this._isMarkingInPage(model, this.page)) {
                    var el = this._getMarkingView(model);
                    fragment.appendChild(el)
                }
            }, this), this.$el.append(fragment), this.listenTo(this.collection, "add", this._addModelInView)
        },
        _addModelInView: function(model) {
            this._isMarkingInPage(model, this.page) && this.$el.append(this._getMarkingView(model))
        },
        _getMarkingView: function(model) {
            var paragraphs = {};
            return this.container.find("p[data-pid]").each(function() {
                var para = $(this);
                paragraphs["" + para.data("pid")] = para
            }), new MarkingView({
                model: model,
                paragraphs: paragraphs,
                markingTips: this.markingTips,
                markingManager: this
            }).render().el
        },
        _isMarkingInPage: function(markingModel, page) {
            var marking = markingModel.toJSON(),
                startPid = marking.startContainerId,
                endPid = marking.endContainerId,
                bookContent = app.model.content,
                startPage = _.first(bookContent.findPaginations(startPid)),
                endPage = _.last(bookContent.findPaginations(endPid)),
                pageNum = page.pagination;
            return "selection" === marking.type ? !0 : pageNum >= startPage && endPage >= pageNum ? !0 : !1
        },
        hideAllLines: function() {
            this.$el.addClass("hide-all-lines"), this.$(".highlight").removeClass("highlight")
        },
        showAllLines: function() {
            this.$el.removeClass("hide-all-lines")
        }
    });
    return PageMarking
}),
 define("reader/views/reading/article_marking_manager", ["jquery", "backbone", "underscore", "reader/app", "reader/views/reading/page_marking_manager"], function($, Backbone, _, app, PageMarkingManager) {
    var ArticleMarking = Backbone.View.extend({
        initialize: function(options) {
            this.collection = options.collection, this.markingTips = options.markingTips, this.pagesManager = options.pagesManager, this.listenTo(this.pagesManager, "page:render", function(page) {
                this.createPageMarkingManager(page)
            }, this)
        },
        createPageMarkingManager: function(page) {
            if (this.collection) {
                var markingContainer = page.$el,
                    manager = new PageMarkingManager({
                        collection: this.collection,
                        page: page,
                        container: markingContainer,
                        markingTips: this.markingTips
                    });
                return markingContainer.append(manager.render().el), manager
            }
        }
    });
    return ArticleMarking
}),
 define("reader/views/reading/tips/selection_btns", ["jquery", "backbone", "underscore", "reader/modules/toast", "reader/views/reading/tips/btns_tip", "reader/views/reading/tips/note_form"], function($, Backbone, _, Toast, BtnsTip, NoteForm) {
    var SelectionBtns = BtnsTip.extend({
        _super: BtnsTip.prototype,
        initialize: function(options) {
            this._super.initialize.call(this, options), this.selectionManager = options.selectionManager
        },
        underline: function(e) {
            e.stopPropagation(), this.selectionManager.trigger("underline"), this.clear()
        },
        del: function() {
            this.selectionManager.trigger("del"), this.clear()
        },
        note: function() {
            var self = this;
            this.createFormDialog(NoteForm, {
                model: this.model,
                addNote: function(note) {
                    self.selectionManager.convertToNote(note), self.clear()
                },
                onCancel: function(e) {
                    e.preventDefault(), self.clear()
                }
            })
        },
        clear: function() {
            this.selectionManager.trigger("clear:selection")
        }
    }),
        promptRequireLogin = function() {
            Toast.toast("请先登录哦。"), this.clear()
        }, AnonymousMixin = {};
    return Ark.me.isAnonymous && _.each(["note", "underline", "sharing", "debug"], function(methodName) {
        AnonymousMixin[methodName] = promptRequireLogin
    }), _.extend(SelectionBtns.prototype, AnonymousMixin), SelectionBtns
}),
 define("reader/views/reading/modules/find_point", ["jquery", "backbone", "underscore", "reader/views/reading/modules/build_line_info"], function($, Backbone, _, buildLineInfoFromPara) {
    var helper = {
        elementFromPoint: function(coord) {
            return $(document.elementFromPoint(coord.x, coord.y))
        },
        clientOffset: function(point) {
            var box = point[0].getBoundingClientRect();
            return {
                x: box.left,
                y: box.top
            }
        },
        isPointInsideRect: function(rect, point) {
            var x = point.x,
                y = point.y;
            return x >= rect.left && rect.right >= x && y >= rect.top && rect.bottom >= y ? !0 : void 0
        },
        moveCoordToRect: function(rect, coord) {
            var x = coord.x;
            x > rect.right ? x = rect.right - 5 : rect.left > x && (x = rect.left + 5);
            var y = coord.y;
            return rect.top > y ? y = rect.top - 5 : y > rect.bottom && (y = rect.bottom + 5), {
                x: x,
                y: y
            }
        }
    }, Finder = function(e, wrapperRect, firstPoint) {
            this.wrapperRect = wrapperRect, this.currentPointIsStart = !1, this.firstPoint = firstPoint, this.setCoord({
                x: e.clientX,
                y: e.clientY
            }), this.firstPoint ? this.find = this.findSecondPoint : (this.find = this.findFirstPoint, this.getCurrentPointIsStart = $.noop)
        }, beMinxed = {};
    return beMinxed.detectCoordFuncs = {
        isPointInsideParagraph: function() {
            var point = helper.elementFromPoint(this.coord);
            if (point.is(".marking") || point.hasClass("word") || point.hasClass("code-inline")) return !0;
            var p = point;
            return (point.is(".paragraph") || (p = point.closest(".paragraph")) && p.length > 0) && p[0].firstChild && $.trim(p.text()) ? !0 : void 0
        },
        isPointInsidePage: function() {
            return helper.isPointInsideRect(this.wrapperRect, this.coord)
        }
    }, beMinxed.manipCoordFuncs = {
        moveCoordToPage: function() {
            this.setCoord(helper.moveCoordToRect(this.wrapperRect, this.coord))
        },
        moveCoordToPara: function() {
            var currentPointIsStart = this.getCurrentPointIsStart(),
                point = this.point,
                page = point.is(".page") ? point : point.closest(".page");
            page.is(".page") && page.length || (page = $(".page").first());
            for (var paraCoord, paragraphs = page.find(".paragraph"); !paragraphs.length && (page = page[currentPointIsStart ? "next" : "prev"](".page")) && page.length;) paragraphs = page.find(".paragraph");
            do paraCoord = this.paraInSelection(page, paragraphs); while (!paraCoord && (page = page[currentPointIsStart ? "next" : "prev"](".page")) && page.length && (paragraphs = page.find(".paragraph")));
            paraCoord && this.setCoord({
                x: this.coord.x,
                y: currentPointIsStart ? paraCoord.top + 10 : paraCoord.bottom - 10
            })
        },
        paraInSelection: function(page, paragraphs) {
            var ret, currentPointIsStart = this.currentPointIsStart,
                coord = this.coord,
                pageBdRect = page.find(".bd")[0].getBoundingClientRect();
            return currentPointIsStart || (paragraphs = $(paragraphs.get().reverse())), paragraphs.each(function() {
                var offset = this.getBoundingClientRect(),
                    top = offset.top < pageBdRect.top ? pageBdRect.top : offset.top,
                    bottom = offset.bottom > pageBdRect.bottom ? pageBdRect.bottom : offset.bottom;
                return top += 1, bottom -= 1, $.trim(this.innerHTML) && (currentPointIsStart && top > coord.y || !currentPointIsStart && coord.y > bottom) ? (ret = {
                    top: top,
                    bottom: bottom
                }, !1) : void 0
            }), ret
        },
        setCoord: function(coord) {
            this.coord = coord, this.point = helper.elementFromPoint(this.coord)
        },
        getCurrentPointIsStart: function() {
            var currentPointIsStart = !1,
                coord = this.coord,
                firstPointOffset = this.firstPoint.viewportOffset;
            return (coord.y < firstPointOffset.top || coord.x < firstPointOffset.left && coord.y < this.firstPoint.point.height() + firstPointOffset.top) && (currentPointIsStart = !0), this.currentPointIsStart = currentPointIsStart, currentPointIsStart
        }
    }, beMinxed.findPointFromParaFuncs = {
        findPointFromPara: function() {
            var word = this.fetchWord();
            if (word) return word;
            var point = this.point,
                para = point.is(".paragraph") ? point : point.closest("p");
            if ($.trim(para.text()) && para.is(".paragraph") && !$.nodeName(point[0], "sup")) {
                var lineIndex, ret, info = this.buildLineInfoFromPara(para),
                    paraBCR = para[0].getBoundingClientRect(),
                    paraX = this.coord.x - paraBCR.left,
                    paraY = this.coord.y - paraBCR.top;
                $.each(info.index.top, function(index, top) {
                    if (top > paraY) {
                        var bottom = info.index.bottom[index - 1];
                        return lineIndex = bottom && bottom >= paraY ? index - 1 : index, !1
                    }
                }), _.isUndefined(lineIndex) && (lineIndex = info.lines.length - 1);
                var line = info.lines[lineIndex];
                $.each(line, function(index, span) {
                    return span.left > paraX ? (index = index > 0 ? index - 1 : index, ret = line[index], !1) : void 0
                }), _.isUndefined(ret) && (ret = line[line.length - 1]);
                var clientRect, span = ret.span;
                return this.word = $(span), clientRect = ret.lineBreak ? span.getClientRects()[0] : span.getBoundingClientRect(), this.coord = {
                    x: clientRect.left + 1,
                    y: clientRect.top + 1
                }, this.word
            }
        },
        buildLineInfoFromPara: buildLineInfoFromPara,
        getParaHeaderRect: function(paraRect, firstSpan) {
            var spanRect = firstSpan[0].getBoundingClientRect();
            return {
                top: paraRect.top,
                right: spanRect.right,
                bottom: spanRect.bottom,
                left: paraRect.left,
                height: spanRect.bottom - paraRect.top,
                width: spanRect.right - paraRect.left,
                spanBCR: spanRect
            }
        },
        getParaFooterRect: function(paraRect, lastSpan, lines) {
            var spanRect = lastSpan[0].getBoundingClientRect(),
                obj = {
                    top: spanRect.top,
                    right: paraRect.right,
                    bottom: paraRect.bottom,
                    left: spanRect.left,
                    height: spanRect.top - paraRect.bottom,
                    width: paraRect.right - spanRect.right,
                    spanBCR: spanRect
                };
            return lines.length > 1 ? (obj.top = lines[lines.length - 2].top, obj.height = obj.top - paraRect.bottom) : (obj.top = paraRect.top, obj.height = paraRect.bottom - paraRect.top), obj
        }
    }, _.extend(Finder.prototype, {
        findSecondPoint: function() {
            return this.isPointInsidePage() || this.moveCoordToPage(), this.isPointInsideParagraph() || this.moveCoordToPara(), this.findPointFromPara(), this.getFindResult()
        },
        findFirstPoint: function() {
            return this.findPointFromPara(), this.getFindResult()
        },
        getFindResult: function() {
            if (this.word) {
                var ret = {
                    word: this.word
                };
                return this.firstPoint && (ret.currentPointIsStart = this.getCurrentPointIsStart()), ret
            }
        },
        fetchWord: function() {
            var point = this.point;
            return point.hasClass("word") ? (this.word = point, this.word) : point.hasClass("code-inline") ? (this.word = point.parent(), this.word) : point.is(".marking") ? (this.word = this.getPointUnderMarking(), this.word) : void 0
        },
        getPointUnderMarking: function() {
            var ret, markings = $(),
                point = this.point;
            if (point.is(".marking")) {
                do point.hide(), markings = markings.add(point), point = helper.elementFromPoint(this.coord); while (point.is(".marking"));
                return point.hasClass("word") ? ret = point : point.hasClass("code-inline") && (ret = point.parent()), markings.show(), ret
            }
        }
    }), _.each(beMinxed, function(funcs) {
        _.extend(Finder.prototype, funcs)
    }),
    function(e, wrapperRect, firstPoint) {
        var finder = new Finder(e, wrapperRect, firstPoint);
        return finder.find()
    }
}),
 define("reader/views/reading/selection_manager", ["jquery", "backbone", "underscore", "reader/views/reading/modules/find_point", "reader/views/reading/tips/selection_btns"], function($, Backbone, _, findPoint, SelectionBtns) {
    var SelectionManager = Backbone.View.extend({
        initialize: function(options) {
            this.pages = options.pages, this.pagesManager = options.pagesManager, this.tip = options.pagesManager.markingTips, this.collection = options.collection, this.body = $("body"), this.win = $(window), this.on("clear:selection", this.clearSelection, this), this.on("underline", this.convertToUnderline), this.on("del", this.splitUnderline)
        },
        events: {
            "mousedown .paragraph": "beginSelection"
        },
        setBoxInfo: function() {
            var el = this.$el.parent(),
                box = el.offset(),
                layout = localStorage.layout || "horizontal",
                ARTICLE_PADDING = 75,
                PROGRESS_BAR_HEIGHT = 5;
            this.boxInfo = {
                top: box.top,
                left: box.left + ARTICLE_PADDING,
                right: box.left + el.innerWidth() - ARTICLE_PADDING,
                bottom: "horizontal" === layout ? box.top + el.height() - PROGRESS_BAR_HEIGHT : this.win.height()
            }
        },
        findStartPointFromEvent: function(e) {
            var point = $(e.target),
                ret = null;
            return point.hasClass("word") && (ret = point), ret
        },
        beginSelection: function(e) {
            e.preventDefault(), this.trigger("clear:selection");
            var result = findPoint(e, this.boxInfo);
            if (result) {
                var pointInfo = this.getInfoFromPoint(result.word);
                if (pointInfo) {
                    this.baseInfo = {
                        start: pointInfo,
                        end: pointInfo
                    }, this.info = this.baseInfo;
                    var body = this.body,
                        self = this,
                        createSelectionBtns = $.proxy(this.createSelectionBtns, this);
                    body.addClass("is-selecting"), body.on("onmousewheel" in document ? "mousewheel.create-selection" : "DOMMouseScroll.create-selection", function(e) {
                        e.preventDefault()
                    }), body.on("mousemove.create-selection", $.proxy(this.moveSelection, this)).on("mouseup.create-selection", function(e) {
                        body.removeClass("is-selecting"), body.off(".create-selection"), self.model ? (createSelectionBtns(e), _.defer(function() {
                            body.on("click.clear-selection", function() {
                                self.trigger("clear:selection")
                            })
                        })) : self.tip.hide()
                    })
                }
            }
        },
        createSelectionBtns: function() {
            var tip = this.tip,
                btns = ["underline", "note", "sharing", "copy", "debug"],
                pointInfo = this.secondPointInfo;
            this.checkSubset() && (btns[0] = "del");
            var view = new SelectionBtns({
                model: this.model,
                selectionManager: this,
                container: tip,
                btnList: btns
            });
            tip.set({
                target: pointInfo.point,
                content: view.render().el,
                className: "btns-tip"
            }).show()
        },
        checkSubset: function() {
            var lineModels = this.collection.filter(function(oldModel) {
                return "underline" === oldModel.get("type")
            });
            return _.any(lineModels, function(lineModel) {
                return this.checkSingleSubset(lineModel, this.model)
            }, this)
        },
        checkSingleSubset: function(lineModel, selectionModel) {
            var lineRanges = lineModel.getRanges(),
                selectionRanges = selectionModel.getRanges(),
                isSubSet = _.all(selectionRanges, function(range, pid) {
                    return pid in lineRanges ? lineRanges[pid].start <= range.start && lineRanges[pid].end >= range.end : !1
                });
            return isSubSet && (this.containerModel = lineModel), isSubSet
        },
        splitUnderline: function() {
            if (this.containerModel) {
                var containerPoints = this.containerModel.getPoints(),
                    selectionPoints = _.clone(this.info);
                containerPoints.start.containerId === selectionPoints.start.containerId && containerPoints.start.offset >= selectionPoints.start.offset ? this.containerModel.destroy() : (selectionPoints.start.offset -= 1, this.containerModel.setViaPoints(containerPoints.start, this.info.start), this.containerModel.save()), containerPoints.end.containerId === selectionPoints.end.containerId && containerPoints.end.offset <= selectionPoints.end.offset ? this.clearSelection() : (selectionPoints.end.offset += 1, this.model.setViaPoints(this.info.end, containerPoints.end), this.convertToUnderline()), this.containerModel = null
            }
        },
        moveSelection: _.throttle(function(e) {
            try {
                e.preventDefault()
            } catch (err) {}
            this.setBoxInfo();
            var result = findPoint(e, this.boxInfo, this.baseInfo.start);
            if (result && (!this.prevResultWord || this.prevResultWord !== result.word)) {
                this.prevResultWord = result.word;
                var pointInfo = this.getInfoFromPoint(result.word),
                    currentPointIsStart = result.currentPointIsStart,
                    obj = {};
                obj[currentPointIsStart ? "start" : "end"] = pointInfo, this.info = _.defaults(obj, this.baseInfo);
                var info = this.info;
                info.end.offset = info.end.offset + info.end.length - 1, this.secondPointInfo = pointInfo, this.renderSelection(this.info)
            }
        }, 10),
        getInfoFromPoint: function(point) {
            var p = point.closest("p"),
                offset = point.data("offset"),
                length = point.data("length"),
                pId = p.data("pid"),
                page = p.closest(".page"),
                pageId = page.data("pagination");
            return {
                offset: offset,
                containerId: pId,
                pageId: pageId,
                viewportOffset: point[0].getBoundingClientRect(),
                point: point,
                length: length
            }
        },
        renderSelection: function(info) {
            this.getModel(info)
        },
        clearSelection: function() {
            this.body.off(".clear-selection"), this.tip.hide(), this.model && (this.model.destroy(), this.resetModel())
        },
        resetModel: function() {
            this.model = null
        },
        getEmptyModelAttr: function() {
            return {
                middleContainers: [],
                type: "selection"
            }
        },
        getModel: function(info) {
            return this.model || (this.model = new this.collection.model({
                type: "selection"
            }, {
                articleId: this.collection.articleId,
                paragraphsIndex: this.collection.paragraphsIndex
            }), this.collection.add(this.model)), this.model.setViaPoints(info.start, info.end)
        },
        convertToNote: function(note) {
            this.model && (this.model.set({
                note: note,
                type: "note"
            }), this.resetModel())
        },
        convertToUnderline: function() {
            this.model && (this.model.set({
                type: "underline"
            }), this.resetModel())
        }
    });
    return SelectionManager
}),
 define("widget/require-cdn", ["jquery", "underscore"], function($, _) {
    function RequireCdn(opts) {
        this.opts = _.defaults(opts, defaultOpts)
    }
    var mods = {}, r = require,
        defaultOpts = {
            nameToUrl: function(name) {
                return "http://img3.douban.com/" + name + ".js"
            }
        };
    return _.extend(RequireCdn.prototype, {
        r: function(mod, callback, opts) {
            if (opts = opts || {}, _.defaults(opts, this.opts), !(mod in mods)) {
                var modUrl = mods[mod] = opts.nameToUrl(mod);
                define(mod, modUrl)
            }
            r(mod, callback)
        }
    }), RequireCdn
}),
 define("widget/syntax_highlight", ["jquery", "underscore", "widget/require-cdn"], function($, _, RequireCdn) {
    var cdnUrl = "http://img3.douban.com/",
        modPrefix = "libs/highlight/7.2/",
        highlightMod = modPrefix + "highlight",
        requireCdn = new RequireCdn({
            nameToUrl: function(name) {
                return cdnUrl + name + ".min.js"
            }
        }),
        Highlighter = {
            languages: ["1c", "actionscript", "apache", "avrasm", "axapta", "bash", "clojure", "cmake", "coffeescript", "cpp", "cs", "css", "d", "delphi", "diff", "django", "dos", "erlang-repl", "erlang", "glsl", "go", "haskell", "http", "ini", "java", "javascript", "json", "lisp", "lua", "markdown", "matlab", "mel", "nginx", "objectivec", "parser3", "perl", "php", "profile", "python", "r", "rib", "rsl", "ruby", "rust", "scala", "smalltalk", "sql", "tex", "vala", "vbscript", "vhdl", "xml"].sort(),
            renderText: function(text, language) {
                var codeText = _.unescape(text),
                    dfd = $.Deferred();
                return -1 === _.indexOf(this.languages, language, !0) ? (dfd.resolve(_.escape(codeText)), dfd.promise()) : (requireCdn.r(highlightMod, function() {
                    var Hljs = window.hljs,
                        modName = modPrefix + "languages/" + language;
                    requireCdn.r(modName, function() {
                        dfd.resolve(Hljs.highlight(language, codeText).value)
                    })
                }), dfd.promise())
            }
        };
    return Highlighter
}),
 define("reader/views/reading/page", ["jquery", "backbone", "underscore", "reader/views/reading/modules/build_line_info", "widget/syntax_highlight"], function($, Backbone, _, build_line_info, Highlighter) {
    var Page = Backbone.View.extend({
        className: "page",
        tmplPage: $("#tmpl-page").html(),
        initialize: function(options) {
            this.data = options.data, this.content = options.content, this.markingTips = options.markingTips, this.paragraphs = this.data.page.paragraphs, this.pagination = this.data.page.pagination, this.on("render:selection", this.renderSelection, this)
        },
        createPageStamp: function() {
            if (Ark.isAnnotationEnabled) {
                var info = this.data.page,
                    stamp = {
                        pid: null
                    }, content = this.content;
                if (!info.stamp) {
                    info.stamp = stamp;
                    var paragraphs = info.paragraphs;
                    if (paragraphs && paragraphs.length) {
                        var p = paragraphs[0];
                        if (stamp.pid = p.pid, content.isPara(p)) {
                            var line = content.findStampOffset(stamp.pid, this.pagination);
                            if (!line) return;
                            var para = this.$el.find("p[data-pid=" + stamp.pid + "]"),
                                paraInfo = build_line_info(para),
                                offset = paraInfo.index.offset[line - 1];
                            stamp.offset = offset
                        }
                    }
                }
            }
        },
        render: function() {
            return this.$el.html(_.template(this.tmplPage, this.data)), this.$el.attr("data-pagination", this.data.page.pagination), this.createPageStamp(), this.highlightCode(), this
        },
        highlightCode: function() {
            function highlightElem(elem, language) {
                Highlighter.renderText(elem.html(), language).done(function(renderedText) {
                    elem.html(renderedText)
                })
            }
            var codeBlocks = this.$el.find(".code code");
            codeBlocks.length && codeBlocks.each(function(i, elem) {
                var codeBlock = $(elem),
                    language = codeBlock.data("language"),
                    isLineSplited = codeBlock.hasClass("line-split");
                isLineSplited ? codeBlock.children(".line").each(function(j, line) {
                    highlightElem($(line), language)
                }) : highlightElem(codeBlock, language)
            })
        }
    });
    return Page
}),
 define("reader/collections/markings", ["backbone", "underscore", "reader/models/marking"], function(Backbone, _, MarkingModel) {
    function LinesColl(collection) {
        this._indexes = {}, this.collection = collection
    }
    _.extend(LinesColl.prototype, {
        getByPid: function(pid) {
            return this._indexes[pid] = this._indexes[pid] || [], this._indexes[pid]
        },
        _add: function(model) {
            _.each(model.getRanges(), function(data, pid) {
                this.getByPid(pid).push(model)
            }, this), model.isNew() && model.save()
        },
        remove: function(model) {
            _.each(model.getRanges(), function(data, pid) {
                this._indexes[pid] = _.without(this._indexes[pid], model)
            }, this)
        },
        getRelatedModels: function(model) {
            var models = [];
            return _.each(model.getRanges(), function(data, pid) {
                var index = this.getByPid(pid);
                models = models.concat(index)
            }, this), _.uniq(models)
        },
        add: function(model) {
            var modelsToMerge = [];
            _.each(this.getRelatedModels(model), function(oldModel) {
                oldModel.checkConflict(model) && modelsToMerge.push(oldModel)
            }), modelsToMerge.length ? (modelsToMerge.push(model), modelsToMerge.shift().merge(modelsToMerge)) : this._add(model)
        }
    });
    var AnonymousMixin = Ark.me.isAnonymous ? {
        fetch: $.noop
    } : {}, Markings = Backbone.Collection.extend({
            model: MarkingModel,
            url: function() {
                return "/j/article_v2/" + this.articleId + "/get_annotations"
            },
            initialize: function(models, options) {
                this.articleId = options.articleId, this.paragraphsIndex = options.paragraphsIndex, this.linesColl = new LinesColl(this);
                var self = this;
                this.on("add", function(model) {
                    return model.isUnderline() ? (self.linesColl.add(model), void 0) : (model.isNew() && model.save(), void 0)
                }), this.on("effectiveChange", function(model) {
                    return model.isUnderline() ? (self.linesColl.remove(model), self.linesColl.add(model), void 0) : (model.save(), void 0)
                }), this.on("destroy", function(model) {
                    model.isUnderline() && self.linesColl.remove(model)
                })
            }
        });
    return _.extend(Markings.prototype, AnonymousMixin), Markings
}),
 define("reader/views/reading/pages_container", ["jquery", "backbone", "underscore", "reader/collections/markings", "reader/views/reading/page", "reader/views/reading/selection_manager", "reader/views/reading/article_marking_manager", "reader/views/reading/modules/build_line_info", "reader/modules/tooltip", "reader/modules/split_to_span"], function($, Backbone, _, MarkingsCollection, Page, SelectionManager, ArticleMarkingManager, buildLineInfo, Tooltip, splitToSpan) {
    var PagesContainer = Backbone.View.extend({
        el: ".article .inner",
        tmplParagraph: $("#tmpl-paragraph").html(),
        initialize: function(options) {
            _.bindAll(this, "getParaContent"), this.app = options.app, this.vent = options.vent, this.splitToSpan = this.getSplitFunction(), this.pages = [], this.vent.on("horizontal:page:clearPreload", this.horizontalClearPreloadPage, this), this.markingTips = new Tooltip
        },
        empty: function() {
            this.$el.empty(), this.pages = []
        },
        horizontalClearPreloadPage: function(isForward) {
            var type, page, existingPages = this.pages;
            existingPages.length > 2 && (type = isForward ? "shift" : "pop", page = existingPages[type](), page.remove(), isForward && this.$el.css({
                left: -this.config.get("pageWidth") + "em"
            })), 1 === this.config.get("currPage") && (page = existingPages.pop(), page.remove())
        },
        jumpStamp: function(stamp) {
            var page = this.getSpecialPage(stamp),
                pageNumber = page && page.pagination,
                currPage = this.book.get("isGift") ? ++pageNumber : pageNumber;
            this.config.setCurrPage(currPage)
        },
        getSpecialPage: function(stamp) {
            var page = {
                pagination: 0
            }, paginations = this.content.findPaginations(stamp.pid);
            if (!paginations) return page.error = !0, null;
            if (1 === paginations.length) page.pagination = paginations[0];
            else if (paginations.length > 1) {
                var row, fakeParagraph = this.makeFakeParagraph(stamp.pid),
                    info = buildLineInfo(fakeParagraph),
                    currPagination = paginations[0],
                    rows = this.content.findPageOffsetInfo(stamp.pid);
                $.each(paginations, function(index, pagination) {
                    return row = rows[index], stamp.offset < info.index.offset[row] ? !1 : (currPagination = pagination, void 0)
                }), page.pagination = currPagination
            }
            return page
        },
        createPage: function(targetPage, manipType) {
            var page = new Page({
                data: _.defaults({
                    page: targetPage
                }, this.defaultData),
                markingTips: this.markingTips,
                content: this.content
            });
            return this.pages["append" === manipType ? "push" : "unshift"](page), page
        },
        render: function(type, targetPages) {
            var manipType = type;
            "html" === type && (this.empty(), manipType = "append");
            var fragment = document.createDocumentFragment(),
                self = this,
                pages = [];
            _.each(targetPages, function(targetPage) {
                var page = self.createPage(targetPage, manipType);
                pages.push(page), fragment.appendChild(page.render().el)
            }), this.$el[manipType](fragment), _.each(pages, function(page) {
                self.trigger("page:render", page, manipType)
            })
        },
        getParaContent: function(p) {
            return "illus" !== p.type && "code" !== p.type && -1 === p.klass.indexOf("headline") ? this.splitToSpan(p.text) : p.text
        },
        makeFakeParagraph: function(pid) {
            var paragraph = $("<div>"),
                data = this.content.getParagraph(pid);
            return paragraph.html(_.template(this.tmplParagraph, {
                p: data,
                getParaContent: this.getParaContent
            })), paragraph.find("p")
        },
        setModel: function(book, config, content) {
            var appModel = this.app.model = {};
            if (this.book = appModel.book = book, this.config = appModel.config = config, this.content = appModel.content = content, this.defaultData = _.defaults({
                getParaContent: this.getParaContent
            }, this.book.attributes), this.listenTo(this.config, "jump:stamp", this.jumpStamp), Ark.isAnnotationEnabled && this.app.fitForDesktop) {
                var paragraphsIndex = this.content.getParasIndexs();
                this.markingsCollection = new MarkingsCollection([], {
                    articleId: this.book.id,
                    paragraphsIndex: paragraphsIndex
                }), this.book.markings = this.markingsCollection, this.markingsCollection.fetch({
                    remove: !1
                }), this.createSelectionManager(), this.createArticleMarkingManager()
            }
            return this
        },
        createArticleMarkingManager: function() {
            this.articleMarkingManager && this.articleMarkingManager.remove(), this.articleMarkingManager = new ArticleMarkingManager({
                pages: this.pages,
                pagesManager: this,
                collection: this.markingsCollection,
                markingTips: this.markingTips
            })
        },
        createSelectionManager: function() {
            this.selectionManager = new SelectionManager({
                el: this.el,
                pages: this.pages,
                pagesManager: this,
                collection: this.markingsCollection
            })
        },
        getSplitFunction: function() {
            var func = function(text) {
                return splitToSpan(text)
            };
            return Ark.isAnnotationEnabled && this.app.fitForDesktop || (func = function(text) {
                return text
            }), func
        }
    });
    return PagesContainer
}),
 define("mod/lang", [], function() {
    var lang = {}, ArrayProto = Array.prototype,
        slice = ArrayProto.slice,
        nativeForEach = ArrayProto.forEach,
        each = lang.each = function(obj, iterator, context) {
            if (obj)
                if (nativeForEach && obj.forEach === nativeForEach) obj.forEach(iterator, context);
                else
            if (obj.length === +obj.length)
                for (var i = 0, l = obj.length; l > i; i++) iterator.call(context, obj[i], i, obj);
            else
                for (var key in obj) obj.hasOwnProperty(key) && iterator.call(context, obj[key], key, obj)
        };
    return lang.extend = function(obj) {
        return each(slice.call(arguments, 1), function(source) {
            for (var prop in source) obj[prop] = source[prop]
        }), obj
    }, lang.escape = function(str) {
        str = "" + str || "";
        var xmlchar = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"
        };
        return str.replace(/[<>&'"]/g, function($1) {
            return xmlchar[$1]
        })
    }, lang
}),
 define("mod/emitter", ["mod/lang"], function(_) {
    function Emitter(obj) {
        return obj ? _.extend(obj, Emitter.prototype) : void 0
    }
    return Emitter.prototype.on = Emitter.prototype.bind = function(e, fn) {
        return 1 === arguments.length ? (_.each(e, function(fn, event) {
            this.on(event, fn)
        }, this), this) : (this._callbacks = this._callbacks || {}, (this._callbacks[e] = this._callbacks[e] || []).push(fn), this)
    }, Emitter.prototype.emit = Emitter.prototype.trigger = function(e) {
        this._callbacks = this._callbacks || {};
        var args = [].slice.call(arguments, 1),
            callbacks = this._callbacks[e];
        if (callbacks) {
            callbacks = callbacks.slice(0);
            for (var i = 0, len = callbacks.length; len > i; ++i) callbacks[i].apply(this, args)
        }
        return this
    }, Emitter
}),
 define("ui/overlay", ["jquery", "mod/emitter"], function($, Emitter) {
    function Overlay(opts) {
        Emitter.call(this);
        var self = this;
        this.opts = opts, this.el = $(tmpl).appendTo("body"), this.anchor = $("<div>", {
            id: "k-anchor"
        }).prependTo("body"), this.body = this.el.find(".k-slave"), this.closable = void 0 !== opts.closable ? !! opts.closable : !0, this.setBody(), this.closable && doc.on("click.close", "#ark-overlay", function(e) {
            e.target === e.currentTarget && self.close()
        }).on("keyup.close", function(e) {
            /input|textarea/i.test(e.target.tagName) || 27 !== e.keyCode || self.close()
        })
    }

    function exports(opts) {
        return opts = opts || {}, new exports.Overlay(opts)
    }
    var tmpl = '<div id="ark-overlay" class="hide"><div class="k-stick"></div><div class="k-content"><div class="k-slave"></div></div></div>',
        doc = $(document),
        docRoot = $("html");
    return $.extend(Overlay.prototype, {
        close: function() {
            return docRoot.removeClass("ark-overlay"), this.el.remove(), this.anchor.remove(), doc.scrollTop(this.scrollTop), doc.off(".close"), this.emit("close"), this
        },
        open: function() {
            return this.scrollTop = doc.scrollTop(), this.anchor.css("margin-top", -this.scrollTop), docRoot.addClass("ark-overlay"), this.el.removeClass("hide"), this.emit("open"), this
        },
        setBody: function(body) {
            return body = body || this.opts.body, this.body.html(body), this
        }
    }), Emitter(Overlay.prototype), exports.Overlay = Overlay, exports
}),
 define("reader/views/reading/article", ["jquery", "backbone", "underscore", "reader/app", "mod/cookie", "mod/ajax", "ui/overlay", "reader/views/reading/pages_container", "reader/models/article", "reader/modules/tinytips", "reader/modules/storage_manager", "reader/modules/paging", "reader/modules/typesetting", "reader/modules/prettify", "reader/modules/ga"], function($, Backbone, _, app, cookie, ajax, overlay, PagesContainer, Article, TinyTips, storageManager, pagingMaster, typesetting, prettify, ga) {
    var ArticleView = Backbone.View.extend({
        el: ".article",
        initialize: function(app, config, vent) {
            _.bindAll(this, "renderPages", "renderFullPages", "reRenderArticle", "resizeFigures", "pagingDone", "delayResizePage"), this.app = app, this.config = config, this.vent = vent, this.vent.on({
                "pages:render": this.renderPages,
                "pages:renderFull": this.renderFullPages,
                "rerender:article": this.reRenderArticle
            }), this.tmplIllus = $("#tmpl-illus").html(), this.tmplArticle = $("#tmpl-article").html(), this.tmplEmptyPage = $("#tmpl-empty-page").html(), this.tmplSampleTips = $("#tmpl-sample-tips").html(), this.pagesContainer = new PagesContainer({
                app: this.app,
                vent: this.vent
            }), this.app.articleInner = this.articleInner = this.pagesContainer.$el, this.doc = document, this.win = $(window), this.winHeight = this.win.height(), this.lineHeight = 16 * this.config.get("lineHeight"), this.layout = localStorage.layout, this.on({
                "paging:start": this.resizeFigures,
                "page:resized": this.initArticle
            })
        },
        render: function(articleId, onRender) {
            return this.trigger("view:render"), this.articleId = articleId, this.book = Ark.me.isAnonymous || Ark.me.isAdmin ? "" : this.app.myBookshelf.get(articleId), this.hasAdded = !! this.book, this.book || (this.book = new Article({
                id: this.articleId
            })), this.purchaseTime = this.book.get("purchaseTime"), this.win.resize(_.debounce(this.delayResizePage, 200)), this.app.fitForMobile || "vertical" === this.layout ? this.initArticle(onRender) : this.fitForWindow(onRender), this
        },
        openAnnotation: function(rId) {
            var article;
            this.promise.done(function(data) {
                article = data
            }), $.when(this.promise, $.get("/j/share/" + rId)).then(_.bind(function(noop, ajaxResult) {
                var ajaxData = ajaxResult[0];
                if (ajaxData && !ajaxData.r) {
                    var annotation = ajaxData.props,
                        stamp = {
                            pid: annotation.startContainerId,
                            offset: annotation.startOffset,
                            type: "annotation",
                            annotation: annotation
                        };
                    article.stamp = stamp
                }
            }, this)).always(_.bind(function() {
                this.promise.done(this.pagingDone)
            }, this))
        },
        events: {
            "click .inner": "captureTags",
            "click .expandable": "expandIllus",
            "click .lnk-collect": "addToBookshelf"
        },
        initArticle: function(onRender) {
            this.trigger("article:init"), this.dfd = new $.Deferred, this.promise = this.dfd.promise(), this.app.model = null, onRender ? onRender(this) : this.promise.done(this.pagingDone);
            var articleId = this.articleId,
                article = storageManager.getArticle(articleId);
            if (this.previousAid = localStorage.previousAid, this.setTitle(this.book.get("title")), this.resetTypePage(), article) {
                this.isSample = !! (0 | article.split(":")[1]), this.isGift = !! (0 | article.split(":")[2]);
                var timestamp = article.slice(-14);
                this.hasNewRevision(timestamp).done($.proxy(function(o) {
                    if (o.r) {
                        var data = $.parseJSON(prettify.dec(article.slice(0, -14)));
                        this.price = data.price, this.renderArticle(data)
                    } else this.fetchArticle()
                }, this))
            } else this.fetchArticle()
        },
        renderArticle: function(data) {
            this.book.set({
                price: this.price,
                isGift: this.isGift,
                isSample: this.isSample,
                hasAdded: this.hasAdded
            }), this.hasFormula = data.hasFormula || this.book.get("hasFormula"), this.currPage = this.config.get("currPage"), this.prevLayout = this.layout, this.paging(data)
        },
        paging: function(data) {
            var hasFormula = this.hasFormula;
            this.trigger("paging:start", data), $.each(data.posts, function(idx, art) {
                data.posts[idx].contents = typesetting.transformParas(["sup", "em", "code", "i", "del"], art.contents), hasFormula && typesetting.wrapFormula(art.contents)
            });
            var articlePaging = pagingMaster({
                pageHeight: this.pageHeight,
                lineHeight: this.lineHeight,
                data: data,
                typePage: this.articleInner,
                metadata: {
                    hasFormula: hasFormula
                },
                template: {
                    article: this.tmplArticle
                }
            });
            articlePaging.done(_.bind(function(article) {
                this.dfd.resolve(article)
            }, this))
        },
        offsetAction: {
            annotation: function() {
                this.config.set("isRecommendation", !0)
            }
        },
        pagingDone: function(data) {
            this.totalPage = data.body.length || 1, this.progress = this.book.get("progress");
            var specialPage, pageNumber;
            this.content = data, this.pagesContainer.setModel(this.book, this.config, this.content);
            var stamp = this.content.stamp;
            if (stamp) {
                specialPage = this.pagesContainer.getSpecialPage(data.stamp);
                var offsetAction = stamp.type && this.offsetAction[stamp.type];
                offsetAction && offsetAction.call(this)
            }
            if (pageNumber = specialPage ? specialPage.pagination : Math.round(this.progress * this.totalPage), this.currPage = this.isGift ? ++pageNumber : pageNumber, this.config.unset("currPage", {
                silent: !0
            }), this.pagesContainer.empty(), this.config.setTotalPage(this.totalPage), this.config.setCurrPage(this.currPage), this.trigger("paging:done"), stamp && stamp.type && "annotation" === stamp.type) {
                var modelJSON = _.extend(stamp.annotation, {
                    type: "others_underline"
                }),
                    markings = this.book.markings;
                markings && markings.add(modelJSON)
            }
            this.vent.trigger("paging:done", data.contents), this._trackGAEvent()
        },
        hasNewRevision: function(timestamp) {
            return ajax.post("/j/article_v2/need_update", {
                aid: this.articleId,
                lasttime: timestamp
            })
        },
        fetchArticle: function() {
            function retry() {
                if (!_.isFunction(history.pushState)) return location.href = "/ebook/" + articleId + "/", !1;
                var errInfo = "加载失败，请刷新重试。",
                    errConfirm = confirm(errInfo);
                errConfirm && location.reload()
            }

            function success(resp) {
                if (resp.r) return retry();
                storageManager.freeUpStorageSpace();
                var newData = $.parseJSON(prettify.dec(resp.data));
                if (self.price = newData.price, self.isSample = !! (0 | resp.time.split(":")[1]), self.isGift = !! (0 | resp.time.split(":")[2]), !Ark.me.isAnonymous && !Ark.me.isAdmin) try {
                    storageManager.saveArticle(articleId, resp)
                } catch (e) {}
                self.renderArticle(newData)
            }
            var self = this,
                articleId = this.articleId,
                url = "/j/article_v2/get_reader_data",
                data = {
                    ck: cookie("ck"),
                    aid: articleId,
                    reader_data_version: storageManager.getReaderDataVersion()
                }, fetchState = ajax({
                    url: url,
                    type: "POST",
                    data: data
                });
            fetchState.success(success).error(retry)
        },
        renderPagesAction: function(opts) {
            _.defaults(opts, {
                method: "html"
            }), opts.pages.length || opts.prevPage || opts.pages.push({}), this.pagesContainer.render(opts.method, opts.pages)
        },
        renderPages: function() {
            var prevPage = this.config.previous("currPage") || 0,
                pageNum = this.config.get("currPage"),
                nextPage = pageNum >= prevPage ? 1 : 0,
                distance = Math.abs(pageNum - prevPage),
                renderType = 1 >= distance ? nextPage ? "append" : "prepend" : "html",
                targetPages = [];
            targetPages = distance > 1 || 0 === distance ? this.content.getPages(pageNum - (1 === pageNum ? 1 : 2), pageNum) : 1 !== pageNum || prevPage ? this.content.getPages(pageNum - (nextPage ? 1 : 2), pageNum - (nextPage ? 0 : 1)) : this.content.getPages(0, 1), this.renderPagesAction({
                method: renderType,
                pages: targetPages,
                prevPage: prevPage
            }), this.completeArticle()
        },
        renderFullPages: function() {
            var currPage = this.config.get("currPage"),
                totalPage = this.totalPage,
                pageHeight = localStorage.pageHeight / 16,
                preloadedPages = 2,
                startPage = preloadedPages >= currPage ? 0 : currPage - preloadedPages - 1,
                targetPages = this.content.getPages(startPage, currPage + preloadedPages);
            this.renderPagesAction({
                pages: targetPages
            }), this.articleInner.height(pageHeight * totalPage + "em").find(".page").css("top", pageHeight * startPage + "em"), (Ark.me.isAnonymous || this.isSample || !Ark.me.isAnonymous && !this.hasAdded) && this.articleInner.find(".page").eq(0).find(".hd").addClass("fixed-sample-tip"), this.completeArticle()
        },
        completeArticle: function() {
            this.loadFigures(), (this.isSample || Ark.me.isAnonymous) && this.renderSampleTips(), Ark.me.isAnonymous || this.hasAdded || cookie("cths") || (cookie("cths", 1, {
                "max-age": 31536e4,
                path: "/reader"
            }), this.showCollectTips())
        },
        showCollectTips: function() {
            this.collectTips = new TinyTips;
            var content = $("#tmpl-collect-tips").html();
            setTimeout(_.bind(function() {
                this.collectTips.set({
                    target: ".lnk-collect",
                    width: "270px",
                    content: content
                }).show()
            }, this), 2e3)
        },
        fillHeight: function(height) {
            return 2 * Math.ceil(parseInt(height, 10) / 2)
        },
        fitForWindow: function(onRender) {
            this.page = this.$el.find(".page"), this.pageWidth = this.page.width();
            var clientHeight = this.doc.body.clientHeight / 16,
                verticalPadding = (parseInt(this.page.css("padding-top"), 10) + parseInt(this.page.css("padding-bottom"), 10)) / 16,
                typePageHeight = clientHeight - verticalPadding,
                minPageHeight = 15.25;
            clientHeight = minPageHeight > typePageHeight ? minPageHeight + verticalPadding : clientHeight, this.typePageSize = {
                width: this.pageWidth / 16,
                height: clientHeight - verticalPadding
            }, this.pageResized = this.pageHeight && this.pageHeight !== 16 * this.fillHeight(this.typePageSize.height) ? !0 : !1, this.pageHeight = 16 * this.fillHeight(this.typePageSize.height), this.$el.height(clientHeight + "em"), this.articleInner.height(clientHeight + "em"), this._clearPageStyle(), this._setPageStyle(onRender)
        },
        delayResizePage: function() {
            var currHeight = this.win.height();
            this.prevLayout === this.layout && "horizontal" === this.layout && currHeight === this.winHeight || "vertical" === this.layout || (this.app.fitForMobile || this.fitForWindow(), this.winHeight = currHeight)
        },
        resizeFigures: function(data) {
            if (!this.app.fitForMobile && "vertical" !== this.layout) {
                var sizeDict = {
                    H: "large",
                    M: "small",
                    S: "tiny"
                }, typePageHeight = (16 * this.typePageSize.width, 16 * this.typePageSize.height);
                _.each(data.posts, function(stories) {
                    _.each(stories.contents, function(p) {
                        if ("illus" === p.type) {
                            var data = p.data,
                                size = data.size,
                                layout = data.layout,
                                dimension = data.dimension,
                                sizeInfo = size[sizeDict[dimension]],
                                w = ( !! data.legend, sizeInfo.width),
                                h = sizeInfo.height,
                                captionOffset = "C" === layout || "H" === dimension ? 90 : 32;
                            h + captionOffset > typePageHeight && (sizeInfo.height = typePageHeight - captionOffset, sizeInfo.width = Math.floor(sizeInfo.height * w / h))
                        }
                    })
                })
            }
        },
        captureTags: function(e) {
            var tar = $(e.target);
            "SUP" === tar[0].tagName && (this.tinyTips = this.tinyTips || new TinyTips, this.tinyTips.set({
                target: tar,
                hasFormula: this.hasFormula,
                content: _.escape(tar.data("text"))
            }).update())
        },
        expandIllus: function(e) {
            if (!this.app.fitForMobile) {
                var self = $(e.currentTarget),
                    illus = self.find("img"),
                    legend = self.find(".legend"),
                    origWidth = illus.data("orig-width"),
                    fullLegend = legend.data("full-legend") || legend.html(),
                    fullLegendWithFormat = fullLegend ? "<p>" + typesetting.transform(["em"], fullLegend).replace(/\n/g, "</p><p>") + "</p>" : "",
                    illusOverlayData = {
                        src: illus.data("orig-src"),
                        legend: fullLegendWithFormat
                    }, illusData = _.template(this.tmplIllus, illusOverlayData);
                overlay({
                    body: illusData,
                    closable: !0
                }).on("close", $.proxy(function() {
                    this.vent.trigger("page:unfreeze")
                }, this)).open(), $(".full-legend").css({
                    width: origWidth + "px"
                }), this.vent.trigger("page:freeze")
            }
        },
        loadFigures: function() {
            var figures = this.$el.find(".illus img"),
                self = this;
            _.each(figures, function(figure) {
                var currFigure = $(figure),
                    currSrc = currFigure.data("src"),
                    figureTypes = currFigure.parents(".illus")[0].className;
                /M_L|M_R/g.test(figureTypes) && !self.app.fitForMobile && currFigure.parent().parent().find(".legend").css({
                    width: self.pageWidth - currFigure.parent().outerWidth() - 15,
                    "max-height": 18 * Math.floor(currFigure.height() / 18 - 1)
                }), currFigure.attr("src", currSrc).removeClass("loading")
            })
        },
        reRenderArticle: function() {
            this.prevLayout = this.layout, this.layout = localStorage.layout, "horizontal" === this.layout ? (this.articleInner.height("auto"), this.$el.find(".page").removeAttr("style"), this.delayResizePage()) : (this.$el.height("auto"), this.pageHeight = localStorage.pageHeight, this.articleInner.removeAttr("style"), this._clearPageStyle(), this.initArticle())
        },
        setTitle: function(title) {
            this.doc.title = title || "豆瓣阅读"
        },
        resetTypePage: function() {
            this.articleInner.html(_.template(this.tmplEmptyPage, {
                hint: "作品载入中，请稍候 ..."
            })).css({
                left: 0,
                right: "auto"
            })
        },
        progressToPage: function(progress) {
            return progress * this.pageNum
        },
        renderSampleTips: function() {
            var tip = !this.isSample || 0 | this.price ? "试读已结束。购买后，可以继续阅读。" : "试读已结束。登录后，可以继续阅读。",
                btnText = this.app.fitForMobile ? "购买全本" : "购买";
            tip = this.app.fitForMobile ? "试读已结束。" : tip, this.$(".sample_text").html(_.template(this.tmplSampleTips, {
                aid: this.articleId,
                isSample: this.isSample,
                price: this.price,
                text: tip,
                btnText: btnText
            }))
        },
        addToBookshelf: function(e) {
            var self = this,
                btn = $(e.target),
                originText = btn.text(),
                url = "/j/ebook/" + this.articleId + "/add_to_bookshelf";
            btn.text("正在添加..."), ajax.post(url).success(_.bind(function(o) {
                var err = o.err;
                err ? (btn.text(err), _.delay(function() {
                    btn.text(originText)
                }, 1e3)) : (btn.text("添加成功！"), _.delay(function() {
                    btn.fadeOut(300, function() {
                        $(this).remove(), self.book.set("hasAdded", 1)
                    })
                }, 1500))
            }, this)).fail(function() {
                btn.text(originText)
            })
        },
        _setPageStyle: function(onRender) {
            if (!$("#page-style").length) {
                var typePageHeight = this.typePageSize.height,
                    contentHeight = this.fillHeight(typePageHeight) + "em",
                    pageHeight = typePageHeight + "em",
                    cssContent = "            .page { height: pageHeight }            .page .bd { height: contentHeight }          ".replace("pageHeight", pageHeight).replace("contentHeight", contentHeight),
                    pageStyle = $('<style id="page-style">' + cssContent + "</style>");
                pageStyle.appendTo("head"), this.trigger("page:resized", onRender)
            }
        },
        _clearPageStyle: function() {
            $("#page-style").remove()
        },
        _trackGAEvent: function() {
            ajax.post("/j/currtime").done(_.bind(function(currentTime) {
                currentTime = 0 | currentTime, ga._trackEvent(ga.getTradeInfo(this) + "-open", 0 | (0 | currentTime - this.purchaseTime) / 86400)
            }, this))
        }
    });
    return ArticleView
}),
 define("reader/modules/template", ["underscore"], function(_) {
    function Presenter(data, methods) {
        this.data = data, _.extend(this, methods)
    }
    return function(templateString, data, presenter) {
        data = _.isArray(data) ? data : [data];
        var rendered = _.map(data, function(d) {
            return d.$item = new Presenter(d, presenter || {}), _.template(templateString, d)
        });
        return rendered.join("")
    }
}),
 define("reader/views/mixins/rating_star", [], function() {
    return {
        rate: function(e) {
            e.preventDefault(), this.stars = this.parseStar(e.target), this.starsContext.setAttribute("data-stars", this.stars)
        },
        parseStar: function(elem) {
            return elem.getAttribute("data-star")
        },
        hoveringStar: function(e) {
            var stars = this.parseStar(e.target);
            this.displayStar(stars)
        },
        resumeStar: function() {
            this.displayStar(this.stars)
        },
        displayStar: function(stars) {
            var className = this.starsContext.className;
            this.starsContext.className = className.replace(/stars-\d+/g, "stars-" + stars)
        }
    }
}),
 define("reader/views/reading/rating", ["backbone", "jquery", "reader/views/mixins/rating_star", "reader/modules/template"], function(Backbone, $, StarsMixin, tmpl) {
    var Rating = Backbone.View.extend({
        initialize: function() {
            this.model.on("change:rating", this.resumeStar, this)
        },
        template: $("#tmpl-rating").html(),
        events: {
            "mouseover .star-region": "hoveringStar",
            "mouseout .stars-context": "resumeStar",
            "click .star-region": "rate"
        },
        render: function() {
            return this.$el.html(tmpl(this.template, this.model.toJSON())), this.starsContext = this.$el.find(".stars-context").get(0), this.stars = this.starsContext.getAttribute("data-stars"), this
        }
    });
    return $.extend(Rating.prototype, StarsMixin), Rating
}),
 define("reader/views/reading/rating_form", ["backbone", "underscore", "jquery", "reader/views/reading/rating", "reader/modules/form_util"], function(Backbone, _, $, RatingView, FormUtil) {
    var tmplComment = $("#tmpl-rating-comment").html(),
        tmplFormButtons = $("#tmpl-form-buttons").html(),
        RatingFormView = Backbone.View.extend({
            initialize: function(app) {
                _.bindAll(this, "cancelEditing"), this.app = app, this.editingMode = !1
            },
            template: $("#tmpl-rating-form").html(),
            render: function(articleId) {
                var book = this.app.myBookshelf.get(articleId),
                    rating = book.getRating(),
                    self = this;
                return this.$el = $(_.template(this.template, {})), rating.on("saved", function() {
                    self.editingMode = !1, self.renderForm(rating), self.trigger("updated")
                }), this.renderForm(rating), this
            },
            renderForm: function(rating) {
                this.renderRating(rating), this.renderComment(rating), this.renderFormButtons(rating), this.bindFormActions(rating), FormUtil.ctrlEnterForm(this.$el)
            },
            renderRating: function(rating) {
                var ratingView = new RatingView({
                    model: rating
                });
                rating.get("rated") && !this.editingMode && ratingView.undelegateEvents(), this.$el.find(".rating").html(ratingView.render().el)
            },
            renderComment: function(rating) {
                this.$el.find("#field-edit").html(_.template(tmplComment, {
                    rated: rating.get("rated"),
                    comment: rating.get("comment"),
                    editingMode: this.editingMode
                }))
            },
            renderFormButtons: function(rating) {
                this.$el.find(".form-actions").html(_.template(tmplFormButtons, {
                    rated: rating.get("rated"),
                    editingMode: this.editingMode
                }))
            },
            cancelEditing: function() {
                this.editingMode = !1, this.trigger("cancel")
            },
            bindFormActions: function(rating) {
                var self = this,
                    form = this.$el,
                    errorMessage = form.find(".validation-error"),
                    btnCancel = form.find(".btn-cancel"),
                    linkEdit = form.find(".link-edit");
                form.off("submit"), rating.on("invalid", function(model, msg) {
                    errorMessage.text(msg)
                }), btnCancel.on("click", function(e) {
                    e.preventDefault(), self.cancelEditing(rating)
                }), linkEdit.on("click", function(e) {
                    e.preventDefault(), self.editingMode = !0, self.renderForm(rating), self.trigger("updated")
                }), form.on("submit", _.bind(function(e) {
                    e.preventDefault(), e.stopPropagation();
                    var comment = form.find("[name=comment]").val(),
                        stars = form.find("[data-stars]")[0].getAttribute("data-stars");
                    rating.set({
                        rated: !0,
                        rating: stars,
                        comment: comment
                    }, {
                        silent: !0
                    }), rating.save()
                }, this))
            }
        });
    return RatingFormView
}),
 define("reader/views/reading/panel", ["jquery", "underscore", "backbone", "mod/cookie", "mod/detector", "reader/modules/ga", "reader/modules/bubble", "reader/views/reading/rating_form"], function($, _, Backbone, cookie, detector, ga, Bubble, RatingFormView) {
    var PanelView = Backbone.View.extend({
        el: ".aside",
        template: this.$("#tmpl-panel").html(),
        initialize: function(app, config, vent) {
            _.bindAll(this, "hide", "toggle", "hideBubble", "updateBubble"), this.config = config, this.vent = vent, this.app = app, this.library = this.app.myBookshelf, this.vent.on({
                "panel:toggle": this.toggle,
                "panel:hide": this.hide
            }), this.ratingForm = new RatingFormView(app), this.isShown = !! this.$el.is(":visible")
        },
        render: function(articleId) {
            var isAnonymous = Ark.me.isAnonymous;
            return this.articleId = articleId, this.book = !! this.library && this.library.get(articleId), this.$el.html(_.template(this.template, {
                isSample: !! this.book && this.book.get("isSample"),
                isAnonymous: isAnonymous,
                canRate: !! this.book && !! this.app.me && this.app.me.canRate(this.book),
                reviewsUrl: "/ebook/" + articleId + "/reviews?sort=score"
            })), this.layoutBtn = this.$el.find(".icon-layout"), this.helperBtn = this.$el.find(".icon-helper"), this.reviewsBtn = this.$el.find("#fn-salon"), this.backBtn = this.$el.find(".icon-back"), this.$el.find("#fn-share").length || this.reviewsBtn.addClass("sep"), cookie("hst") || (cookie("hst", 1, {
                "max-age": 31536e3
            }), this.helperBtn.trigger("click")), isAnonymous ? this : (this.app.fitForMobile || (this.bubble = new Bubble), this.ratingForm.on("cancel", this.hideBubble).on("updated", this.updateBubble), this)
        },
        events: {
            "click .icon-back": "backList",
            "click .icon-layout": "changeLayout",
            "click .icon-rating": "toggleRatingForm",
            "click .icon-helper": "toggleHelper"
        },
        hideBubble: function() {
            this.bubble.hide()
        },
        updateBubble: function() {
            this.bubble.update()
        },
        changeLayout: function() {
            var layout = localStorage.layout;
            localStorage.layout = "vertical" === layout ? "horizontal" : "vertical", this.vent.trigger("change:layout"), this.vent.trigger("rerender:article")
        },
        changeLayoutBtn: function(layout) {
            this.vent.trigger("shortcutTips:close"), this.layoutBtn.toggleClass("vertical", "vertical" === layout)
        },
        hideHelper: function() {
            $("i.tips").remove()
        },
        toggleHelper: function(e) {
            e.preventDefault(), "ontouchstart" in window || this.vent.trigger("shortcutTips:toggle");
            var body = $("body"),
                helper = $("i.tips");
            if (helper.length) helper.remove();
            else {
                var targets = $("li[data-title]").toArray(),
                    TMPL_TIPS = '<i class="tips"><b></b>{TITLE}</i>';
                _.each(targets, function(tar) {
                    tar = $(tar), tar.is(":visible") && body.append($(TMPL_TIPS.replace("{TITLE}", tar.data("title"))).css({
                        top: tar.position().top + (tar.height() - 20) / 2,
                        left: tar.offset().left + tar.width() + 12
                    }))
                })
            }
        },
        toggleRatingForm: function(e) {
            this.bubble.set({
                width: "270px",
                target: e.target,
                content: this.ratingForm.render(this.articleId).$el
            }).toggle(!0)
        },
        backList: function() {
            this.vent.trigger("popups:close"), $(document).scrollTop(0)
        },
        hide: function() {
            return this.isShown ? (this.bubble && this.bubble.destroy(), this.isShown = !1, this.$el.hide(), void 0) : this
        },
        show: function() {
            return this.isShown ? this : (this.isShown = !0, this.$el.show(), void 0)
        },
        toggle: function() {
            return this.$el[this.isShown ? "hide" : "show"](), this.isShown = this.isShown ? !1 : !0, this
        }
    });
    return PanelView
}),
/*!
 * iScroll Lite base on iScroll v4.1.6 ~ Copyright (c) 2011 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 */

function() {
    var m = Math,
        mround = function(r) {
            return r >> 0
        }, vendor = /webkit/i.test(navigator.appVersion) ? "webkit" : /firefox/i.test(navigator.userAgent) ? "Moz" : "opera" in window ? "O" : "",
        isIDevice = (/android/gi.test(navigator.appVersion), /iphone|ipad/gi.test(navigator.appVersion)),
        isPlaybook = /playbook/gi.test(navigator.appVersion),
        isTouchPad = /hp-tablet/gi.test(navigator.appVersion),
        has3d = "WebKitCSSMatrix" in window && "m11" in new WebKitCSSMatrix,
        hasTouch = "ontouchstart" in window && !isTouchPad,
        hasTransform = vendor + "Transform" in document.documentElement.style,
        hasTransitionEnd = isIDevice || isPlaybook,
        nextFrame = function() {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
                return setTimeout(callback, 17)
            }
        }(),
        cancelFrame = function() {
            return window.cancelRequestAnimationFrame || window.webkitCancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame || clearTimeout
        }(),
        RESIZE_EV = "onorientationchange" in window ? "orientationchange" : "resize",
        START_EV = hasTouch ? "touchstart" : "mousedown",
        MOVE_EV = hasTouch ? "touchmove" : "mousemove",
        END_EV = hasTouch ? "touchend" : "mouseup",
        CANCEL_EV = hasTouch ? "touchcancel" : "mouseup",
        trnOpen = "translate" + (has3d ? "3d(" : "("),
        trnClose = has3d ? ",0)" : ")",
        iScroll = function(el, options) {
            var i, that = this,
                doc = document;
            that.wrapper = "object" == typeof el ? el : doc.getElementById(el), that.wrapper.style.overflow = "hidden", that.scroller = that.wrapper.children[0], that.options = {
                hScroll: !0,
                vScroll: !0,
                x: 0,
                y: 0,
                bounce: !0,
                bounceLock: !1,
                momentum: !0,
                lockDirection: !0,
                useTransform: !0,
                useTransition: !1,
                onRefresh: null,
                onBeforeScrollStart: function(e) {
                    e.preventDefault()
                },
                onScrollStart: null,
                onBeforeScrollMove: null,
                onScrollMove: null,
                onBeforeScrollEnd: null,
                onScrollEnd: null,
                onTouchEnd: null,
                onDestroy: null
            };
            for (i in options) that.options[i] = options[i];
            that.x = that.options.x, that.y = that.options.y, that.options.useTransform = hasTransform ? that.options.useTransform : !1, that.options.hScrollbar = that.options.hScroll && that.options.hScrollbar, that.options.vScrollbar = that.options.vScroll && that.options.vScrollbar, that.options.useTransition = hasTransitionEnd && that.options.useTransition, that.scroller.style[vendor + "TransitionProperty"] = that.options.useTransform ? "-" + vendor.toLowerCase() + "-transform" : "top left", that.scroller.style[vendor + "TransitionDuration"] = "0", that.scroller.style[vendor + "TransformOrigin"] = "0 0", that.options.useTransition && (that.scroller.style[vendor + "TransitionTimingFunction"] = "cubic-bezier(0.33,0.66,0.66,1)"), that.options.useTransform ? that.scroller.style[vendor + "Transform"] = trnOpen + that.x + "px," + that.y + "px" + trnClose : that.scroller.style.cssText += ";position:absolute;top:" + that.y + "px;left:" + that.x + "px", that.refresh(), that._bind(RESIZE_EV, window), that._bind(START_EV), hasTouch || that._bind("mouseout", that.wrapper)
        };
    iScroll.prototype = {
        enabled: !0,
        x: 0,
        y: 0,
        steps: [],
        scale: 1,
        handleEvent: function(e) {
            var that = this;
            switch (e.type) {
                case START_EV:
                    if (!hasTouch && 0 !== e.button) return;
                    that._start(e);
                    break;
                case MOVE_EV:
                    that._move(e);
                    break;
                case END_EV:
                case CANCEL_EV:
                    that._end(e);
                    break;
                case RESIZE_EV:
                    that._resize();
                    break;
                case "mouseout":
                    that._mouseout(e);
                    break;
                case "webkitTransitionEnd":
                    that._transitionEnd(e)
            }
        },
        _resize: function() {
            this.refresh()
        },
        _pos: function(x, y) {
            x = this.hScroll ? x : 0, y = this.vScroll ? y : 0, this.options.useTransform ? this.scroller.style[vendor + "Transform"] = trnOpen + x + "px," + y + "px" + trnClose + " scale(" + this.scale + ")" : (x = mround(x), y = mround(y), this.scroller.style.left = x + "px", this.scroller.style.top = y + "px"), this.x = x, this.y = y
        },
        _start: function(e) {
            var matrix, x, y, that = this,
                point = hasTouch ? e.touches[0] : e;
            that.enabled && (that.options.onBeforeScrollStart && that.options.onBeforeScrollStart.call(that, e), that.options.useTransition && that._transitionTime(0), that.moved = !1, that.animating = !1, that.zoomed = !1, that.distX = 0, that.distY = 0, that.absDistX = 0, that.absDistY = 0, that.dirX = 0, that.dirY = 0, that.options.momentum && (that.options.useTransform ? (matrix = getComputedStyle(that.scroller, null)[vendor + "Transform"].replace(/[^0-9-.,]/g, "").split(","), x = 1 * matrix[4], y = 1 * matrix[5]) : (x = 1 * getComputedStyle(that.scroller, null).left.replace(/[^0-9-]/g, ""), y = 1 * getComputedStyle(that.scroller, null).top.replace(/[^0-9-]/g, "")), (x != that.x || y != that.y) && (that.options.useTransition ? that._unbind("webkitTransitionEnd") : cancelFrame(that.aniTime), that.steps = [], that._pos(x, y))), that.startX = that.x, that.startY = that.y, that.pointX = point.pageX, that.pointY = point.pageY, that.startTime = e.timeStamp || Date.now(), that.options.onScrollStart && that.options.onScrollStart.call(that, e), that._bind(MOVE_EV), that._bind(END_EV), that._bind(CANCEL_EV))
        },
        _move: function(e) {
            var that = this,
                point = hasTouch ? e.touches[0] : e,
                deltaX = point.pageX - that.pointX,
                deltaY = point.pageY - that.pointY,
                newX = that.x + deltaX,
                newY = that.y + deltaY,
                timestamp = e.timeStamp || Date.now();
            that.options.onBeforeScrollMove && that.options.onBeforeScrollMove.call(that, e), that.pointX = point.pageX, that.pointY = point.pageY, (newX > 0 || that.maxScrollX > newX) && (newX = that.options.bounce ? that.x + deltaX / 2 : newX >= 0 || that.maxScrollX >= 0 ? 0 : that.maxScrollX), (newY > 0 || that.maxScrollY > newY) && (newY = that.options.bounce ? that.y + deltaY / 2 : newY >= 0 || that.maxScrollY >= 0 ? 0 : that.maxScrollY), that.distX += deltaX, that.distY += deltaY, that.absDistX = m.abs(that.distX), that.absDistY = m.abs(that.distY), 6 > that.absDistX && 6 > that.absDistY || (that.options.lockDirection && (that.absDistX > that.absDistY + 5 ? (newY = that.y, deltaY = 0) : that.absDistY > that.absDistX + 5 && (newX = that.x, deltaX = 0)), that.moved = !0, that._pos(newX, newY), that.dirX = deltaX > 0 ? -1 : 0 > deltaX ? 1 : 0, that.dirY = deltaY > 0 ? -1 : 0 > deltaY ? 1 : 0, timestamp - that.startTime > 300 && (that.startTime = timestamp, that.startX = that.x, that.startY = that.y), that.options.onScrollMove && that.options.onScrollMove.call(that, e))
        },
        _end: function(e) {
            if (!hasTouch || 0 == e.touches.length) {
                var target, ev, newDuration, that = this,
                    point = hasTouch ? e.changedTouches[0] : e,
                    momentumX = {
                        dist: 0,
                        time: 0
                    }, momentumY = {
                        dist: 0,
                        time: 0
                    }, duration = (e.timeStamp || Date.now()) - that.startTime,
                    newPosX = that.x,
                    newPosY = that.y;
                if (that._unbind(MOVE_EV), that._unbind(END_EV), that._unbind(CANCEL_EV), that.options.onBeforeScrollEnd && that.options.onBeforeScrollEnd.call(that, e), !that.moved) {
                    if (hasTouch) {
                        for (target = point.target; 1 != target.nodeType;) target = target.parentNode;
                        "SELECT" != target.tagName && "INPUT" != target.tagName && "TEXTAREA" != target.tagName && (ev = document.createEvent("MouseEvents"), ev.initMouseEvent("click", !0, !0, e.view, 1, point.screenX, point.screenY, point.clientX, point.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, 0, null), ev._fake = !0, target.dispatchEvent(ev))
                    }
                    return that._resetPos(200), that.options.onTouchEnd && that.options.onTouchEnd.call(that, e), void 0
                }
                if (300 > duration && that.options.momentum && (momentumX = newPosX ? that._momentum(newPosX - that.startX, duration, -that.x, that.scrollerW - that.wrapperW + that.x, that.options.bounce ? that.wrapperW : 0) : momentumX, momentumY = newPosY ? that._momentum(newPosY - that.startY, duration, -that.y, 0 > that.maxScrollY ? that.scrollerH - that.wrapperH + that.y : 0, that.options.bounce ? that.wrapperH : 0) : momentumY, newPosX = that.x + momentumX.dist, newPosY = that.y + momentumY.dist, (that.x > 0 && newPosX > 0 || that.x < that.maxScrollX && that.maxScrollX > newPosX) && (momentumX = {
                    dist: 0,
                    time: 0
                }), (that.y > 0 && newPosY > 0 || that.y < that.maxScrollY && that.maxScrollY > newPosY) && (momentumY = {
                    dist: 0,
                    time: 0
                })), momentumX.dist || momentumY.dist) return newDuration = m.max(m.max(momentumX.time, momentumY.time), 10), that.scrollTo(mround(newPosX), mround(newPosY), newDuration), that.options.onTouchEnd && that.options.onTouchEnd.call(that, e), void 0;
                that._resetPos(200), that.options.onTouchEnd && that.options.onTouchEnd.call(that, e)
            }
        },
        _resetPos: function(time) {
            var that = this,
                resetX = that.x >= 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x,
                resetY = that.y >= 0 || that.maxScrollY > 0 ? 0 : that.y < that.maxScrollY ? that.maxScrollY : that.y;
            return resetX == that.x && resetY == that.y ? (that.moved && (that.options.onScrollEnd && that.options.onScrollEnd.call(that), that.moved = !1), void 0) : (that.scrollTo(resetX, resetY, time || 0), void 0)
        },
        _mouseout: function(e) {
            var t = e.relatedTarget;
            if (!t) return this._end(e), void 0;
            for (; t = t.parentNode;)
                if (t == this.wrapper) return;
            this._end(e)
        },
        _transitionEnd: function(e) {
            var that = this;
            e.target == that.scroller && (that._unbind("webkitTransitionEnd"), that._startAni())
        },
        _startAni: function() {
            var step, easeOut, animate, that = this,
                startX = that.x,
                startY = that.y,
                startTime = Date.now();
            if (!that.animating) {
                if (!that.steps.length) return that._resetPos(400), void 0;
                if (step = that.steps.shift(), step.x == startX && step.y == startY && (step.time = 0), that.animating = !0, that.moved = !0, that.options.useTransition) return that._transitionTime(step.time), that._pos(step.x, step.y), that.animating = !1, step.time ? that._bind("webkitTransitionEnd") : that._resetPos(0), void 0;
                animate = function() {
                    var newX, newY, now = Date.now();
                    return now >= startTime + step.time ? (that._pos(step.x, step.y), that.animating = !1, that.options.onAnimationEnd && that.options.onAnimationEnd.call(that), that._startAni(), void 0) : (now = (now - startTime) / step.time - 1, easeOut = m.sqrt(1 - now * now), newX = (step.x - startX) * easeOut + startX, newY = (step.y - startY) * easeOut + startY, that._pos(newX, newY), that.animating && (that.aniTime = nextFrame(animate)), void 0)
                }, animate()
            }
        },
        _transitionTime: function(time) {
            this.scroller.style[vendor + "TransitionDuration"] = time + "ms"
        },
        _momentum: function(dist, time, maxDistUpper, maxDistLower, size) {
            var deceleration = 6e-4,
                speed = m.abs(dist) / time,
                newDist = speed * speed / (2 * deceleration),
                newTime = 0,
                outsideDist = 0;
            return dist > 0 && newDist > maxDistUpper ? (outsideDist = size / (6 / (newDist / speed * deceleration)), maxDistUpper += outsideDist, speed = speed * maxDistUpper / newDist, newDist = maxDistUpper) : 0 > dist && newDist > maxDistLower && (outsideDist = size / (6 / (newDist / speed * deceleration)), maxDistLower += outsideDist, speed = speed * maxDistLower / newDist, newDist = maxDistLower), newDist *= 0 > dist ? -1 : 1, newTime = speed / deceleration, {
                dist: newDist,
                time: mround(newTime)
            }
        },
        _offset: function(el) {
            for (var left = -el.offsetLeft, top = -el.offsetTop; el = el.offsetParent;) left -= el.offsetLeft, top -= el.offsetTop;
            return {
                left: left,
                top: top
            }
        },
        _bind: function(type, el, bubble) {
            (el || this.scroller).addEventListener(type, this, !! bubble)
        },
        _unbind: function(type, el, bubble) {
            (el || this.scroller).removeEventListener(type, this, !! bubble)
        },
        destroy: function() {
            var that = this;
            that.scroller.style[vendor + "Transform"] = "", that._unbind(RESIZE_EV, window), that._unbind(START_EV), that._unbind(MOVE_EV), that._unbind(END_EV), that._unbind(CANCEL_EV), that._unbind("mouseout", that.wrapper), that.options.useTransition && that._unbind("webkitTransitionEnd"), that.options.onDestroy && that.options.onDestroy.call(that)
        },
        refresh: function() {
            var offset, that = this;
            that.wrapperW = that.wrapper.clientWidth, that.wrapperH = that.wrapper.clientHeight, that.scrollerW = that.scroller.offsetWidth, that.scrollerH = that.scroller.offsetHeight, that.maxScrollX = that.wrapperW - that.scrollerW, that.maxScrollY = that.wrapperH - that.scrollerH, that.dirX = 0, that.dirY = 0, that.hScroll = that.options.hScroll && 0 > that.maxScrollX, that.vScroll = that.options.vScroll && (!that.options.bounceLock && !that.hScroll || that.scrollerH > that.wrapperH), offset = that._offset(that.wrapper), that.wrapperOffsetLeft = -offset.left, that.wrapperOffsetTop = -offset.top, that.scroller.style[vendor + "TransitionDuration"] = "0", that._resetPos(200)
        },
        scrollTo: function(x, y, time, relative) {
            var i, l, that = this,
                step = x;
            for (that.stop(), step.length || (step = [{
                x: x,
                y: y,
                time: time,
                relative: relative
            }]), i = 0, l = step.length; l > i; i++) step[i].relative && (step[i].x = that.x - step[i].x, step[i].y = that.y - step[i].y), that.steps.push({
                x: step[i].x,
                y: step[i].y,
                time: step[i].time || 0
            });
            that._startAni()
        },
        scrollToElement: function(el, time) {
            var pos, that = this;
            el = el.nodeType ? el : that.scroller.querySelector(el), el && (pos = that._offset(el), pos.left += that.wrapperOffsetLeft, pos.top += that.wrapperOffsetTop, pos.left = pos.left > 0 ? 0 : pos.left < that.maxScrollX ? that.maxScrollX : pos.left, pos.top = pos.top > 0 ? 0 : pos.top < that.maxScrollY ? that.maxScrollY : pos.top, time = void 0 === time ? m.max(2 * m.abs(pos.left), 2 * m.abs(pos.top)) : time, that.scrollTo(pos.left, pos.top, time))
        },
        disable: function() {
            this.stop(), this._resetPos(0), this.enabled = !1, this._unbind(MOVE_EV), this._unbind(END_EV), this._unbind(CANCEL_EV)
        },
        enable: function() {
            this.enabled = !0
        },
        stop: function() {
            cancelFrame(this.aniTime), this.steps = [], this.moved = !1, this.animating = !1
        }
    }, "undefined" != typeof exports ? exports.iScroll = iScroll : window.iScroll = iScroll
}(),
 define("lib/iscroll-lite", [], function() {}),
 define("reader/modules/adapter", ["jquery", "mod/detector", "reader/modules/matchMedia", "lib/iscroll-lite"], function($, detector, matchMedia) {
    function adapter(views) {
        function hideToolbar() {
            panel.hide(), pagination.hide()
        }

        function toggleToolbar() {
            Ark.me.isAnonymous || panel.toggle(), pagination.toggle()
        }

        function fillHeight(height) {
            return Math.ceil(parseInt(height, 10) / lineHeight) * lineHeight
        }

        function articleViewRender() {
            hideToolbar(), articleViewRendered || (fitArticleView(), config.set({
                pageWidth: clientWidth,
                pageHeight: article.pageHeight,
                lineHeight: lineHeight
            }), detector.hasOrientationEvent() && $(window).on("orientationchange", function() {
                location.reload()
            }), articleViewRendered = 1)
        }

        function resizeFigures(data) {
            var typePageWidth = 16 * (clientWidth - 3),
                typePageHeight = 16 * (clientHeight - 5),
                sizeDict = {
                    H: "large",
                    M: "small",
                    S: "tiny"
                };
            data.posts.forEach(function(stories) {
                stories.contents.forEach(function(p) {
                    if ("illus" === p.type) {
                        var data = p.data,
                            size = data.size,
                            dimension = data.dimension,
                            sizeInfo = size[sizeDict[dimension]],
                            w = sizeInfo.width,
                            h = sizeInfo.height,
                            captionOffset = 84;
                        if (typePageHeight >= h + captionOffset && typePageWidth > w) return;
                        w > h ? (sizeInfo.height = Math.round(h * typePageWidth / w), sizeInfo.width = typePageWidth) : (heightWithoutLegend = typePageHeight - captionOffset, sizeInfo.height = heightWithoutLegend, sizeInfo.width = Math.round(w * heightWithoutLegend / h))
                    }
                })
            })
        }

        function fitArticleView() {
            article.$el.css({
                height: clientHeight + "em"
            }).find(".inner").css({
                width: 3 * clientWidth + "em"
            }), article.lineHeight = 16 * lineHeight, article.pageHeight = 16 * fillHeight(clientHeight - 5), article.$el.on("tap", ".page", function(e) {
                "SUP" === e.target.tagName || $(".tips-outer").is(":visible") || toggleToolbar()
            })
        }

        function fitPageView() {
            if (!pageViewRendered) {
                var rangeTimer, tocView = pagination.tocView,
                    toc = tocView.$el;
                toc.css({
                    height: clientHeight + "em"
                }).appendTo(".article"), toc.on("tap", ".close", function() {
                    toc.toggle(), hideToolbar()
                }).on("tap", "ul", function(e) {
                    tocView.tocJump(e), hideToolbar()
                }), pageNumber.$el.on("change", ".page-input", function(e) {
                    clearTimeout(rangeTimer), rangeTimer = setTimeout(function() {
                        var currPage = $(e.currentTarget).val();
                        config.setCurrPage(0 | currPage)
                    }, 200)
                }), pageNumber.formInput.replaceWith($("<input>", {
                    "class": "page-input",
                    type: "range",
                    step: 1,
                    min: 1
                })), pageViewRendered = 1
            }
        }

        function swipePage(e) {
            if ("vertical" !== localStorage.layout) {
                var data = e.originalEvent.data,
                    direction = data.direction,
                    pageMap = {
                        left: "pageNext",
                        right: "pagePrev"
                    };
                switch (direction) {
                    case "left":
                    case "right":
                        pagination[pageMap[direction]].trigger("tap");
                        break;
                    default:
                }
            }
        }

        function fitToc() {
            var toc = pagination.toc,
                tocHead = toc.find(".hd"),
                tocBody = toc.find(".bd"),
                tocFoot = toc.find(".ft"),
                extraHeight = tocHead.innerHeight() + parseInt(tocHead.css("padding-top"), 10) + tocFoot.innerHeight();
            tocBody.height(this.body.height() - extraHeight + "px"), tocScroller = new iScroll("contents-list")
        }

        function updateRangeInput(currPage) {
            var totalPage = config.get("totalPage");
            pagination.pageForm.show(), pagination.$el.find(".page-input").attr({
                max: totalPage,
                value: currPage
            })
        }

        function resetPageSize() {
            if (!$("#page-style").length) {
                var typePageSize = {
                    width: clientWidth - 3 + "rem",
                    height: clientHeight - 5 + "em"
                }, cssContent = "            .page { width: pageWidth; height: pageHeight }            .page .bd { height: contentHeight }            .page .hd, .page .ft { width: contentWidth }          ".replace("pageWidth", typePageSize.width).replace("pageHeight", typePageSize.height).replace("contentHeight", fillHeight(typePageSize.height) + "em").replace("contentWidth", typePageSize.width);
                $("<style>", {
                    id: "page-style",
                    text: cssContent
                }).appendTo("head")
            }
        }
        if (detector.hasTouch()) {
            var ebookView = views.ebook,
                canvas = ebookView.canvas,
                panel = ebookView.panel,
                article = ebookView.article,
                pagination = ebookView.pagination,
                pageNumber = pagination.pageNumber,
                config = ebookView.config;
            canvas.$el.on("swipe", ".inner", swipePage), $(body).on("touchstart", "#froze-mask", function(e) {
                e.preventDefault()
            }), canvas.$el.on("touchmove", function(e) {
                "range" !== e.target.type && "vertical" !== localStorage.layout && e.preventDefault()
            }), fitForMobile && (article.on("view:render", articleViewRender).on("article:init", resetPageSize).on("article:loading", function() {
                article.articleInner.find(".page").css({
                    width: clientWidth - 3 + "rem"
                })
            }).on("paging:start", resizeFigures).on("paging:done", function() {
                var currPage = config.get("currPage");
                updateRangeInput(currPage)
            }), pagination.on("view:render", fitPageView).on("list:render", fitToc).on("toc:toggled", function() {
                tocScroller && tocScroller.refresh()
            }).on("page:updated", function(currPage) {
                updateRangeInput(currPage), hideToolbar()
            }))
        }
    }
    var heightWithoutLegend, doc = document,
        body = doc.body,
        ua = navigator.userAgent,
        isApplePhone = /iPhone/gi.test(ua),
        isChromeApp = /CriOS/gi.test(ua),
        deviceOffset = detector.standalone() ? 0 : isApplePhone && !isChromeApp ? 60 : 0,
        clientWidth = body.clientWidth / 16,
        clientHeight = (body.clientHeight + deviceOffset) / 16,
        fitForMobile = matchMedia("(max-width: 640px)").matches,
        articleViewRendered = 0,
        pageViewRendered = 0,
        tocScroller = "",
        lineHeight = 1.5;
    return adapter
}),
 define("reader/models/page", ["backbone"], function(Backbone) {
    var PageModel = Backbone.Model.extend({
        defaults: {
            pageWidth: 43.375,
            pageGutter: 0,
            pageOffset: 0,
            lineHeight: 2,
            isRecommendation: !1
        },
        initialize: function() {
            this.on("change:currPage", this.setProgressAsCurrPage)
        },
        setProgressAsCurrPage: function(model, currPage) {
            var totalPage = model.get("totalPage");
            model.set("progress", 100 * (currPage / totalPage))
        },
        setCurrPage: function(pageNum, options) {
            this.set({
                currPage: this.pageScope(pageNum)
            }, options)
        },
        setTotalPage: function(pages) {
            this.set({
                totalPage: pages
            })
        },
        pageScope: function(targetPage) {
            var totalPage = this.get("totalPage"),
                page = parseInt(targetPage, 10) || 1;
            return page = 0 >= page ? 1 : page, page = page > totalPage ? totalPage : page
        }
    });
    return PageModel
}),
 define("reader/views/reading/canvas", ["jquery", "backbone", "underscore", "reader/app", "mod/detector", "mod/key", "reader/models/page", "reader/modules/adapter", "reader/modules/toast", "reader/views/reading/panel", "reader/views/reading/article", "reader/views/reading/pagination"], function($, Backbone, _, app, detector, Key, PageModel, adapter, Toast, PanelView, ArticleView, Pagination) {
    var ReadView = Backbone.View.extend({
        el: "#ark-reader",
        initialize: function() {
            _.bindAll(this, "freezePage", "unfreezePage", "changeLayout"), this.vent = _.extend({}, Backbone.Events), localStorage.pageHeight = 768, localStorage.layout = localStorage.layout || "horizontal", this.config = new PageModel, this.panel = new PanelView(app, this.config, this.vent), this.article = new ArticleView(app, this.config, this.vent), this.pagination = new Pagination(app, this.config, this.vent), adapter({
                ebook: {
                    canvas: this,
                    panel: this.panel,
                    article: this.article,
                    pagination: this.pagination,
                    config: this.config
                }
            }), this.win = $(window), this.body = $("body"), this.bindKeyEvents(), this.docElement = $(document.documentElement), this.savingTimer = 0, this.vent.on({
                "page:freeze": this.freezePage,
                "page:unfreeze": this.unfreezePage,
                "page:scrollTop": this.scrollPage,
                "change:layout": this.changeLayout
            }), this.config.on("change:currPage", this.pagination.pageJump).on("change:currPage", this.pagination.saveReadingProgress)
        },
        renderThenOpenAnnotation: function(articleId, rId) {
            var onRender = function(article) {
                article.openAnnotation(rId)
            };
            this.render(articleId, onRender)
        },
        render: function(articleId, onRender) {
            return this.articleId = articleId, this.article.render(articleId, onRender), this.panel.render(articleId), this.pagination.render(this.article.articleInner, this.article.book), app.fitForMobile || this.changeLayout(), this
        },
        changeLayout: function() {
            var layout = localStorage.layout;
            this.$el.toggleClass("layout-vertical", "vertical" === layout), this.panel.changeLayoutBtn(layout), this.pagination.updateProgressBar(), this.pagination.togglePagingBtns(layout), this.pagination.processScrollingEvent(layout), Toast.alert("vertical" === layout ? "垂直阅读模式" : "分页阅读模式")
        },
        show: function() {
            return this.panel.show(), this.key.enable(), this.isShown ? this : (this.docElement.addClass("reading-view"), /msie/i.test(navigator.userAgent) && (this.docElement.on("selectstart.unselectable", function(e) {
                e.preventDefault()
            }), Ark.isAnnotationEnabled && this.docElement.on("selectstart.unselectable", ".content", function(e) {
                e.stopPropagation()
            })), this.isShown = !0, this.$el.show(), "vertical" === this.config.get("layout") && this.win.on("scroll", this.pagination.verticalScroll), this)
        },
        hide: function() {
            if (this.panel.hide(), !this.isShown) return this;
            this.key.disable(), this.win.off("scroll"), this.win.off("resize"), this.docElement.removeClass("reading-view"), /msie/i.test(navigator.userAgent) && this.docElement.off(".unselectable"), this.pagination.closeTips(), this.pagination.removeProgressBar(), this.$el.hide(), this.isShown = !1, $(".tips-outer").remove();
            try {
                localStorage.previousAid = this.articleId
            } catch (e) {}
            return this
        },
        scrollPage: function(top, duration) {
            duration = duration || 300, $("html, body").animate({
                scrollTop: top
            }, duration)
        },
        freezePage: function() {
            this.key.disable(), this.$el.after('<div id="froze-mask">')
        },
        unfreezePage: function() {
            this.key.enable(), $("#froze-mask").remove()
        },
        changeFullscreenStyle: function() {
            this.panel.toggle(), this.panel.hideBubble(), this.pagination.closeTips()
        },
        bindKeyEvents: function() {
            var self = this,
                lineHeight = 16 * this.config.get("lineHeight") + "px";
            this.key = Key(), this.key.down(["j", "right"], function() {
                self.pagination.pageNext.trigger("click")
            }).down(["k", "left"], function() {
                self.pagination.pagePrev.trigger("click")
            }).down(["down"], function(e) {
                e.preventDefault(), self.scrollPage("+=" + lineHeight, 100)
            }).down(["up"], function(e) {
                e.preventDefault(), self.scrollPage("-=" + lineHeight, 100)
            }).down("shift+g", function() {
                self.config.setCurrPage(self.config.get("totalPage"))
            }).down("g->g", function() {
                self.config.setCurrPage(1)
            }).down("esc", function() {
                self.pagination.closeTips(), self.pagination.closePopups()
            }).down("shift+/", function() {
                self.panel.helperBtn.trigger("click")
            }).down("/", function(e) {
                e.preventDefault(), self.pagination.pageNumber.trigger("view:openPageForm")
            }).down("t->l", function() {
                self.pagination.tocSwitcher.trigger("click")
            }).down("n->t", function() {
                self.panel.backBtn.trigger("click")
            }).down(["meta+shift+f", "f11"], function() {
                self.changeFullscreenStyle()
            }).down(["ctrl+a", "meta+a"], function(e) {
                return e.preventDefault(), !1
            }).down(["ctrl+c", "meta+c"], function(e) {
                return e.preventDefault(), !1
            })
        }
    });
    return ReadView
}),
 define("reader/modules/exclusive_set", ["underscore", "backbone"], function(_, Backbone) {
    function ExclusiveSet(elements) {
        this.elements = elements, this.currentIndex = undef
    }
    var undef;
    return _.extend(ExclusiveSet.prototype, Backbone.Events, {
        select: function(index) {
            if (this.currentIndex !== index) {
                this.deselect(this.currentIndex), this.currentIndex = index;
                var elem = this.elements[index];
                this.trigger("select", elem, index)
            }
        },
        deselect: function(index) {
            if (this.currentIndex === index && index !== undef) {
                this.currentIndex = undef;
                var elem = this.elements[index];
                this.trigger("deselect", elem, index)
            }
        },
        deselectAll: function() {
            this.deselect(this.currentIndex)
        }
    }), ExclusiveSet
}),
 define("reader/views/library_filter_tabs", ["backbone", "underscore", "reader/modules/exclusive_set"], function(Backbone, _, ES) {
    return Backbone.View.extend({
        initialize: function() {
            this.tabs = _(this.$el.find("[data-tab-name]").toArray()).chain().map(function(tabHandle) {
                return this.$(tabHandle)
            }, this).reduce(function(memo, tabHandle) {
                var key = tabHandle.data("tab-name");
                return memo[key] = tabHandle, memo
            }, {}).value(), this.tabSet = new ES(this.tabs), this.bindEvents(), this.initSelect()
        },
        events: {
            "click [data-filter]": "filterHandler"
        },
        activatedClass: "shown",
        deactivatedClass: "hidden",
        bindEvents: function() {
            var tabSet = this.tabSet;
            tabSet.bind("select", function(tabHandle) {
                tabHandle.addClass(this.activatedClass).removeClass(this.deactivatedClass)
            }, this), tabSet.bind("deselect", function(tabHandle) {
                tabHandle.removeClass(this.activatedClass).addClass(this.deactivatedClass)
            }, this)
        },
        filterHandler: function(e) {
            var key = $(e.target).data("filter");
            this.select(key)
        },
        initSelect: function() {
            var defaultSelectedElem = _.find(this.tabs, function(tab) {
                return tab.hasClass(this.activatedClass)
            }, this),
                defaultSelectedIndex = _(this.tabs).chain().keys().find(function(key) {
                    return this.tabs[key] === defaultSelectedElem
                }, this).value();
            this.tabSet.select(-1 === defaultSelectedIndex ? 0 : defaultSelectedIndex)
        },
        select: function(key) {
            this.tabSet.select(key)
        }
    })
}),
 define("reader/views/navigation", ["backbone"], function(Backbone) {
    var Navigation = Backbone.View.extend({
        el: ".reader-navigation",
        render: function() {
            return this.isRendered = !0, this
        },
        show: function() {
            return this.isShown === !0 ? this : (this.isRendered || this.render(), this.isShown = !0, this.$el.show(), this)
        },
        hide: function() {
            return this.isShown === !1 ? this : (this.isShown = !1, this.$el.hide(), this)
        }
    });
    return Navigation
}),
 define("reader/modules/assert", [], function() {
    return function(predicate, msg) {
        if (!predicate) throw Error(msg)
    }
}),
 define("reader/modules/stars", ["underscore"], function(_) {
    function stars(num, max) {
        return stars.progress(num, max, "★", "☆")
    }
    return stars.progress = function(num, max, positiveChar, negativeChar) {
        max = max || 5;
        var remaining = max - num,
            result = "";
        return _(num).times(function() {
            result += positiveChar
        }), _(remaining).times(function() {
            result += negativeChar
        }), result
    }, stars.repeat = function(times, c) {
        var result = "";
        return _(times).times(function() {
            result += c
        }), result
    }, stars
}),
 define("reader/modules/article_presenter", ["reader/modules/stars", "reader/modules/assert", "underscore"], function(stars, assert, _) {
    function leftPad(str, padding, length) {
        assert(_.isString(padding)), assert(_.isNumber(length));
        var padded = stars.repeat(length, padding) + str;
        return padded.slice(-length)
    }
    return {
        url: function() {
            return "/reader/ebook/" + this.data.id + "/"
        },
        ratingAsInt: function() {
            return parseInt(this.data.rating.rating, 10)
        },
        isPublished: function() {
            return !!this.data.publishedDate
        },
        publishedDate: function() {
            var d = new Date(1e3 * this.data.publishedDate),
                year = d.getFullYear(),
                month = leftPad(d.getMonth() + 1, "0", 2),
                day = leftPad(d.getDate(), "0", 2);
            return [year, month, day].join("-")
        }
    }
}),
 define("reader/modules/progress_dots", ["underscore", "reader/modules/stars"], function(_, stars) {
    var blackCircle = "●",
        dot = "•";
    return {
        progressPositiveDots: function() {
            var p = Math.round(10 * this.data.progress);
            return stars.repeat(p, blackCircle)
        },
        progressNegativeDots: function() {
            var p = Math.round(10 * this.data.progress);
            return stars.repeat(10 - p, dot)
        },
        progressPercent: function() {
            return Math.round(100 * this.data.progress) + "%"
        }
    }
}),
 define("reader/views/article_my_work_item", ["underscore", "jquery", "backbone", "reader/modules/stars", "reader/modules/progress_dots", "reader/modules/article_presenter", "reader/modules/template"], function(_, $, Backbone, stars, progressDots, articlePresenter, tmpl) {
    return Backbone.View.extend({
        tagName: "li",
        template: $("#article-my-work-item").html(),
        initialize: function() {
            this.model.bind("change:progress", this.render, this), this.model.bind("change:reviewCount", this.render, this), this.model.bind("change:totalPages", this.render, this)
        },
        render: function() {
            var articleData = this.model.toJSON();
            return this.$el.html(tmpl(this.template, articleData, this.presenter)), this
        },
        presenter: _.extend({}, progressDots, articlePresenter)
    })
}),
 define("ui/dialog_new", ["jquery", "ui/overlay", "mod/emitter"], function($, overlay, Emitter) {
    function Dialog(opts) {
        Emitter.call(this);
        var self = this;
        this.opts = opts, this.el = $(tmpl), this.text = this.el.find(".k-text"), this.head = this.el.find(".dialog-hd"), this.buttons = this.el.find(".k-buttons"), this.btnClose = this.el.find(".k-close"), this.closable = void 0 !== opts.closable ? !! opts.closable : !0, this.overlay = overlay({
            closable: this.closable
        }), this.render(), doc.on("click.close", ".k-close", function() {
            self.close()
        }).on("click.confirm", "[data-confirm]", function(e) {
            var action = !! $(e.currentTarget).data("confirm");
            self.emit(action ? "confirm" : "cancel"), action || self.close()
        })
    }

    function exports(opts) {
        return opts = opts || {}, new exports.Dialog(opts)
    }
    var tmpl = '<div id="ark-dialog"><div class="dialog-hd"><a href="#" class="k-close">&times;</a></div><div class="dialog-bd"><div class="k-text"></div><div class="k-buttons"></div></div></div>',
        tmplBtns = '<button class="btn btn-large" data-confirm="1">确定</button><button class="btn btn-minor btn-large" data-confirm="0">取消</button>',
        doc = $(document);
    return $.extend(Dialog.prototype, {
        render: function() {
            var title = this.opts.title,
                foot = this.opts.foot;
            this.text.html(this.opts.content), this.closable || this.btnClose.remove(), title && this.setTitle(title), foot && this.setFoot(foot), this.setButtons(), this.overlay.setBody(this.el)
        },
        setTitle: function(title) {
            return this.head.prepend($("<span>", {
                "class": "k-title",
                text: title
            })), this
        },
        setFoot: function(content) {
            return this.el.append($("<div>", {
                "class": "dialog-ft",
                html: content
            })), this
        },
        setButtons: function(config) {
            config = config || [];
            var type = this.opts.type,
                btnText = ["确定", "取消"],
                btnNum = config.length;
            if (/confirm|tips/i.test(type)) {
                this.buttons[0].innerHTML = tmplBtns;
                for (var buttons = this.buttons.find("button"), i = 0; btnNum > i; i++) buttons.eq(i).text(config[i].text || btnText[i]).addClass(config[i]["class"] || "");
                "tips" === type && $(buttons[1]).remove()
            }
            return "custom" === type && (this.buttons[0].innerHTML = config), this
        },
        addClass: function(name) {
            return this.el.addClass(name), this
        },
        open: function() {
            return this.overlay.open(), this.emit("open"), this
        },
        close: function() {
            return this.overlay.close(), this.emit("close"), doc.off(".confirm"), this
        }
    }), Emitter(Dialog.prototype), exports.Dialog = Dialog, exports
}),
 define("reader/views/article_item", ["jquery", "backbone", "underscore", "reader/modules/stars", "reader/modules/progress_dots", "reader/modules/article_presenter", "reader/modules/template", "ui/dialog_new", "mod/cookie"], function($, Backbone, _, stars, progressDots, articlePresenter, tmpl, dialog, cookie) {
    var VProto = Backbone.View.prototype,
        ArticleItemView = Backbone.View.extend({
            tagName: "li",
            template: $("#article-item").html(),
            initialize: function() {
                this.model.on("change:rating", this.render, this), this.model.on("change:progress", this.render, this), this.model.on("change:totalPages", this.render, this), this.tmplArchiveTips = $("#tmpl-archive-tips").html(), this.tmplNotPrompt = $("#tmpl-not-prompt").html()
            },
            events: {
                "click .btn-archive": "archive"
            },
            render: function() {
                var articleData = this.model.toJSON();
                return articleData.rating = this.model.getRating().toJSON(), this.$el.html(tmpl(this.template, articleData, this.presenter)), this
            },
            archive: function() {
                function actionArchive() {
                    self.model.archive().done(function() {
                        self.$el.fadeOut(function() {
                            self.remove()
                        })
                    }).fail(function() {
                        alert("服务器开小差了，稍候再试吧。")
                    })
                }
                var self = this;
                if (cookie("nat")) return actionArchive(), this;
                var archiveConfirm = dialog({
                    type: "confirm",
                    title: "确定删除",
                    content: this.tmplArchiveTips,
                    foot: this.tmplNotPrompt
                }).open();
                archiveConfirm.addClass("confirm-archive").on("confirm", function() {
                    $("#not-prompt").prop("checked") ? cookie("nat", 1, {
                        "max-age": 31536e4
                    }) : cookie.remove("nat"), actionArchive(), this.close()
                })
            },
            presenter: {},
            remove: function() {
                VProto.remove.apply(this, arguments), this.trigger("remove")
            }
        });
    return _.extend(ArticleItemView.prototype.presenter, progressDots, articlePresenter), ArticleItemView
}),
 define("reader/views/article_list", ["backbone", "underscore", "jquery", "reader/views/article_item", "reader/views/article_my_work_item"], function(Backbone, _, $, ArticleItemView, MyWorkItemView) {
    function getTimeForSorting(article) {
        return article.get("lastReadTime") || article.get("purchaseTime")
    }
    return Backbone.View.extend({
        initialize: function(options) {
            this.myBookshelf = options.app.myBookshelf
        },
        emptyReadingListTmpl: $("#empty-reading-list").html(),
        filters: {
            all: function(a) {
                return a
            },
            myWorks: function(a) {
                return a.get("isMyWork")
            },
            myPurchase: function(a) {
                return !a.get("isMyWork") && !a.get("isArchived")
            }
        },
        views: {
            all: ArticleItemView,
            myWorks: MyWorkItemView,
            myPurchase: ArticleItemView
        },
        sorting: {
            myWorks: function(a, b) {
                var aPubDate = a.get("publishedDate"),
                    bPubDate = b.get("publishedDate");
                return aPubDate ? bPubDate ? aPubDate >= bPubDate ? -1 : 1 : 1 : -1
            },
            myPurchase: function(a, b) {
                var aTime = getTimeForSorting(a),
                    bTime = getTimeForSorting(b);
                return aTime >= bTime ? -1 : 1
            }
        },
        render: function(options) {
            if (options = _.extend({
                filter: "myPurchase"
            }, options), Ark.me.isAnonymous) return this.renderAsEmpty(), this.$el.show(), this;
            var count, filter = this.filters[options.filter],
                viewClass = this.views[options.filter],
                sorting = this.sorting[options.filter] || function() {
                    return -1
                };
            this.$el.empty().hide(), this.myBookshelf.chain().filter(filter).sort(sorting).tap(function(s) {
                count = s.length
            }).forEach(function(article, index) {
                var view = new viewClass({
                    model: article,
                    className: "article-item " + (index % 2 ? "" : "article-odd")
                });
                view.on("remove", this.renderAsEmptyIfEmpty, this), this.$el.append(view.render().el)
            }, this), "myPurchase" !== options.filter || count || this.renderAsEmpty(), this.$el.show()
        },
        renderAsEmpty: function() {
            this.$el.append($("<li />").append(this.emptyReadingListTmpl))
        },
        renderAsEmptyIfEmpty: function() {
            var articleCount = this.$el.children().length;
            articleCount || this.renderAsEmpty()
        }
    })
}),
 define("reader/views/home", ["underscore", "backbone", "jquery", "reader/app", "mod/detector", "reader/views/article_list", "reader/views/navigation", "reader/views/library_filter_tabs"], function(_, Backbone, $, app, detector, ArticleListView, Navigation, LibraryFilterTabs) {
    var HomeView = Backbone.View.extend({
        el: "#home",
        events: {
            "click [data-filter]": "filterHandler"
        },
        initialize: function() {
            _.bindAll(this, "swipeBookItem", "resizeBookshelf"), this.clientInfo = app.clientInfo, this.bookListContainer = this.$el.find(".bookshelf"), this.navigation = new Navigation, this.documentRoot = $(document.documentElement), this.myBookshelf = app.myBookshelf, this.tabs = new LibraryFilterTabs({
                el: this.$el.find(".library-filter-tabs").get(0)
            }), app.fitForMobile && (this.resizeBookshelf(), detector.hasOrientationEvent() && $(window).on("orientationchange", this.resizeBookshelf))
        },
        resizeBookshelf: function() {
            var body = document.body,
                headerHeight = this.$el.find(".library-heading").height();
            this.$el.find("#bookshelf").css({
                height: body.clientHeight + app.deviceOffset - headerHeight + "px"
            })
        },
        swipeBookItem: function(e) {
            var data = e.originalEvent.data,
                CSS_ACTIONS = ".article-actions";
            this.$el.find(CSS_ACTIONS).hide(), $(e.currentTarget).find(CSS_ACTIONS)["left" === data.direction ? "fadeIn" : "hide"]()
        },
        dealingWithDevice: function() {
            if (this.listScroll) return this.listScroll.refresh();
            var ua = navigator.userAgent,
                isMobile = /iPhone|Android|iPad/gi.test(ua),
                isPad = /iPad/gi.test(ua);
            isMobile && require(["reader/modules/hide_addressbar", "lib/iscroll-lite"], $.proxy(function(hideAddressBar) {
                this.$el.on("touchmove", function(e) {
                    e.preventDefault()
                }).find(".library-heading").on("touchmove", function(e) {
                    e.stopPropagation()
                }), hideAddressBar(isPad), this.listScroll = new iScroll("bookshelf", {
                    onScrollStart: function() {
                        hideAddressBar(isPad)
                    }
                }), this.$el.on("swipe", ".article-item", this.swipeBookItem)
            }, this))
        },
        show: function(subPage) {
            return this.isShown === !0 && this.subPage === subPage ? this : (document.title = "我的阅读器", this.documentRoot.addClass("library-view"), this.isShown = !0, this.subPage = subPage, this.$el.show(), this.navigation.show(), Ark.me.isAnonymous ? (new ArticleListView({
                app: app,
                el: this.bookListContainer
            }).render(), setTimeout(function() {
                $("[data-target-dialog]").trigger("click")
            }, 0), this) : (this.fetchArticles().done(_.bind(function() {
                new ArticleListView({
                    app: app,
                    el: this.bookListContainer
                }).render(), this.tabs.select("myPurchase"), this.dealingWithDevice()
            }, this)).fail(function() {
                alert("出现了奇怪的错误，稍候再试吧。")
            }), this))
        },
        hide: function() {
            return this.isShown === !1 ? this : (this.documentRoot.removeClass("library-view"), this.isShown = !1, this.$el.hide(), this.navigation.hide(), this.bookListContainer.empty(), this)
        },
        fetchArticles: function(options) {
            return this.articlesFetched ? (new $.Deferred).resolve() : (this.articlesFetched = !0, this.myBookshelf.fetch(_.extend({
                add: !0
            }, options)).done($.proxy(function() {
                var me = app.me,
                    myOwnWorks = this.myBookshelf.filter(me.isAuthorOf, me);
                myOwnWorks.length || this.$el.addClass("poor-author-without-works")
            }, this)))
        },
        filterHandler: function(e) {
            var filterType = e ? this.$(e.target).data("filter") : "all";
            new ArticleListView({
                app: app,
                el: this.bookListContainer
            }).render({
                filter: filterType
            })
        }
    });
    return HomeView
}),
 define("reader/main", ["jquery", "backbone", "underscore", "reader/app", "reader/views/home", "reader/views/reading/canvas", "reader/collections/articles", "reader/router", "mod/bbsync", "mod/detector", "reader/modules/matchMedia", "reader/modules/storage_manager", "reader/modules/open_login_and_signup", "reader/models/user"], function($, Backbone, _, app, HomeView, ReadView, Articles, Router, BBSync, detector, matchMedia, storageManager, openLoginAndSignup, User) {
    function initialize() {
        Backbone.sync = BBSync, storageManager.checkStorageVersion(), _.extend(app, {
            me: new User(Ark.me),
            navigate: function() {
                var router = app.router;
                router && router.navigate.apply(router, arguments)
            }
        });
        var ua = navigator.userAgent,
            isAnonymous = Ark.me.isAnonymous,
            fitForMobile = matchMedia("(max-width: 640px)").matches,
            isApplePhone = /iPhone/gi.test(ua),
            isChromeApp = /CriOS/gi.test(ua),
            isDesktopWindows = /Window NT/gi.test(ua) && !/ARM/gi.test(ua),
            deviceOffset = isApplePhone && !isChromeApp ? 60 : 0,
            html = $("html");
        app.deviceOffset = deviceOffset, app.fitForMobile = fitForMobile, app.fitForDesktop = !detector.hasTouch() || isDesktopWindows, app.fitForDesktop && html.addClass("fit-for-desktop"), isAnonymous || (app.myBookshelf = new Articles([], {
            urlSuffix: "bookshelf"
        })), $.extend(app, {
            homeView: new HomeView,
            readView: new ReadView
        }), isAnonymous ? Router.initialize(app) : app.homeView.fetchArticles().done(function() {
            Router.initialize(app)
        }).fail(function() {
            alert("出现了奇怪的错误，稍候再试吧。")
        });
        var body = $("body");
        body.on("click", 'a[href="#"]', function(e) {
            e.preventDefault()
        }).on("contextmenu dragstart", "img", function(e) {
            e.preventDefault()
        }).on("click", "[data-target-dialog=login]", function() {
            var closable = $(this).data("closable");
            openLoginAndSignup({
                closable: closable
            })
        }), /msie 8/i.test(navigator.userAgent) && body.on("selectstart", function() {
            return !1
        })
    }
    return {
        initialize: initialize
    }
})
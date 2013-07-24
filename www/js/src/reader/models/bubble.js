// "reader/modules/bubble"

define(["jquery", "underscore", "backbone"], function($, _, Backbone) {
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
    }//, Bubble
});
define(["jquery", "backbone", "underscore", "reader/views/reading/mixins/panel", "reader/modules/ga"], function($, Backbone, _, Panel, ga) {
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
});
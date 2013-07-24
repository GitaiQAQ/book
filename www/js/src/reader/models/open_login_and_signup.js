define(["jquery", "underscore"], function($, _) {
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
});
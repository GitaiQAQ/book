define(function() {
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
});
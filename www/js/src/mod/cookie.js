define(function() {
    function get(name) {
        var value = document.cookie.match(RegExp("(?:\\s|^)" + name + "\\=([^;]*)"));
        return value ? decodeURIComponent(value[1]) : null
    }

    function set(name, value, options) {
        options = options || {};
        var date, expires, expiresGMTString, pair = name + "=" + encodeURIComponent(value),
            path = options.path ? "; path=" + options.path : "",
            domain = options.domain ? "; domain=" + options.domain : "",
            maxage = options["max-age"],
            secure = options.secure ? "; secure" : "";
        options.expires ? expiresGMTString = options.expires : maxage && (date = new Date, date.setTime(date.getTime() + 1e3 * maxage), expiresGMTString = date.toGMTString()), expiresGMTString && (expires = "; expires=" + expiresGMTString), document.cookie = [pair, expires, path, domain, secure].join("")
    }

    function remove(name) {
        set(name, "", {
            "max-age": 0
        })
    }
    var cookie = function(name, value, options) {
        return 1 === arguments.length ? get(name) : set(name, value, options)
    };
    return cookie.get = get, cookie.set = set, cookie.remove = remove, cookie
});
(function() {
    function define(name, deps, block) {
        var is_remote = "string" == typeof block;
        block || (deps ? isArray(deps) ? block = filesuffix(realname(basename(name))) : (block = deps, deps = null) : (block = name, name = ""), "string" != typeof name ? (deps = name, name = "") : (is_remote = "string" == typeof block, is_remote || deps || (deps = seek(block)))), name = name && realname(name);
        var mod = name && _config.mods[name];
        if (_config.debug || !mod || !mod.name || !(is_remote && 2 == mod.loaded || mod.exports)) {
            is_remote && _config.enable_ozma && (deps = null);
            var host = isWindow(this) ? this : window;
            if (mod = _config.mods[name] = {
                name: name,
                url: mod && mod.url,
                host: host,
                deps: deps || []
            }, "" === name && (_latest_mod = mod), "string" != typeof block) mod.block = block, mod.loaded = 2;
            else {
                var alias = _config.aliases;
                alias && (block = block.replace(/\{(\w+)\}/g, function(e1, e2) {
                    return alias[e2] || ""
                })), mod.url = block
            }
            mod.block && !isFunction(mod.block) && (mod.exports = block)
        }
    }

    function require(deps, block, _self_mod) {
        if ("string" == typeof deps) {
            if (!block) return (_config.mods[realname(basename(deps, _scope))] || {}).exports;
            deps = [deps]
        } else block || (block = deps, deps = seek(block));
        var host = isWindow(this) ? this : window;
        _self_mod || (_self_mod = {
            url: _scope && _scope.url
        });
        for (var m, remotes = 0, list = scan.call(host, deps, _self_mod), i = 0, l = list.length; l > i; i++) m = list[i], m.is_reset && (m = _config.mods[m.name]), m.url && 2 !== m.loaded && (remotes++, m.loaded = 1, fetch(m, function() {
            this.loaded = 2;
            var lm = _latest_mod;
            lm && (lm.name = this.name, lm.url = this.url, _config.mods[this.name] = lm, _latest_mod = null), 0 >= --remotes && require.call(host, deps, block, _self_mod)
        }));
        remotes || (_self_mod.deps = deps, _self_mod.host = host, _self_mod.block = block, setTimeout(function() {
            tidy(deps, _self_mod), list.push(_self_mod), exec(list.reverse())
        }, 0))
    }

    function exec(list) {
        for (var mod, mid, tid, result, isAsync, deps, depObjs, exportObj, moduleObj, rmod, wt = _waitings; mod = list.pop();)
            if (mod.is_reset ? (rmod = clone(_config.mods[mod.name]), rmod.host = mod.host, rmod.newname = mod.newname, mod = rmod, _resets[mod.newname] || (_resets[mod.newname] = []), _resets[mod.newname].push(mod), mod.exports = void 0) : mod.name && (mod = _config.mods[mod.name] || mod), mod.block && (mod.running || void 0 === mod.exports)) {
                depObjs = [], exportObj = {}, moduleObj = {
                    id: mod.name,
                    filename: mod.url,
                    exports: exportObj
                }, deps = mod.deps.slice(), deps[mod.block.hiddenDeps ? "unshift" : "push"]("require", "exports", "module");
                for (var i = 0, l = deps.length; l > i; i++) switch (mid = deps[i]) {
                    case "require":
                        depObjs.push(require);
                        break;
                    case "exports":
                        depObjs.push(exportObj);
                        break;
                    case "module":
                        depObjs.push(moduleObj);
                        break;
                    case "host":
                        depObjs.push(mod.host);
                        break;
                    case "finish":
                        tid = mod.name, wt[tid] ? wt[tid].push(list) : wt[tid] = [list], depObjs.push(function(result) {
                            setTimeout(function() {
                                void 0 !== result && (mod.exports = result), wt[tid] && (forEach.call(wt[tid], function(list) {
                                    this(list)
                                }, exec), delete wt[tid], mod.running = 0)
                            }, 0)
                        }), isAsync = 1;
                        break;
                    default:
                        depObjs.push(((_resets[mid] || []).pop() || _config.mods[realname(mid)] || {}).exports)
                }
                if (!mod.running) {
                    _scope = mod, result = mod.block.apply(mod.host, depObjs) || null, _scope = !1, exportObj = moduleObj.exports, mod.exports = void 0 !== result ? result : exportObj;
                    for (var v in exportObj) {
                        v && (mod.exports = exportObj);
                        break
                    }
                }
                if (isAsync) {
                    mod.running = 1;
                    break
                }
            }
    }

    function fetch(m, cb) {
        var url = m.url,
            observers = _scripts[url];
        if (observers) 1 === observers ? cb.call(m) : observers.push([cb, m]);
        else {
            var mname = m.name,
                delays = _delays;
            if (m.deps && m.deps.length && 1 !== delays[mname]) {
                if (delays[mname] = [m.deps.length, cb], m.deps.forEach(function(dep) {
                    var d = _config.mods[realname(dep)];
                    1 !== this[dep] && d.url && 2 !== d.loaded ? (this[dep] || (this[dep] = []), this[dep].push(m)) : delays[mname][0]--
                }, _refers), delays[mname][0] > 0) return;
                delays[mname] = 1
            }
            observers = _scripts[url] = [
                [cb, m]
            ];
            var true_url = /^\w+:\/\//.test(url) ? url : (_config.enable_ozma && _config.distUrl || _config.baseUrl || "") + (_config.enableAutoSuffix ? namesuffix(url) : url);
            getScript.call(m.host || this, true_url, function() {
                forEach.call(observers, function(args) {
                    args[0].call(args[1])
                }), _scripts[url] = 1, _refers[mname] && 1 !== _refers[mname] && (_refers[mname].forEach(function(dm) {
                    var b = this[dm.name];
                    0 >= --b[0] && (this[dm.name] = 1, fetch(dm, b[1]))
                }, delays), _refers[mname] = 1)
            })
        }
    }

    function scan(m, file_mod, list) {
        if (list = list || [], !m[0]) return list;
        var deps, history = list.history;
        if (history || (history = list.history = {}), m[1]) deps = m, m = !1;
        else {
            var truename, _mid = m[0],
                plugin = _RE_PLUGIN.exec(_mid);
            plugin && (_mid = plugin[2], plugin = plugin[1]);
            var mid = realname(_mid);
            if (!_config.mods[mid] && !_builtin_mods[mid]) {
                var true_mid = realname(basename(_mid, file_mod));
                mid !== true_mid && (_config.mods[file_mod.url + ":" + mid] = true_mid, mid = true_mid), _config.mods[true_mid] || define(true_mid, filesuffix(true_mid))
            }
            if (m = file_mod = _config.mods[mid], !m) return list;
            if ("new" === plugin ? m = {
                is_reset: !0,
                deps: m.deps,
                name: mid,
                newname: plugin + "!" + mid,
                host: this
            } : truename = m.name, history[truename]) return list;
            history[truename] ? deps = [] : (deps = m.deps || [], truename && (history[truename] = !0))
        }
        for (var i = deps.length - 1; i >= 0; i--) history[deps[i]] || scan.call(this, [deps[i]], file_mod, list);
        return m && (tidy(deps, m), list.push(m)), list
    }

    function seek(block) {
        var hdeps = block.hiddenDeps || [];
        if (!block.hiddenDeps) {
            var code = "" + block,
                h = null;
            for (hdeps = block.hiddenDeps = []; h = _RE_DEPS.exec(code);) hdeps.push(h[0].slice(10, -2))
        }
        return hdeps.slice()
    }

    function tidy(deps, m) {
        forEach.call(deps.slice(), function(dep, i) {
            var true_mid = this[m.url + ":" + realname(dep)];
            "string" == typeof true_mid && (deps[i] = true_mid)
        }, _config.mods)
    }

    function config(opt) {
        for (var i in opt)
            if ("aliases" === i) {
                _config[i] || (_config[i] = {});
                for (var j in opt[i]) _config[i][j] = opt[i][j];
                var mods = _config.mods;
                for (var k in mods) mods[k].name = realname(k), mods[mods[k].name] = mods[k]
            } else _config[i] = opt[i]
    }

    function namesuffix(file) {
        return file.replace(/(.+?)(_src.*)?(\.\w+)$/, function($0, $1, $2, $3) {
            return $1 + ($2 && "_combo" || "_pack") + $3
        })
    }

    function filesuffix(mid) {
        return _RE_SUFFIX.test(mid) ? mid : mid + ".js"
    }

    function realname(mid) {
        var alias = _config.aliases;
        return alias && (mid = mid.replace(_RE_ALIAS_IN_MID, function(e1, e2) {
            return alias[e2] || e2 + "/"
        })), mid
    }

    function basename(mid, file_mod) {
        var rel_path = _RE_RELPATH.exec(mid);
        return rel_path && file_mod && (mid = (file_mod.url || "").replace(/[^\/]+$/, "") + rel_path[0]), resolvename(mid)
    }

    function resolvename(url) {
        url = url.replace(_RE_DOT, "$1");
        for (var dots, dots_n, url_dup = url, RE_DOTS = /(\.\.\/)+/g; dots = (RE_DOTS.exec(url_dup) || [])[0];) dots_n = dots.match(/\.\.\//g).length, url = url.replace(RegExp("([^/\\.]+/){" + dots_n + "}" + dots), "");
        return url.replace(/\/\//g, "/")
    }

    function getScript(url, op) {
        var doc = isWindow(this) ? this.document : document,
            s = doc.createElement("script");
        s.type = "text/javascript", s.async = "async", op ? isFunction(op) && (op = {
            callback: op
        }) : op = {}, op.charset && (s.charset = op.charset), s.src = url;
        var h = doc.getElementsByTagName("head")[0];
        s.onload = s.onreadystatechange = function(__, isAbort) {
            (isAbort || !s.readyState || /loaded|complete/.test(s.readyState)) && (s.onload = s.onreadystatechange = null, h && s.parentNode && h.removeChild(s), s = void 0, !isAbort && op.callback && op.callback())
        }, h.insertBefore(s, h.firstChild)
    }

    function isFunction(obj) {
        return "[object Function]" === _toString.call(obj)
    }

    function isArray(obj) {
        return "[object Array]" === _toString.call(obj)
    }

    function isWindow(obj) {
        return "setInterval" in obj
    }

    function clone(obj) {
        function NewObj() {}
        return NewObj.prototype = obj, new NewObj
    }
    var _latest_mod, _scope, window = this,
        _toString = Object.prototype.toString,
        _RE_PLUGIN = /(.*)!(.+)/,
        _RE_DEPS = /\Wrequire\((['"]).+?\1\)/g,
        _RE_SUFFIX = /\.(js|json)$/,
        _RE_RELPATH = /^\.+?\/.+/,
        _RE_DOT = /(^|\/)\.\//g,
        _RE_ALIAS_IN_MID = /^([\w\-]+)\//,
        _builtin_mods = {
            require: 1,
            exports: 1,
            module: 1,
            host: 1,
            finish: 1
        }, _config = {
            mods: {}
        }, _scripts = {}, _delays = {}, _refers = {}, _waitings = {}, _resets = {}, forEach = Array.prototype.forEach || function(fn, sc) {
            for (var i = 0, l = this.length; l > i; i++) i in this && fn.call(sc, this[i], i, this)
        }, oz = {
            VERSION: "2.5.1",
            define: define,
            require: require,
            config: config,
            seek: seek,
            fetch: fetch,
            realname: realname,
            basename: basename,
            filesuffix: filesuffix,
            namesuffix: namesuffix,
            _getScript: getScript,
            _clone: clone,
            _forEach: forEach,
            _isFunction: isFunction,
            _isWindow: isWindow
        };
    if (require.config = config, define.amd = {
        jQuery: !0
    }, window.window) window.oz = oz, window.define = define, window.require = require;
    else {
        exports.oz = oz, exports._config = _config;
        for (var i in oz) exports[i] = oz[i];
        var hooking = function(fname) {
            return function() {
                return exports[fname].apply(this, arguments)
            }
        };
        exec = hooking("exec"), fetch = hooking("fetch"), require = hooking("require"), require.config = config
    }
})(), require.config({
    enable_ozma: !0
}), define("mod/cookie", function() {
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
}), /*! * jQuery JavaScript Library v1.10.1 * http://jquery.com/ * * Includes Sizzle.js * http://sizzlejs.com/ * * Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors * Released under the MIT license * http://jquery.org/license * * Date: 2013-05-30T21:49Z */
function(window, undefined) {
    function isArraylike(obj) {
        var length = obj.length,
            type = jQuery.type(obj);
        return jQuery.isWindow(obj) ? !1 : 1 === obj.nodeType && length ? !0 : "array" === type || "function" !== type && (0 === length || "number" == typeof length && length > 0 && length - 1 in obj)
    }

    function createOptions(options) {
        var object = optionsCache[options] = {};
        return jQuery.each(options.match(core_rnotwhite) || [], function(_, flag) {
            object[flag] = !0
        }), object
    }

    function internalData(elem, name, data, pvt) {
        if (jQuery.acceptData(elem)) {
            var ret, thisCache, internalKey = jQuery.expando,
                isNode = elem.nodeType,
                cache = isNode ? jQuery.cache : elem,
                id = isNode ? elem[internalKey] : elem[internalKey] && internalKey;
            if (id && cache[id] && (pvt || cache[id].data) || data !== undefined || "string" != typeof name) return id || (id = isNode ? elem[internalKey] = core_deletedIds.pop() || jQuery.guid++ : internalKey), cache[id] || (cache[id] = isNode ? {} : {
                toJSON: jQuery.noop
            }), ("object" == typeof name || "function" == typeof name) && (pvt ? cache[id] = jQuery.extend(cache[id], name) : cache[id].data = jQuery.extend(cache[id].data, name)), thisCache = cache[id], pvt || (thisCache.data || (thisCache.data = {}), thisCache = thisCache.data), data !== undefined && (thisCache[jQuery.camelCase(name)] = data), "string" == typeof name ? (ret = thisCache[name], null == ret && (ret = thisCache[jQuery.camelCase(name)])) : ret = thisCache, ret
        }
    }

    function internalRemoveData(elem, name, pvt) {
        if (jQuery.acceptData(elem)) {
            var thisCache, i, isNode = elem.nodeType,
                cache = isNode ? jQuery.cache : elem,
                id = isNode ? elem[jQuery.expando] : jQuery.expando;
            if (cache[id]) {
                if (name && (thisCache = pvt ? cache[id] : cache[id].data)) {
                    jQuery.isArray(name) ? name = name.concat(jQuery.map(name, jQuery.camelCase)) : name in thisCache ? name = [name] : (name = jQuery.camelCase(name), name = name in thisCache ? [name] : name.split(" ")), i = name.length;
                    for (; i--;) delete thisCache[name[i]];
                    if (pvt ? !isEmptyDataObject(thisCache) : !jQuery.isEmptyObject(thisCache)) return
                }(pvt || (delete cache[id].data, isEmptyDataObject(cache[id]))) && (isNode ? jQuery.cleanData([elem], !0) : jQuery.support.deleteExpando || cache != cache.window ? delete cache[id] : cache[id] = null)
            }
        }
    }

    function dataAttr(elem, key, data) {
        if (data === undefined && 1 === elem.nodeType) {
            var name = "data-" + key.replace(rmultiDash, "-$1").toLowerCase();
            if (data = elem.getAttribute(name), "string" == typeof data) {
                try {
                    data = "true" === data ? !0 : "false" === data ? !1 : "null" === data ? null : +data + "" === data ? +data : rbrace.test(data) ? jQuery.parseJSON(data) : data
                } catch (e) {}
                jQuery.data(elem, key, data)
            } else data = undefined
        }
        return data
    }

    function isEmptyDataObject(obj) {
        var name;
        for (name in obj)
            if (("data" !== name || !jQuery.isEmptyObject(obj[name])) && "toJSON" !== name) return !1;
        return !0
    }

    function returnTrue() {
        return !0
    }

    function returnFalse() {
        return !1
    }

    function safeActiveElement() {
        try {
            return document.activeElement
        } catch (err) {}
    }

    function sibling(cur, dir) {
        do cur = cur[dir]; while (cur && 1 !== cur.nodeType);
        return cur
    }

    function winnow(elements, qualifier, not) {
        if (jQuery.isFunction(qualifier)) return jQuery.grep(elements, function(elem, i) {
            return !!qualifier.call(elem, i, elem) !== not
        });
        if (qualifier.nodeType) return jQuery.grep(elements, function(elem) {
            return elem === qualifier !== not
        });
        if ("string" == typeof qualifier) {
            if (isSimple.test(qualifier)) return jQuery.filter(qualifier, elements, not);
            qualifier = jQuery.filter(qualifier, elements)
        }
        return jQuery.grep(elements, function(elem) {
            return jQuery.inArray(elem, qualifier) >= 0 !== not
        })
    }

    function createSafeFragment(document) {
        var list = nodeNames.split("|"),
            safeFrag = document.createDocumentFragment();
        if (safeFrag.createElement)
            for (; list.length;) safeFrag.createElement(list.pop());
        return safeFrag
    }

    function manipulationTarget(elem, content) {
        return jQuery.nodeName(elem, "table") && jQuery.nodeName(1 === content.nodeType ? content : content.firstChild, "tr") ? elem.getElementsByTagName("tbody")[0] || elem.appendChild(elem.ownerDocument.createElement("tbody")) : elem
    }

    function disableScript(elem) {
        return elem.type = (null !== jQuery.find.attr(elem, "type")) + "/" + elem.type, elem
    }

    function restoreScript(elem) {
        var match = rscriptTypeMasked.exec(elem.type);
        return match ? elem.type = match[1] : elem.removeAttribute("type"), elem
    }

    function setGlobalEval(elems, refElements) {
        for (var elem, i = 0; null != (elem = elems[i]); i++) jQuery._data(elem, "globalEval", !refElements || jQuery._data(refElements[i], "globalEval"))
    }

    function cloneCopyEvent(src, dest) {
        if (1 === dest.nodeType && jQuery.hasData(src)) {
            var type, i, l, oldData = jQuery._data(src),
                curData = jQuery._data(dest, oldData),
                events = oldData.events;
            if (events) {
                delete curData.handle, curData.events = {};
                for (type in events)
                    for (i = 0, l = events[type].length; l > i; i++) jQuery.event.add(dest, type, events[type][i])
            }
            curData.data && (curData.data = jQuery.extend({}, curData.data))
        }
    }

    function fixCloneNodeIssues(src, dest) {
        var nodeName, e, data;
        if (1 === dest.nodeType) {
            if (nodeName = dest.nodeName.toLowerCase(), !jQuery.support.noCloneEvent && dest[jQuery.expando]) {
                data = jQuery._data(dest);
                for (e in data.events) jQuery.removeEvent(dest, e, data.handle);
                dest.removeAttribute(jQuery.expando)
            }
            "script" === nodeName && dest.text !== src.text ? (disableScript(dest).text = src.text, restoreScript(dest)) : "object" === nodeName ? (dest.parentNode && (dest.outerHTML = src.outerHTML), jQuery.support.html5Clone && src.innerHTML && !jQuery.trim(dest.innerHTML) && (dest.innerHTML = src.innerHTML)) : "input" === nodeName && manipulation_rcheckableType.test(src.type) ? (dest.defaultChecked = dest.checked = src.checked, dest.value !== src.value && (dest.value = src.value)) : "option" === nodeName ? dest.defaultSelected = dest.selected = src.defaultSelected : ("input" === nodeName || "textarea" === nodeName) && (dest.defaultValue = src.defaultValue)
        }
    }

    function getAll(context, tag) {
        var elems, elem, i = 0,
            found = typeof context.getElementsByTagName !== core_strundefined ? context.getElementsByTagName(tag || "*") : typeof context.querySelectorAll !== core_strundefined ? context.querySelectorAll(tag || "*") : undefined;
        if (!found)
            for (found = [], elems = context.childNodes || context; null != (elem = elems[i]); i++)!tag || jQuery.nodeName(elem, tag) ? found.push(elem) : jQuery.merge(found, getAll(elem, tag));
        return tag === undefined || tag && jQuery.nodeName(context, tag) ? jQuery.merge([context], found) : found
    }

    function fixDefaultChecked(elem) {
        manipulation_rcheckableType.test(elem.type) && (elem.defaultChecked = elem.checked)
    }

    function vendorPropName(style, name) {
        if (name in style) return name;
        for (var capName = name.charAt(0).toUpperCase() + name.slice(1), origName = name, i = cssPrefixes.length; i--;)
            if (name = cssPrefixes[i] + capName, name in style) return name;
        return origName
    }

    function isHidden(elem, el) {
        return elem = el || elem, "none" === jQuery.css(elem, "display") || !jQuery.contains(elem.ownerDocument, elem)
    }

    function showHide(elements, show) {
        for (var display, elem, hidden, values = [], index = 0, length = elements.length; length > index; index++) elem = elements[index], elem.style && (values[index] = jQuery._data(elem, "olddisplay"), display = elem.style.display, show ? (values[index] || "none" !== display || (elem.style.display = ""), "" === elem.style.display && isHidden(elem) && (values[index] = jQuery._data(elem, "olddisplay", css_defaultDisplay(elem.nodeName)))) : values[index] || (hidden = isHidden(elem), (display && "none" !== display || !hidden) && jQuery._data(elem, "olddisplay", hidden ? display : jQuery.css(elem, "display"))));
        for (index = 0; length > index; index++) elem = elements[index], elem.style && (show && "none" !== elem.style.display && "" !== elem.style.display || (elem.style.display = show ? values[index] || "" : "none"));
        return elements
    }

    function setPositiveNumber(elem, value, subtract) {
        var matches = rnumsplit.exec(value);
        return matches ? Math.max(0, matches[1] - (subtract || 0)) + (matches[2] || "px") : value
    }

    function augmentWidthOrHeight(elem, name, extra, isBorderBox, styles) {
        for (var i = extra === (isBorderBox ? "border" : "content") ? 4 : "width" === name ? 1 : 0, val = 0; 4 > i; i += 2) "margin" === extra && (val += jQuery.css(elem, extra + cssExpand[i], !0, styles)), isBorderBox ? ("content" === extra && (val -= jQuery.css(elem, "padding" + cssExpand[i], !0, styles)), "margin" !== extra && (val -= jQuery.css(elem, "border" + cssExpand[i] + "Width", !0, styles))) : (val += jQuery.css(elem, "padding" + cssExpand[i], !0, styles), "padding" !== extra && (val += jQuery.css(elem, "border" + cssExpand[i] + "Width", !0, styles)));
        return val
    }

    function getWidthOrHeight(elem, name, extra) {
        var valueIsBorderBox = !0,
            val = "width" === name ? elem.offsetWidth : elem.offsetHeight,
            styles = getStyles(elem),
            isBorderBox = jQuery.support.boxSizing && "border-box" === jQuery.css(elem, "boxSizing", !1, styles);
        if (0 >= val || null == val) {
            if (val = curCSS(elem, name, styles), (0 > val || null == val) && (val = elem.style[name]), rnumnonpx.test(val)) return val;
            valueIsBorderBox = isBorderBox && (jQuery.support.boxSizingReliable || val === elem.style[name]), val = parseFloat(val) || 0
        }
        return val + augmentWidthOrHeight(elem, name, extra || (isBorderBox ? "border" : "content"), valueIsBorderBox, styles) + "px"
    }

    function css_defaultDisplay(nodeName) {
        var doc = document,
            display = elemdisplay[nodeName];
        return display || (display = actualDisplay(nodeName, doc), "none" !== display && display || (iframe = (iframe || jQuery("<iframe frameborder='0' width='0' height='0'/>").css("cssText", "display:block !important")).appendTo(doc.documentElement), doc = (iframe[0].contentWindow || iframe[0].contentDocument).document, doc.write("<!doctype html><html><body>"), doc.close(), display = actualDisplay(nodeName, doc), iframe.detach()), elemdisplay[nodeName] = display), display
    }

    function actualDisplay(name, doc) {
        var elem = jQuery(doc.createElement(name)).appendTo(doc.body),
            display = jQuery.css(elem[0], "display");
        return elem.remove(), display
    }

    function buildParams(prefix, obj, traditional, add) {
        var name;
        if (jQuery.isArray(obj)) jQuery.each(obj, function(i, v) {
            traditional || rbracket.test(prefix) ? add(prefix, v) : buildParams(prefix + "[" + ("object" == typeof v ? i : "") + "]", v, traditional, add)
        });
        else if (traditional || "object" !== jQuery.type(obj)) add(prefix, obj);
        else
            for (name in obj) buildParams(prefix + "[" + name + "]", obj[name], traditional, add)
    }

    function addToPrefiltersOrTransports(structure) {
        return function(dataTypeExpression, func) {
            "string" != typeof dataTypeExpression && (func = dataTypeExpression, dataTypeExpression = "*");
            var dataType, i = 0,
                dataTypes = dataTypeExpression.toLowerCase().match(core_rnotwhite) || [];
            if (jQuery.isFunction(func))
                for (; dataType = dataTypes[i++];) "+" === dataType[0] ? (dataType = dataType.slice(1) || "*", (structure[dataType] = structure[dataType] || []).unshift(func)) : (structure[dataType] = structure[dataType] || []).push(func)
        }
    }

    function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {
        function inspect(dataType) {
            var selected;
            return inspected[dataType] = !0, jQuery.each(structure[dataType] || [], function(_, prefilterOrFactory) {
                var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);
                return "string" != typeof dataTypeOrTransport || seekingTransport || inspected[dataTypeOrTransport] ? seekingTransport ? !(selected = dataTypeOrTransport) : undefined : (options.dataTypes.unshift(dataTypeOrTransport), inspect(dataTypeOrTransport), !1)
            }), selected
        }
        var inspected = {}, seekingTransport = structure === transports;
        return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*")
    }

    function ajaxExtend(target, src) {
        var deep, key, flatOptions = jQuery.ajaxSettings.flatOptions || {};
        for (key in src) src[key] !== undefined && ((flatOptions[key] ? target : deep || (deep = {}))[key] = src[key]);
        return deep && jQuery.extend(!0, target, deep), target
    }

    function ajaxHandleResponses(s, jqXHR, responses) {
        for (var firstDataType, ct, finalDataType, type, contents = s.contents, dataTypes = s.dataTypes;
            "*" === dataTypes[0];) dataTypes.shift(), ct === undefined && (ct = s.mimeType || jqXHR.getResponseHeader("Content-Type"));
        if (ct)
            for (type in contents)
                if (contents[type] && contents[type].test(ct)) {
                    dataTypes.unshift(type);
                    break
                }
        if (dataTypes[0] in responses) finalDataType = dataTypes[0];
        else {
            for (type in responses) {
                if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
                    finalDataType = type;
                    break
                }
                firstDataType || (firstDataType = type)
            }
            finalDataType = finalDataType || firstDataType
        }
        return finalDataType ? (finalDataType !== dataTypes[0] && dataTypes.unshift(finalDataType), responses[finalDataType]) : undefined
    }

    function ajaxConvert(s, response, jqXHR, isSuccess) {
        var conv2, current, conv, tmp, prev, converters = {}, dataTypes = s.dataTypes.slice();
        if (dataTypes[1])
            for (conv in s.converters) converters[conv.toLowerCase()] = s.converters[conv];
        for (current = dataTypes.shift(); current;)
            if (s.responseFields[current] && (jqXHR[s.responseFields[current]] = response), !prev && isSuccess && s.dataFilter && (response = s.dataFilter(response, s.dataType)), prev = current, current = dataTypes.shift())
                if ("*" === current) current = prev;
                else
        if ("*" !== prev && prev !== current) {
            if (conv = converters[prev + " " + current] || converters["* " + current], !conv)
                for (conv2 in converters)
                    if (tmp = conv2.split(" "), tmp[1] === current && (conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]])) {
                        conv === !0 ? conv = converters[conv2] : converters[conv2] !== !0 && (current = tmp[0], dataTypes.unshift(tmp[1]));
                        break
                    }
            if (conv !== !0)
                if (conv && s["throws"]) response = conv(response);
                else try {
                    response = conv(response)
                } catch (e) {
                    return {
                        state: "parsererror",
                        error: conv ? e : "No conversion from " + prev + " to " + current
                    }
                }
        }
        return {
            state: "success",
            data: response
        }
    }

    function createStandardXHR() {
        try {
            return new window.XMLHttpRequest
        } catch (e) {}
    }

    function createActiveXHR() {
        try {
            return new window.ActiveXObject("Microsoft.XMLHTTP")
        } catch (e) {}
    }

    function createFxNow() {
        return setTimeout(function() {
            fxNow = undefined
        }), fxNow = jQuery.now()
    }

    function createTween(value, prop, animation) {
        for (var tween, collection = (tweeners[prop] || []).concat(tweeners["*"]), index = 0, length = collection.length; length > index; index++)
            if (tween = collection[index].call(animation, prop, value)) return tween
    }

    function Animation(elem, properties, options) {
        var result, stopped, index = 0,
            length = animationPrefilters.length,
            deferred = jQuery.Deferred().always(function() {
                delete tick.elem
            }),
            tick = function() {
                if (stopped) return !1;
                for (var currentTime = fxNow || createFxNow(), remaining = Math.max(0, animation.startTime + animation.duration - currentTime), temp = remaining / animation.duration || 0, percent = 1 - temp, index = 0, length = animation.tweens.length; length > index; index++) animation.tweens[index].run(percent);
                return deferred.notifyWith(elem, [animation, percent, remaining]), 1 > percent && length ? remaining : (deferred.resolveWith(elem, [animation]), !1)
            }, animation = deferred.promise({
                elem: elem,
                props: jQuery.extend({}, properties),
                opts: jQuery.extend(!0, {
                    specialEasing: {}
                }, options),
                originalProperties: properties,
                originalOptions: options,
                startTime: fxNow || createFxNow(),
                duration: options.duration,
                tweens: [],
                createTween: function(prop, end) {
                    var tween = jQuery.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);
                    return animation.tweens.push(tween), tween
                },
                stop: function(gotoEnd) {
                    var index = 0,
                        length = gotoEnd ? animation.tweens.length : 0;
                    if (stopped) return this;
                    for (stopped = !0; length > index; index++) animation.tweens[index].run(1);
                    return gotoEnd ? deferred.resolveWith(elem, [animation, gotoEnd]) : deferred.rejectWith(elem, [animation, gotoEnd]), this
                }
            }),
            props = animation.props;
        for (propFilter(props, animation.opts.specialEasing); length > index; index++)
            if (result = animationPrefilters[index].call(animation, elem, props, animation.opts)) return result;
        return jQuery.map(props, createTween, animation), jQuery.isFunction(animation.opts.start) && animation.opts.start.call(elem, animation), jQuery.fx.timer(jQuery.extend(tick, {
            elem: elem,
            anim: animation,
            queue: animation.opts.queue
        })), animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always)
    }

    function propFilter(props, specialEasing) {
        var index, name, easing, value, hooks;
        for (index in props)
            if (name = jQuery.camelCase(index), easing = specialEasing[name], value = props[index], jQuery.isArray(value) && (easing = value[1], value = props[index] = value[0]), index !== name && (props[name] = value, delete props[index]), hooks = jQuery.cssHooks[name], hooks && "expand" in hooks) {
                value = hooks.expand(value), delete props[name];
                for (index in value) index in props || (props[index] = value[index], specialEasing[index] = easing)
            } else specialEasing[name] = easing
    }

    function defaultPrefilter(elem, props, opts) {
        var prop, value, toggle, tween, hooks, oldfire, anim = this,
            orig = {}, style = elem.style,
            hidden = elem.nodeType && isHidden(elem),
            dataShow = jQuery._data(elem, "fxshow");
        opts.queue || (hooks = jQuery._queueHooks(elem, "fx"), null == hooks.unqueued && (hooks.unqueued = 0, oldfire = hooks.empty.fire, hooks.empty.fire = function() {
            hooks.unqueued || oldfire()
        }), hooks.unqueued++, anim.always(function() {
            anim.always(function() {
                hooks.unqueued--, jQuery.queue(elem, "fx").length || hooks.empty.fire()
            })
        })), 1 === elem.nodeType && ("height" in props || "width" in props) && (opts.overflow = [style.overflow, style.overflowX, style.overflowY], "inline" === jQuery.css(elem, "display") && "none" === jQuery.css(elem, "float") && (jQuery.support.inlineBlockNeedsLayout && "inline" !== css_defaultDisplay(elem.nodeName) ? style.zoom = 1 : style.display = "inline-block")), opts.overflow && (style.overflow = "hidden", jQuery.support.shrinkWrapBlocks || anim.always(function() {
            style.overflow = opts.overflow[0], style.overflowX = opts.overflow[1], style.overflowY = opts.overflow[2]
        }));
        for (prop in props)
            if (value = props[prop], rfxtypes.exec(value)) {
                if (delete props[prop], toggle = toggle || "toggle" === value, value === (hidden ? "hide" : "show")) continue;
                orig[prop] = dataShow && dataShow[prop] || jQuery.style(elem, prop)
            }
        if (!jQuery.isEmptyObject(orig)) {
            dataShow ? "hidden" in dataShow && (hidden = dataShow.hidden) : dataShow = jQuery._data(elem, "fxshow", {}), toggle && (dataShow.hidden = !hidden), hidden ? jQuery(elem).show() : anim.done(function() {
                jQuery(elem).hide()
            }), anim.done(function() {
                var prop;
                jQuery._removeData(elem, "fxshow");
                for (prop in orig) jQuery.style(elem, prop, orig[prop])
            });
            for (prop in orig) tween = createTween(hidden ? dataShow[prop] : 0, prop, anim), prop in dataShow || (dataShow[prop] = tween.start, hidden && (tween.end = tween.start, tween.start = "width" === prop || "height" === prop ? 1 : 0))
        }
    }

    function Tween(elem, options, prop, end, easing) {
        return new Tween.prototype.init(elem, options, prop, end, easing)
    }

    function genFx(type, includeWidth) {
        var which, attrs = {
                height: type
            }, i = 0;
        for (includeWidth = includeWidth ? 1 : 0; 4 > i; i += 2 - includeWidth) which = cssExpand[i], attrs["margin" + which] = attrs["padding" + which] = type;
        return includeWidth && (attrs.opacity = attrs.width = type), attrs
    }

    function getWindow(elem) {
        return jQuery.isWindow(elem) ? elem : 9 === elem.nodeType ? elem.defaultView || elem.parentWindow : !1
    }
    var readyList, rootjQuery, core_strundefined = typeof undefined,
        location = window.location,
        document = window.document,
        docElem = document.documentElement,
        _jQuery = window.jQuery,
        _$ = window.$,
        class2type = {}, core_deletedIds = [],
        core_version = "1.10.1",
        core_concat = core_deletedIds.concat,
        core_push = core_deletedIds.push,
        core_slice = core_deletedIds.slice,
        core_indexOf = core_deletedIds.indexOf,
        core_toString = class2type.toString,
        core_hasOwn = class2type.hasOwnProperty,
        core_trim = core_version.trim,
        jQuery = function(selector, context) {
            return new jQuery.fn.init(selector, context, rootjQuery)
        }, core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,
        core_rnotwhite = /\S+/g,
        rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
        rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,
        rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
        rvalidchars = /^[\],:{}\s]*$/,
        rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
        rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
        rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,
        rmsPrefix = /^-ms-/,
        rdashAlpha = /-([\da-z])/gi,
        fcamelCase = function(all, letter) {
            return letter.toUpperCase()
        }, completed = function(event) {
            (document.addEventListener || "load" === event.type || "complete" === document.readyState) && (detach(), jQuery.ready())
        }, detach = function() {
            document.addEventListener ? (document.removeEventListener("DOMContentLoaded", completed, !1), window.removeEventListener("load", completed, !1)) : (document.detachEvent("onreadystatechange", completed), window.detachEvent("onload", completed))
        };
    jQuery.fn = jQuery.prototype = {
        jquery: core_version,
        constructor: jQuery,
        init: function(selector, context, rootjQuery) {
            var match, elem;
            if (!selector) return this;
            if ("string" == typeof selector) {
                if (match = "<" === selector.charAt(0) && ">" === selector.charAt(selector.length - 1) && selector.length >= 3 ? [null, selector, null] : rquickExpr.exec(selector), !match || !match[1] && context) return !context || context.jquery ? (context || rootjQuery).find(selector) : this.constructor(context).find(selector);
                if (match[1]) {
                    if (context = context instanceof jQuery ? context[0] : context, jQuery.merge(this, jQuery.parseHTML(match[1], context && context.nodeType ? context.ownerDocument || context : document, !0)), rsingleTag.test(match[1]) && jQuery.isPlainObject(context))
                        for (match in context) jQuery.isFunction(this[match]) ? this[match](context[match]) : this.attr(match, context[match]);
                    return this
                }
                if (elem = document.getElementById(match[2]), elem && elem.parentNode) {
                    if (elem.id !== match[2]) return rootjQuery.find(selector);
                    this.length = 1, this[0] = elem
                }
                return this.context = document, this.selector = selector, this
            }
            return selector.nodeType ? (this.context = this[0] = selector, this.length = 1, this) : jQuery.isFunction(selector) ? rootjQuery.ready(selector) : (selector.selector !== undefined && (this.selector = selector.selector, this.context = selector.context), jQuery.makeArray(selector, this))
        },
        selector: "",
        length: 0,
        toArray: function() {
            return core_slice.call(this)
        },
        get: function(num) {
            return null == num ? this.toArray() : 0 > num ? this[this.length + num] : this[num]
        },
        pushStack: function(elems) {
            var ret = jQuery.merge(this.constructor(), elems);
            return ret.prevObject = this, ret.context = this.context, ret
        },
        each: function(callback, args) {
            return jQuery.each(this, callback, args)
        },
        ready: function(fn) {
            return jQuery.ready.promise().done(fn), this
        },
        slice: function() {
            return this.pushStack(core_slice.apply(this, arguments))
        },
        first: function() {
            return this.eq(0)
        },
        last: function() {
            return this.eq(-1)
        },
        eq: function(i) {
            var len = this.length,
                j = +i + (0 > i ? len : 0);
            return this.pushStack(j >= 0 && len > j ? [this[j]] : [])
        },
        map: function(callback) {
            return this.pushStack(jQuery.map(this, function(elem, i) {
                return callback.call(elem, i, elem)
            }))
        },
        end: function() {
            return this.prevObject || this.constructor(null)
        },
        push: core_push,
        sort: [].sort,
        splice: [].splice
    }, jQuery.fn.init.prototype = jQuery.fn, jQuery.extend = jQuery.fn.extend = function() {
        var src, copyIsArray, copy, name, options, clone, target = arguments[0] || {}, i = 1,
            length = arguments.length,
            deep = !1;
        for ("boolean" == typeof target && (deep = target, target = arguments[1] || {}, i = 2), "object" == typeof target || jQuery.isFunction(target) || (target = {}), length === i && (target = this, --i); length > i; i++)
            if (null != (options = arguments[i]))
                for (name in options) src = target[name], copy = options[name], target !== copy && (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy))) ? (copyIsArray ? (copyIsArray = !1, clone = src && jQuery.isArray(src) ? src : []) : clone = src && jQuery.isPlainObject(src) ? src : {}, target[name] = jQuery.extend(deep, clone, copy)) : copy !== undefined && (target[name] = copy));
        return target
    }, jQuery.extend({
        expando: "jQuery" + (core_version + Math.random()).replace(/\D/g, ""),
        noConflict: function(deep) {
            return window.$ === jQuery && (window.$ = _$), deep && window.jQuery === jQuery && (window.jQuery = _jQuery), jQuery
        },
        isReady: !1,
        readyWait: 1,
        holdReady: function(hold) {
            hold ? jQuery.readyWait++ : jQuery.ready(!0)
        },
        ready: function(wait) {
            if (wait === !0 ? !--jQuery.readyWait : !jQuery.isReady) {
                if (!document.body) return setTimeout(jQuery.ready);
                jQuery.isReady = !0, wait !== !0 && --jQuery.readyWait > 0 || (readyList.resolveWith(document, [jQuery]), jQuery.fn.trigger && jQuery(document).trigger("ready").off("ready"))
            }
        },
        isFunction: function(obj) {
            return "function" === jQuery.type(obj)
        },
        isArray: Array.isArray || function(obj) {
            return "array" === jQuery.type(obj)
        },
        isWindow: function(obj) {
            return null != obj && obj == obj.window
        },
        isNumeric: function(obj) {
            return !isNaN(parseFloat(obj)) && isFinite(obj)
        },
        type: function(obj) {
            return null == obj ? obj + "" : "object" == typeof obj || "function" == typeof obj ? class2type[core_toString.call(obj)] || "object" : typeof obj
        },
        isPlainObject: function(obj) {
            var key;
            if (!obj || "object" !== jQuery.type(obj) || obj.nodeType || jQuery.isWindow(obj)) return !1;
            try {
                if (obj.constructor && !core_hasOwn.call(obj, "constructor") && !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) return !1
            } catch (e) {
                return !1
            }
            if (jQuery.support.ownLast)
                for (key in obj) return core_hasOwn.call(obj, key);
            for (key in obj);
            return key === undefined || core_hasOwn.call(obj, key)
        },
        isEmptyObject: function(obj) {
            var name;
            for (name in obj) return !1;
            return !0
        },
        error: function(msg) {
            throw Error(msg)
        },
        parseHTML: function(data, context, keepScripts) {
            if (!data || "string" != typeof data) return null;
            "boolean" == typeof context && (keepScripts = context, context = !1), context = context || document;
            var parsed = rsingleTag.exec(data),
                scripts = !keepScripts && [];
            return parsed ? [context.createElement(parsed[1])] : (parsed = jQuery.buildFragment([data], context, scripts), scripts && jQuery(scripts).remove(), jQuery.merge([], parsed.childNodes))
        },
        parseJSON: function(data) {
            return window.JSON && window.JSON.parse ? window.JSON.parse(data) : null === data ? data : "string" == typeof data && (data = jQuery.trim(data), data && rvalidchars.test(data.replace(rvalidescape, "@").replace(rvalidtokens, "]").replace(rvalidbraces, ""))) ? Function("return " + data)() : (jQuery.error("Invalid JSON: " + data), undefined)
        },
        parseXML: function(data) {
            var xml, tmp;
            if (!data || "string" != typeof data) return null;
            try {
                window.DOMParser ? (tmp = new DOMParser, xml = tmp.parseFromString(data, "text/xml")) : (xml = new ActiveXObject("Microsoft.XMLDOM"), xml.async = "false", xml.loadXML(data))
            } catch (e) {
                xml = undefined
            }
            return xml && xml.documentElement && !xml.getElementsByTagName("parsererror").length || jQuery.error("Invalid XML: " + data), xml
        },
        noop: function() {},
        globalEval: function(data) {
            data && jQuery.trim(data) && (window.execScript || function(data) {
                window.eval.call(window, data)
            })(data)
        },
        camelCase: function(string) {
            return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase)
        },
        nodeName: function(elem, name) {
            return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase()
        },
        each: function(obj, callback, args) {
            var value, i = 0,
                length = obj.length,
                isArray = isArraylike(obj);
            if (args) {
                if (isArray)
                    for (; length > i && (value = callback.apply(obj[i], args), value !== !1); i++);
                else
                    for (i in obj)
                        if (value = callback.apply(obj[i], args), value === !1) break
            } else if (isArray)
                for (; length > i && (value = callback.call(obj[i], i, obj[i]), value !== !1); i++);
            else
                for (i in obj)
                    if (value = callback.call(obj[i], i, obj[i]), value === !1) break; return obj
        },
        trim: core_trim && !core_trim.call("﻿ ") ? function(text) {
            return null == text ? "" : core_trim.call(text)
        } : function(text) {
            return null == text ? "" : (text + "").replace(rtrim, "")
        },
        makeArray: function(arr, results) {
            var ret = results || [];
            return null != arr && (isArraylike(Object(arr)) ? jQuery.merge(ret, "string" == typeof arr ? [arr] : arr) : core_push.call(ret, arr)), ret
        },
        inArray: function(elem, arr, i) {
            var len;
            if (arr) {
                if (core_indexOf) return core_indexOf.call(arr, elem, i);
                for (len = arr.length, i = i ? 0 > i ? Math.max(0, len + i) : i : 0; len > i; i++)
                    if (i in arr && arr[i] === elem) return i
            }
            return -1
        },
        merge: function(first, second) {
            var l = second.length,
                i = first.length,
                j = 0;
            if ("number" == typeof l)
                for (; l > j; j++) first[i++] = second[j];
            else
                for (; second[j] !== undefined;) first[i++] = second[j++];
            return first.length = i, first
        },
        grep: function(elems, callback, inv) {
            var retVal, ret = [],
                i = 0,
                length = elems.length;
            for (inv = !! inv; length > i; i++) retVal = !! callback(elems[i], i), inv !== retVal && ret.push(elems[i]);
            return ret
        },
        map: function(elems, callback, arg) {
            var value, i = 0,
                length = elems.length,
                isArray = isArraylike(elems),
                ret = [];
            if (isArray)
                for (; length > i; i++) value = callback(elems[i], i, arg), null != value && (ret[ret.length] = value);
            else
                for (i in elems) value = callback(elems[i], i, arg), null != value && (ret[ret.length] = value);
            return core_concat.apply([], ret)
        },
        guid: 1,
        proxy: function(fn, context) {
            var args, proxy, tmp;
            return "string" == typeof context && (tmp = fn[context], context = fn, fn = tmp), jQuery.isFunction(fn) ? (args = core_slice.call(arguments, 2), proxy = function() {
                return fn.apply(context || this, args.concat(core_slice.call(arguments)))
            }, proxy.guid = fn.guid = fn.guid || jQuery.guid++, proxy) : undefined
        },
        access: function(elems, fn, key, value, chainable, emptyGet, raw) {
            var i = 0,
                length = elems.length,
                bulk = null == key;
            if ("object" === jQuery.type(key)) {
                chainable = !0;
                for (i in key) jQuery.access(elems, fn, i, key[i], !0, emptyGet, raw)
            } else if (value !== undefined && (chainable = !0, jQuery.isFunction(value) || (raw = !0), bulk && (raw ? (fn.call(elems, value), fn = null) : (bulk = fn, fn = function(elem, key, value) {
                return bulk.call(jQuery(elem), value)
            })), fn))
                for (; length > i; i++) fn(elems[i], key, raw ? value : value.call(elems[i], i, fn(elems[i], key)));
            return chainable ? elems : bulk ? fn.call(elems) : length ? fn(elems[0], key) : emptyGet
        },
        now: function() {
            return (new Date).getTime()
        },
        swap: function(elem, options, callback, args) {
            var ret, name, old = {};
            for (name in options) old[name] = elem.style[name], elem.style[name] = options[name];
            ret = callback.apply(elem, args || []);
            for (name in options) elem.style[name] = old[name];
            return ret
        }
    }), jQuery.ready.promise = function(obj) {
        if (!readyList)
            if (readyList = jQuery.Deferred(), "complete" === document.readyState) setTimeout(jQuery.ready);
            else
        if (document.addEventListener) document.addEventListener("DOMContentLoaded", completed, !1), window.addEventListener("load", completed, !1);
        else {
            document.attachEvent("onreadystatechange", completed), window.attachEvent("onload", completed);
            var top = !1;
            try {
                top = null == window.frameElement && document.documentElement
            } catch (e) {}
            top && top.doScroll && function doScrollCheck() {
                if (!jQuery.isReady) {
                    try {
                        top.doScroll("left")
                    } catch (e) {
                        return setTimeout(doScrollCheck, 50)
                    }
                    detach(), jQuery.ready()
                }
            }()
        }
        return readyList.promise(obj)
    }, jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
        class2type["[object " + name + "]"] = name.toLowerCase()
    }), rootjQuery = jQuery(document), /*! * Sizzle CSS Selector Engine v1.9.4-pre * http://sizzlejs.com/ * * Copyright 2013 jQuery Foundation, Inc. and other contributors * Released under the MIT license * http://jquery.org/license * * Date: 2013-05-27 */
    function(window, undefined) {
        function Sizzle(selector, context, results, seed) {
            var match, elem, m, nodeType, i, groups, old, nid, newContext, newSelector;
            if ((context ? context.ownerDocument || context : preferredDoc) !== document && setDocument(context), context = context || document, results = results || [], !selector || "string" != typeof selector) return results;
            if (1 !== (nodeType = context.nodeType) && 9 !== nodeType) return [];
            if (documentIsHTML && !seed) {
                if (match = rquickExpr.exec(selector))
                    if (m = match[1]) {
                        if (9 === nodeType) {
                            if (elem = context.getElementById(m), !elem || !elem.parentNode) return results;
                            if (elem.id === m) return results.push(elem), results
                        } else if (context.ownerDocument && (elem = context.ownerDocument.getElementById(m)) && contains(context, elem) && elem.id === m) return results.push(elem), results
                    } else {
                        if (match[2]) return push.apply(results, context.getElementsByTagName(selector)), results;
                        if ((m = match[3]) && support.getElementsByClassName && context.getElementsByClassName) return push.apply(results, context.getElementsByClassName(m)), results
                    }
                if (support.qsa && (!rbuggyQSA || !rbuggyQSA.test(selector))) {
                    if (nid = old = expando, newContext = context, newSelector = 9 === nodeType && selector, 1 === nodeType && "object" !== context.nodeName.toLowerCase()) {
                        for (groups = tokenize(selector), (old = context.getAttribute("id")) ? nid = old.replace(rescape, "\\$&") : context.setAttribute("id", nid), nid = "[id='" + nid + "'] ", i = groups.length; i--;) groups[i] = nid + toSelector(groups[i]);
                        newContext = rsibling.test(selector) && context.parentNode || context, newSelector = groups.join(",")
                    }
                    if (newSelector) try {
                        return push.apply(results, newContext.querySelectorAll(newSelector)), results
                    } catch (qsaError) {} finally {
                        old || context.removeAttribute("id")
                    }
                }
            }
            return select(selector.replace(rtrim, "$1"), context, results, seed)
        }

        function isNative(fn) {
            return rnative.test(fn + "")
        }

        function createCache() {
            function cache(key, value) {
                return keys.push(key += " ") > Expr.cacheLength && delete cache[keys.shift()], cache[key] = value
            }
            var keys = [];
            return cache
        }

        function markFunction(fn) {
            return fn[expando] = !0, fn
        }

        function assert(fn) {
            var div = document.createElement("div");
            try {
                return !!fn(div)
            } catch (e) {
                return !1
            } finally {
                div.parentNode && div.parentNode.removeChild(div), div = null
            }
        }

        function addHandle(attrs, handler, test) {
            attrs = attrs.split("|");
            for (var current, i = attrs.length, setHandle = test ? null : handler; i--;)(current = Expr.attrHandle[attrs[i]]) && current !== handler || (Expr.attrHandle[attrs[i]] = setHandle)
        }

        function boolHandler(elem, name) {
            var val = elem.getAttributeNode(name);
            return val && val.specified ? val.value : elem[name] === !0 ? name.toLowerCase() : null
        }

        function interpolationHandler(elem, name) {
            return elem.getAttribute(name, "type" === name.toLowerCase() ? 1 : 2)
        }

        function valueHandler(elem) {
            return "input" === elem.nodeName.toLowerCase() ? elem.defaultValue : undefined
        }

        function siblingCheck(a, b) {
            var cur = b && a,
                diff = cur && 1 === a.nodeType && 1 === b.nodeType && (~b.sourceIndex || MAX_NEGATIVE) - (~a.sourceIndex || MAX_NEGATIVE);
            if (diff) return diff;
            if (cur)
                for (; cur = cur.nextSibling;)
                    if (cur === b) return -1;
            return a ? 1 : -1
        }

        function createInputPseudo(type) {
            return function(elem) {
                var name = elem.nodeName.toLowerCase();
                return "input" === name && elem.type === type
            }
        }

        function createButtonPseudo(type) {
            return function(elem) {
                var name = elem.nodeName.toLowerCase();
                return ("input" === name || "button" === name) && elem.type === type
            }
        }

        function createPositionalPseudo(fn) {
            return markFunction(function(argument) {
                return argument = +argument, markFunction(function(seed, matches) {
                    for (var j, matchIndexes = fn([], seed.length, argument), i = matchIndexes.length; i--;) seed[j = matchIndexes[i]] && (seed[j] = !(matches[j] = seed[j]))
                })
            })
        }

        function tokenize(selector, parseOnly) {
            var matched, match, tokens, type, soFar, groups, preFilters, cached = tokenCache[selector + " "];
            if (cached) return parseOnly ? 0 : cached.slice(0);
            for (soFar = selector, groups = [], preFilters = Expr.preFilter; soFar;) {
                (!matched || (match = rcomma.exec(soFar))) && (match && (soFar = soFar.slice(match[0].length) || soFar), groups.push(tokens = [])), matched = !1, (match = rcombinators.exec(soFar)) && (matched = match.shift(), tokens.push({
                    value: matched,
                    type: match[0].replace(rtrim, " ")
                }), soFar = soFar.slice(matched.length));
                for (type in Expr.filter)!(match = matchExpr[type].exec(soFar)) || preFilters[type] && !(match = preFilters[type](match)) || (matched = match.shift(), tokens.push({
                    value: matched,
                    type: type,
                    matches: match
                }), soFar = soFar.slice(matched.length));
                if (!matched) break
            }
            return parseOnly ? soFar.length : soFar ? Sizzle.error(selector) : tokenCache(selector, groups).slice(0)
        }

        function toSelector(tokens) {
            for (var i = 0, len = tokens.length, selector = ""; len > i; i++) selector += tokens[i].value;
            return selector
        }

        function addCombinator(matcher, combinator, base) {
            var dir = combinator.dir,
                checkNonElements = base && "parentNode" === dir,
                doneName = done++;
            return combinator.first ? function(elem, context, xml) {
                for (; elem = elem[dir];)
                    if (1 === elem.nodeType || checkNonElements) return matcher(elem, context, xml)
            } : function(elem, context, xml) {
                var data, cache, outerCache, dirkey = dirruns + " " + doneName;
                if (xml) {
                    for (; elem = elem[dir];)
                        if ((1 === elem.nodeType || checkNonElements) && matcher(elem, context, xml)) return !0
                } else
                    for (; elem = elem[dir];)
                        if (1 === elem.nodeType || checkNonElements)
                            if (outerCache = elem[expando] || (elem[expando] = {}), (cache = outerCache[dir]) && cache[0] === dirkey) {
                                if ((data = cache[1]) === !0 || data === cachedruns) return data === !0
                            } else if (cache = outerCache[dir] = [dirkey], cache[1] = matcher(elem, context, xml) || cachedruns, cache[1] === !0) return !0
            }
        }

        function elementMatcher(matchers) {
            return matchers.length > 1 ? function(elem, context, xml) {
                for (var i = matchers.length; i--;)
                    if (!matchers[i](elem, context, xml)) return !1;
                return !0
            } : matchers[0]
        }

        function condense(unmatched, map, filter, context, xml) {
            for (var elem, newUnmatched = [], i = 0, len = unmatched.length, mapped = null != map; len > i; i++)(elem = unmatched[i]) && (!filter || filter(elem, context, xml)) && (newUnmatched.push(elem), mapped && map.push(i));
            return newUnmatched
        }

        function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
            return postFilter && !postFilter[expando] && (postFilter = setMatcher(postFilter)), postFinder && !postFinder[expando] && (postFinder = setMatcher(postFinder, postSelector)), markFunction(function(seed, results, context, xml) {
                var temp, i, elem, preMap = [],
                    postMap = [],
                    preexisting = results.length,
                    elems = seed || multipleContexts(selector || "*", context.nodeType ? [context] : context, []),
                    matcherIn = !preFilter || !seed && selector ? elems : condense(elems, preMap, preFilter, context, xml),
                    matcherOut = matcher ? postFinder || (seed ? preFilter : preexisting || postFilter) ? [] : results : matcherIn;
                if (matcher && matcher(matcherIn, matcherOut, context, xml), postFilter)
                    for (temp = condense(matcherOut, postMap), postFilter(temp, [], context, xml), i = temp.length; i--;)(elem = temp[i]) && (matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem));
                if (seed) {
                    if (postFinder || preFilter) {
                        if (postFinder) {
                            for (temp = [], i = matcherOut.length; i--;)(elem = matcherOut[i]) && temp.push(matcherIn[i] = elem);
                            postFinder(null, matcherOut = [], temp, xml)
                        }
                        for (i = matcherOut.length; i--;)(elem = matcherOut[i]) && (temp = postFinder ? indexOf.call(seed, elem) : preMap[i]) > -1 && (seed[temp] = !(results[temp] = elem))
                    }
                } else matcherOut = condense(matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut), postFinder ? postFinder(null, results, matcherOut, xml) : push.apply(results, matcherOut)
            })
        }

        function matcherFromTokens(tokens) {
            for (var checkContext, matcher, j, len = tokens.length, leadingRelative = Expr.relative[tokens[0].type], implicitRelative = leadingRelative || Expr.relative[" "], i = leadingRelative ? 1 : 0, matchContext = addCombinator(function(elem) {
                    return elem === checkContext
                }, implicitRelative, !0), matchAnyContext = addCombinator(function(elem) {
                    return indexOf.call(checkContext, elem) > -1
                }, implicitRelative, !0), matchers = [
                    function(elem, context, xml) {
                        return !leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml))
                    }
                ]; len > i; i++)
                if (matcher = Expr.relative[tokens[i].type]) matchers = [addCombinator(elementMatcher(matchers), matcher)];
                else {
                    if (matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches), matcher[expando]) {
                        for (j = ++i; len > j && !Expr.relative[tokens[j].type]; j++);
                        return setMatcher(i > 1 && elementMatcher(matchers), i > 1 && toSelector(tokens.slice(0, i - 1).concat({
                            value: " " === tokens[i - 2].type ? "*" : ""
                        })).replace(rtrim, "$1"), matcher, j > i && matcherFromTokens(tokens.slice(i, j)), len > j && matcherFromTokens(tokens = tokens.slice(j)), len > j && toSelector(tokens))
                    }
                    matchers.push(matcher)
                }
            return elementMatcher(matchers)
        }

        function matcherFromGroupMatchers(elementMatchers, setMatchers) {
            var matcherCachedRuns = 0,
                bySet = setMatchers.length > 0,
                byElement = elementMatchers.length > 0,
                superMatcher = function(seed, context, xml, results, expandContext) {
                    var elem, j, matcher, setMatched = [],
                        matchedCount = 0,
                        i = "0",
                        unmatched = seed && [],
                        outermost = null != expandContext,
                        contextBackup = outermostContext,
                        elems = seed || byElement && Expr.find.TAG("*", expandContext && context.parentNode || context),
                        dirrunsUnique = dirruns += null == contextBackup ? 1 : Math.random() || .1;
                    for (outermost && (outermostContext = context !== document && context, cachedruns = matcherCachedRuns); null != (elem = elems[i]); i++) {
                        if (byElement && elem) {
                            for (j = 0; matcher = elementMatchers[j++];)
                                if (matcher(elem, context, xml)) {
                                    results.push(elem);
                                    break
                                }
                            outermost && (dirruns = dirrunsUnique, cachedruns = ++matcherCachedRuns)
                        }
                        bySet && ((elem = !matcher && elem) && matchedCount--, seed && unmatched.push(elem))
                    }
                    if (matchedCount += i, bySet && i !== matchedCount) {
                        for (j = 0; matcher = setMatchers[j++];) matcher(unmatched, setMatched, context, xml);
                        if (seed) {
                            if (matchedCount > 0)
                                for (; i--;) unmatched[i] || setMatched[i] || (setMatched[i] = pop.call(results));
                            setMatched = condense(setMatched)
                        }
                        push.apply(results, setMatched), outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1 && Sizzle.uniqueSort(results)
                    }
                    return outermost && (dirruns = dirrunsUnique, outermostContext = contextBackup), unmatched
                };
            return bySet ? markFunction(superMatcher) : superMatcher
        }

        function multipleContexts(selector, contexts, results) {
            for (var i = 0, len = contexts.length; len > i; i++) Sizzle(selector, contexts[i], results);
            return results
        }

        function select(selector, context, results, seed) {
            var i, tokens, token, type, find, match = tokenize(selector);
            if (!seed && 1 === match.length) {
                if (tokens = match[0] = match[0].slice(0), tokens.length > 2 && "ID" === (token = tokens[0]).type && support.getById && 9 === context.nodeType && documentIsHTML && Expr.relative[tokens[1].type]) {
                    if (context = (Expr.find.ID(token.matches[0].replace(runescape, funescape), context) || [])[0], !context) return results;
                    selector = selector.slice(tokens.shift().value.length)
                }
                for (i = matchExpr.needsContext.test(selector) ? 0 : tokens.length; i-- && (token = tokens[i], !Expr.relative[type = token.type]);)
                    if ((find = Expr.find[type]) && (seed = find(token.matches[0].replace(runescape, funescape), rsibling.test(tokens[0].type) && context.parentNode || context))) {
                        if (tokens.splice(i, 1), selector = seed.length && toSelector(tokens), !selector) return push.apply(results, seed), results;
                        break
                    }
            }
            return compile(selector, match)(seed, context, !documentIsHTML, results, rsibling.test(selector)), results
        }

        function setFilters() {}
        var i, support, cachedruns, Expr, getText, isXML, compile, outermostContext, sortInput, setDocument, document, docElem, documentIsHTML, rbuggyQSA, rbuggyMatches, matches, contains, expando = "sizzle" + -new Date,
            preferredDoc = window.document,
            dirruns = 0,
            done = 0,
            classCache = createCache(),
            tokenCache = createCache(),
            compilerCache = createCache(),
            hasDuplicate = !1,
            sortOrder = function() {
                return 0
            }, strundefined = typeof undefined,
            MAX_NEGATIVE = 1 << 31,
            hasOwn = {}.hasOwnProperty,
            arr = [],
            pop = arr.pop,
            push_native = arr.push,
            push = arr.push,
            slice = arr.slice,
            indexOf = arr.indexOf || function(elem) {
                for (var i = 0, len = this.length; len > i; i++)
                    if (this[i] === elem) return i;
                return -1
            }, booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
            whitespace = "[\\x20\\t\\r\\n\\f]",
            characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",
            identifier = characterEncoding.replace("w", "w#"),
            attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace + "*(?:([*^$|!~]?=)" + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",
            pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace(3, 8) + ")*)|.*)\\)|)",
            rtrim = RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"),
            rcomma = RegExp("^" + whitespace + "*," + whitespace + "*"),
            rcombinators = RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"),
            rsibling = RegExp(whitespace + "*[+~]"),
            rattributeQuotes = RegExp("=" + whitespace + "*([^\\]'\"]*)" + whitespace + "*\\]", "g"),
            rpseudo = RegExp(pseudos),
            ridentifier = RegExp("^" + identifier + "$"),
            matchExpr = {
                ID: RegExp("^#(" + characterEncoding + ")"),
                CLASS: RegExp("^\\.(" + characterEncoding + ")"),
                TAG: RegExp("^(" + characterEncoding.replace("w", "w*") + ")"),
                ATTR: RegExp("^" + attributes),
                PSEUDO: RegExp("^" + pseudos),
                CHILD: RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i"),
                bool: RegExp("^(?:" + booleans + ")$", "i"),
                needsContext: RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
            }, rnative = /^[^{]+\{\s*\[native \w/,
            rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
            rinputs = /^(?:input|select|textarea|button)$/i,
            rheader = /^h\d$/i,
            rescape = /'|\\/g,
            runescape = RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig"),
            funescape = function(_, escaped, escapedWhitespace) {
                var high = "0x" + escaped - 65536;
                return high !== high || escapedWhitespace ? escaped : 0 > high ? String.fromCharCode(high + 65536) : String.fromCharCode(55296 | high >> 10, 56320 | 1023 & high)
            };
        try {
            push.apply(arr = slice.call(preferredDoc.childNodes), preferredDoc.childNodes), arr[preferredDoc.childNodes.length].nodeType
        } catch (e) {
            push = {
                apply: arr.length ? function(target, els) {
                    push_native.apply(target, slice.call(els))
                } : function(target, els) {
                    for (var j = target.length, i = 0; target[j++] = els[i++];);
                    target.length = j - 1
                }
            }
        }
        isXML = Sizzle.isXML = function(elem) {
            var documentElement = elem && (elem.ownerDocument || elem).documentElement;
            return documentElement ? "HTML" !== documentElement.nodeName : !1
        }, support = Sizzle.support = {}, setDocument = Sizzle.setDocument = function(node) {
            var doc = node ? node.ownerDocument || node : preferredDoc,
                parent = doc.parentWindow;
            return doc !== document && 9 === doc.nodeType && doc.documentElement ? (document = doc, docElem = doc.documentElement, documentIsHTML = !isXML(doc), parent && parent.frameElement && parent.attachEvent("onbeforeunload", function() {
                setDocument()
            }), support.attributes = assert(function(div) {
                return div.innerHTML = "<a href='#'></a>", addHandle("type|href|height|width", interpolationHandler, "#" === div.firstChild.getAttribute("href")), addHandle(booleans, boolHandler, null == div.getAttribute("disabled")), div.className = "i", !div.getAttribute("className")
            }), support.input = assert(function(div) {
                return div.innerHTML = "<input>", div.firstChild.setAttribute("value", ""), "" === div.firstChild.getAttribute("value")
            }), addHandle("value", valueHandler, support.attributes && support.input), support.getElementsByTagName = assert(function(div) {
                return div.appendChild(doc.createComment("")), !div.getElementsByTagName("*").length
            }), support.getElementsByClassName = assert(function(div) {
                return div.innerHTML = "<div class='a'></div><div class='a i'></div>", div.firstChild.className = "i", 2 === div.getElementsByClassName("i").length
            }), support.getById = assert(function(div) {
                return docElem.appendChild(div).id = expando, !doc.getElementsByName || !doc.getElementsByName(expando).length
            }), support.getById ? (Expr.find.ID = function(id, context) {
                if (typeof context.getElementById !== strundefined && documentIsHTML) {
                    var m = context.getElementById(id);
                    return m && m.parentNode ? [m] : []
                }
            }, Expr.filter.ID = function(id) {
                var attrId = id.replace(runescape, funescape);
                return function(elem) {
                    return elem.getAttribute("id") === attrId
                }
            }) : (delete Expr.find.ID, Expr.filter.ID = function(id) {
                var attrId = id.replace(runescape, funescape);
                return function(elem) {
                    var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
                    return node && node.value === attrId
                }
            }), Expr.find.TAG = support.getElementsByTagName ? function(tag, context) {
                return typeof context.getElementsByTagName !== strundefined ? context.getElementsByTagName(tag) : undefined
            } : function(tag, context) {
                var elem, tmp = [],
                    i = 0,
                    results = context.getElementsByTagName(tag);
                if ("*" === tag) {
                    for (; elem = results[i++];) 1 === elem.nodeType && tmp.push(elem);
                    return tmp
                }
                return results
            }, Expr.find.CLASS = support.getElementsByClassName && function(className, context) {
                return typeof context.getElementsByClassName !== strundefined && documentIsHTML ? context.getElementsByClassName(className) : undefined
            }, rbuggyMatches = [], rbuggyQSA = [], (support.qsa = isNative(doc.querySelectorAll)) && (assert(function(div) {
                div.innerHTML = "<select><option selected=''></option></select>", div.querySelectorAll("[selected]").length || rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")"), div.querySelectorAll(":checked").length || rbuggyQSA.push(":checked")
            }), assert(function(div) {
                var input = doc.createElement("input");
                input.setAttribute("type", "hidden"), div.appendChild(input).setAttribute("t", ""), div.querySelectorAll("[t^='']").length && rbuggyQSA.push("[*^$]=" + whitespace + "*(?:''|\"\")"), div.querySelectorAll(":enabled").length || rbuggyQSA.push(":enabled", ":disabled"), div.querySelectorAll("*,:x"), rbuggyQSA.push(",.*:")
            })), (support.matchesSelector = isNative(matches = docElem.webkitMatchesSelector || docElem.mozMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector)) && assert(function(div) {
                support.disconnectedMatch = matches.call(div, "div"), matches.call(div, "[s!='']:x"), rbuggyMatches.push("!=", pseudos)
            }), rbuggyQSA = rbuggyQSA.length && RegExp(rbuggyQSA.join("|")), rbuggyMatches = rbuggyMatches.length && RegExp(rbuggyMatches.join("|")), contains = isNative(docElem.contains) || docElem.compareDocumentPosition ? function(a, b) {
                var adown = 9 === a.nodeType ? a.documentElement : a,
                    bup = b && b.parentNode;
                return a === bup || !(!bup || 1 !== bup.nodeType || !(adown.contains ? adown.contains(bup) : a.compareDocumentPosition && 16 & a.compareDocumentPosition(bup)))
            } : function(a, b) {
                if (b)
                    for (; b = b.parentNode;)
                        if (b === a) return !0;
                return !1
            }, support.sortDetached = assert(function(div1) {
                return 1 & div1.compareDocumentPosition(doc.createElement("div"))
            }), sortOrder = docElem.compareDocumentPosition ? function(a, b) {
                if (a === b) return hasDuplicate = !0, 0;
                var compare = b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition(b);
                return compare ? 1 & compare || !support.sortDetached && b.compareDocumentPosition(a) === compare ? a === doc || contains(preferredDoc, a) ? -1 : b === doc || contains(preferredDoc, b) ? 1 : sortInput ? indexOf.call(sortInput, a) - indexOf.call(sortInput, b) : 0 : 4 & compare ? -1 : 1 : a.compareDocumentPosition ? -1 : 1
            } : function(a, b) {
                var cur, i = 0,
                    aup = a.parentNode,
                    bup = b.parentNode,
                    ap = [a],
                    bp = [b];
                if (a === b) return hasDuplicate = !0, 0;
                if (!aup || !bup) return a === doc ? -1 : b === doc ? 1 : aup ? -1 : bup ? 1 : sortInput ? indexOf.call(sortInput, a) - indexOf.call(sortInput, b) : 0;
                if (aup === bup) return siblingCheck(a, b);
                for (cur = a; cur = cur.parentNode;) ap.unshift(cur);
                for (cur = b; cur = cur.parentNode;) bp.unshift(cur);
                for (; ap[i] === bp[i];) i++;
                return i ? siblingCheck(ap[i], bp[i]) : ap[i] === preferredDoc ? -1 : bp[i] === preferredDoc ? 1 : 0
            }, doc) : document
        }, Sizzle.matches = function(expr, elements) {
            return Sizzle(expr, null, null, elements)
        }, Sizzle.matchesSelector = function(elem, expr) {
            if ((elem.ownerDocument || elem) !== document && setDocument(elem), expr = expr.replace(rattributeQuotes, "='$1']"), !(!support.matchesSelector || !documentIsHTML || rbuggyMatches && rbuggyMatches.test(expr) || rbuggyQSA && rbuggyQSA.test(expr))) try {
                var ret = matches.call(elem, expr);
                if (ret || support.disconnectedMatch || elem.document && 11 !== elem.document.nodeType) return ret
            } catch (e) {}
            return Sizzle(expr, document, null, [elem]).length > 0
        }, Sizzle.contains = function(context, elem) {
            return (context.ownerDocument || context) !== document && setDocument(context), contains(context, elem)
        }, Sizzle.attr = function(elem, name) {
            (elem.ownerDocument || elem) !== document && setDocument(elem);
            var fn = Expr.attrHandle[name.toLowerCase()],
                val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn(elem, name, !documentIsHTML) : undefined;
            return val === undefined ? support.attributes || !documentIsHTML ? elem.getAttribute(name) : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null : val
        }, Sizzle.error = function(msg) {
            throw Error("Syntax error, unrecognized expression: " + msg)
        }, Sizzle.uniqueSort = function(results) {
            var elem, duplicates = [],
                j = 0,
                i = 0;
            if (hasDuplicate = !support.detectDuplicates, sortInput = !support.sortStable && results.slice(0), results.sort(sortOrder), hasDuplicate) {
                for (; elem = results[i++];) elem === results[i] && (j = duplicates.push(i));
                for (; j--;) results.splice(duplicates[j], 1)
            }
            return results
        }, getText = Sizzle.getText = function(elem) {
            var node, ret = "",
                i = 0,
                nodeType = elem.nodeType;
            if (nodeType) {
                if (1 === nodeType || 9 === nodeType || 11 === nodeType) {
                    if ("string" == typeof elem.textContent) return elem.textContent;
                    for (elem = elem.firstChild; elem; elem = elem.nextSibling) ret += getText(elem)
                } else if (3 === nodeType || 4 === nodeType) return elem.nodeValue
            } else
                for (; node = elem[i]; i++) ret += getText(node);
            return ret
        }, Expr = Sizzle.selectors = {
            cacheLength: 50,
            createPseudo: markFunction,
            match: matchExpr,
            attrHandle: {},
            find: {},
            relative: {
                ">": {
                    dir: "parentNode",
                    first: !0
                },
                " ": {
                    dir: "parentNode"
                },
                "+": {
                    dir: "previousSibling",
                    first: !0
                },
                "~": {
                    dir: "previousSibling"
                }
            },
            preFilter: {
                ATTR: function(match) {
                    return match[1] = match[1].replace(runescape, funescape), match[3] = (match[4] || match[5] || "").replace(runescape, funescape), "~=" === match[2] && (match[3] = " " + match[3] + " "), match.slice(0, 4)
                },
                CHILD: function(match) {
                    return match[1] = match[1].toLowerCase(), "nth" === match[1].slice(0, 3) ? (match[3] || Sizzle.error(match[0]), match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * ("even" === match[3] || "odd" === match[3])), match[5] = +(match[7] + match[8] || "odd" === match[3])) : match[3] && Sizzle.error(match[0]), match
                },
                PSEUDO: function(match) {
                    var excess, unquoted = !match[5] && match[2];
                    return matchExpr.CHILD.test(match[0]) ? null : (match[3] && match[4] !== undefined ? match[2] = match[4] : unquoted && rpseudo.test(unquoted) && (excess = tokenize(unquoted, !0)) && (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length) && (match[0] = match[0].slice(0, excess), match[2] = unquoted.slice(0, excess)), match.slice(0, 3))
                }
            },
            filter: {
                TAG: function(nodeNameSelector) {
                    var nodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
                    return "*" === nodeNameSelector ? function() {
                        return !0
                    } : function(elem) {
                        return elem.nodeName && elem.nodeName.toLowerCase() === nodeName
                    }
                },
                CLASS: function(className) {
                    var pattern = classCache[className + " "];
                    return pattern || (pattern = RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function(elem) {
                        return pattern.test("string" == typeof elem.className && elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "")
                    })
                },
                ATTR: function(name, operator, check) {
                    return function(elem) {
                        var result = Sizzle.attr(elem, name);
                        return null == result ? "!=" === operator : operator ? (result += "", "=" === operator ? result === check : "!=" === operator ? result !== check : "^=" === operator ? check && 0 === result.indexOf(check) : "*=" === operator ? check && result.indexOf(check) > -1 : "$=" === operator ? check && result.slice(-check.length) === check : "~=" === operator ? (" " + result + " ").indexOf(check) > -1 : "|=" === operator ? result === check || result.slice(0, check.length + 1) === check + "-" : !1) : !0
                    }
                },
                CHILD: function(type, what, argument, first, last) {
                    var simple = "nth" !== type.slice(0, 3),
                        forward = "last" !== type.slice(-4),
                        ofType = "of-type" === what;
                    return 1 === first && 0 === last ? function(elem) {
                        return !!elem.parentNode
                    } : function(elem, context, xml) {
                        var cache, outerCache, node, diff, nodeIndex, start, dir = simple !== forward ? "nextSibling" : "previousSibling",
                            parent = elem.parentNode,
                            name = ofType && elem.nodeName.toLowerCase(),
                            useCache = !xml && !ofType;
                        if (parent) {
                            if (simple) {
                                for (; dir;) {
                                    for (node = elem; node = node[dir];)
                                        if (ofType ? node.nodeName.toLowerCase() === name : 1 === node.nodeType) return !1;
                                    start = dir = "only" === type && !start && "nextSibling"
                                }
                                return !0
                            }
                            if (start = [forward ? parent.firstChild : parent.lastChild], forward && useCache) {
                                for (outerCache = parent[expando] || (parent[expando] = {}), cache = outerCache[type] || [], nodeIndex = cache[0] === dirruns && cache[1], diff = cache[0] === dirruns && cache[2], node = nodeIndex && parent.childNodes[nodeIndex]; node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop();)
                                    if (1 === node.nodeType && ++diff && node === elem) {
                                        outerCache[type] = [dirruns, nodeIndex, diff];
                                        break
                                    }
                            } else if (useCache && (cache = (elem[expando] || (elem[expando] = {}))[type]) && cache[0] === dirruns) diff = cache[1];
                            else
                                for (;
                                    (node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) && ((ofType ? node.nodeName.toLowerCase() !== name : 1 !== node.nodeType) || !++diff || (useCache && ((node[expando] || (node[expando] = {}))[type] = [dirruns, diff]), node !== elem)););
                            return diff -= last, diff === first || 0 === diff % first && diff / first >= 0
                        }
                    }
                },
                PSEUDO: function(pseudo, argument) {
                    var args, fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo);
                    return fn[expando] ? fn(argument) : fn.length > 1 ? (args = [pseudo, pseudo, "", argument], Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function(seed, matches) {
                        for (var idx, matched = fn(seed, argument), i = matched.length; i--;) idx = indexOf.call(seed, matched[i]), seed[idx] = !(matches[idx] = matched[i])
                    }) : function(elem) {
                        return fn(elem, 0, args)
                    }) : fn
                }
            },
            pseudos: {
                not: markFunction(function(selector) {
                    var input = [],
                        results = [],
                        matcher = compile(selector.replace(rtrim, "$1"));
                    return matcher[expando] ? markFunction(function(seed, matches, context, xml) {
                        for (var elem, unmatched = matcher(seed, null, xml, []), i = seed.length; i--;)(elem = unmatched[i]) && (seed[i] = !(matches[i] = elem))
                    }) : function(elem, context, xml) {
                        return input[0] = elem, matcher(input, null, xml, results), !results.pop()
                    }
                }),
                has: markFunction(function(selector) {
                    return function(elem) {
                        return Sizzle(selector, elem).length > 0
                    }
                }),
                contains: markFunction(function(text) {
                    return function(elem) {
                        return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1
                    }
                }),
                lang: markFunction(function(lang) {
                    return ridentifier.test(lang || "") || Sizzle.error("unsupported lang: " + lang), lang = lang.replace(runescape, funescape).toLowerCase(),
                    function(elem) {
                        var elemLang;
                        do
                            if (elemLang = documentIsHTML ? elem.lang : elem.getAttribute("xml:lang") || elem.getAttribute("lang")) return elemLang = elemLang.toLowerCase(), elemLang === lang || 0 === elemLang.indexOf(lang + "-"); while ((elem = elem.parentNode) && 1 === elem.nodeType);
                        return !1
                    }
                }),
                target: function(elem) {
                    var hash = window.location && window.location.hash;
                    return hash && hash.slice(1) === elem.id
                },
                root: function(elem) {
                    return elem === docElem
                },
                focus: function(elem) {
                    return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !! (elem.type || elem.href || ~elem.tabIndex)
                },
                enabled: function(elem) {
                    return elem.disabled === !1
                },
                disabled: function(elem) {
                    return elem.disabled === !0
                },
                checked: function(elem) {
                    var nodeName = elem.nodeName.toLowerCase();
                    return "input" === nodeName && !! elem.checked || "option" === nodeName && !! elem.selected
                },
                selected: function(elem) {
                    return elem.parentNode && elem.parentNode.selectedIndex, elem.selected === !0
                },
                empty: function(elem) {
                    for (elem = elem.firstChild; elem; elem = elem.nextSibling)
                        if (elem.nodeName > "@" || 3 === elem.nodeType || 4 === elem.nodeType) return !1;
                    return !0
                },
                parent: function(elem) {
                    return !Expr.pseudos.empty(elem)
                },
                header: function(elem) {
                    return rheader.test(elem.nodeName)
                },
                input: function(elem) {
                    return rinputs.test(elem.nodeName)
                },
                button: function(elem) {
                    var name = elem.nodeName.toLowerCase();
                    return "input" === name && "button" === elem.type || "button" === name
                },
                text: function(elem) {
                    var attr;
                    return "input" === elem.nodeName.toLowerCase() && "text" === elem.type && (null == (attr = elem.getAttribute("type")) || attr.toLowerCase() === elem.type)
                },
                first: createPositionalPseudo(function() {
                    return [0]
                }),
                last: createPositionalPseudo(function(matchIndexes, length) {
                    return [length - 1]
                }),
                eq: createPositionalPseudo(function(matchIndexes, length, argument) {
                    return [0 > argument ? argument + length : argument]
                }),
                even: createPositionalPseudo(function(matchIndexes, length) {
                    for (var i = 0; length > i; i += 2) matchIndexes.push(i);
                    return matchIndexes
                }),
                odd: createPositionalPseudo(function(matchIndexes, length) {
                    for (var i = 1; length > i; i += 2) matchIndexes.push(i);
                    return matchIndexes
                }),
                lt: createPositionalPseudo(function(matchIndexes, length, argument) {
                    for (var i = 0 > argument ? argument + length : argument; --i >= 0;) matchIndexes.push(i);
                    return matchIndexes
                }),
                gt: createPositionalPseudo(function(matchIndexes, length, argument) {
                    for (var i = 0 > argument ? argument + length : argument; length > ++i;) matchIndexes.push(i);
                    return matchIndexes
                })
            }
        };
        for (i in {
            radio: !0,
            checkbox: !0,
            file: !0,
            password: !0,
            image: !0
        }) Expr.pseudos[i] = createInputPseudo(i);
        for (i in {
            submit: !0,
            reset: !0
        }) Expr.pseudos[i] = createButtonPseudo(i);
        compile = Sizzle.compile = function(selector, group) {
            var i, setMatchers = [],
                elementMatchers = [],
                cached = compilerCache[selector + " "];
            if (!cached) {
                for (group || (group = tokenize(selector)), i = group.length; i--;) cached = matcherFromTokens(group[i]), cached[expando] ? setMatchers.push(cached) : elementMatchers.push(cached);
                cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers))
            }
            return cached
        }, Expr.pseudos.nth = Expr.pseudos.eq, setFilters.prototype = Expr.filters = Expr.pseudos, Expr.setFilters = new setFilters, support.sortStable = expando.split("").sort(sortOrder).join("") === expando, setDocument(), [0, 0].sort(sortOrder), support.detectDuplicates = hasDuplicate, jQuery.find = Sizzle, jQuery.expr = Sizzle.selectors, jQuery.expr[":"] = jQuery.expr.pseudos, jQuery.unique = Sizzle.uniqueSort, jQuery.text = Sizzle.getText, jQuery.isXMLDoc = Sizzle.isXML, jQuery.contains = Sizzle.contains
    }(window);
    var optionsCache = {};
    jQuery.Callbacks = function(options) {
        options = "string" == typeof options ? optionsCache[options] || createOptions(options) : jQuery.extend({}, options);
        var firing, memory, fired, firingLength, firingIndex, firingStart, list = [],
            stack = !options.once && [],
            fire = function(data) {
                for (memory = options.memory && data, fired = !0, firingIndex = firingStart || 0, firingStart = 0, firingLength = list.length, firing = !0; list && firingLength > firingIndex; firingIndex++)
                    if (list[firingIndex].apply(data[0], data[1]) === !1 && options.stopOnFalse) {
                        memory = !1;
                        break
                    }
                firing = !1, list && (stack ? stack.length && fire(stack.shift()) : memory ? list = [] : self.disable())
            }, self = {
                add: function() {
                    if (list) {
                        var start = list.length;
                        (function add(args) {
                            jQuery.each(args, function(_, arg) {
                                var type = jQuery.type(arg);
                                "function" === type ? options.unique && self.has(arg) || list.push(arg) : arg && arg.length && "string" !== type && add(arg)
                            })
                        })(arguments), firing ? firingLength = list.length : memory && (firingStart = start, fire(memory))
                    }
                    return this
                },
                remove: function() {
                    return list && jQuery.each(arguments, function(_, arg) {
                        for (var index;
                            (index = jQuery.inArray(arg, list, index)) > -1;) list.splice(index, 1), firing && (firingLength >= index && firingLength--, firingIndex >= index && firingIndex--)
                    }), this
                },
                has: function(fn) {
                    return fn ? jQuery.inArray(fn, list) > -1 : !(!list || !list.length)
                },
                empty: function() {
                    return list = [], firingLength = 0, this
                },
                disable: function() {
                    return list = stack = memory = undefined, this
                },
                disabled: function() {
                    return !list
                },
                lock: function() {
                    return stack = undefined, memory || self.disable(), this
                },
                locked: function() {
                    return !stack
                },
                fireWith: function(context, args) {
                    return args = args || [], args = [context, args.slice ? args.slice() : args], !list || fired && !stack || (firing ? stack.push(args) : fire(args)), this
                },
                fire: function() {
                    return self.fireWith(this, arguments), this
                },
                fired: function() {
                    return !!fired
                }
            };
        return self
    }, jQuery.extend({
        Deferred: function(func) {
            var tuples = [
                ["resolve", "done", jQuery.Callbacks("once memory"), "resolved"],
                ["reject", "fail", jQuery.Callbacks("once memory"), "rejected"],
                ["notify", "progress", jQuery.Callbacks("memory")]
            ],
                state = "pending",
                promise = {
                    state: function() {
                        return state
                    },
                    always: function() {
                        return deferred.done(arguments).fail(arguments), this
                    },
                    then: function() {
                        var fns = arguments;
                        return jQuery.Deferred(function(newDefer) {
                            jQuery.each(tuples, function(i, tuple) {
                                var action = tuple[0],
                                    fn = jQuery.isFunction(fns[i]) && fns[i];
                                deferred[tuple[1]](function() {
                                    var returned = fn && fn.apply(this, arguments);
                                    returned && jQuery.isFunction(returned.promise) ? returned.promise().done(newDefer.resolve).fail(newDefer.reject).progress(newDefer.notify) : newDefer[action + "With"](this === promise ? newDefer.promise() : this, fn ? [returned] : arguments)
                                })
                            }), fns = null
                        }).promise()
                    },
                    promise: function(obj) {
                        return null != obj ? jQuery.extend(obj, promise) : promise
                    }
                }, deferred = {};
            return promise.pipe = promise.then, jQuery.each(tuples, function(i, tuple) {
                var list = tuple[2],
                    stateString = tuple[3];
                promise[tuple[1]] = list.add, stateString && list.add(function() {
                    state = stateString
                }, tuples[1 ^ i][2].disable, tuples[2][2].lock), deferred[tuple[0]] = function() {
                    return deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments), this
                }, deferred[tuple[0] + "With"] = list.fireWith
            }), promise.promise(deferred), func && func.call(deferred, deferred), deferred
        },
        when: function(subordinate) {
            var progressValues, progressContexts, resolveContexts, i = 0,
                resolveValues = core_slice.call(arguments),
                length = resolveValues.length,
                remaining = 1 !== length || subordinate && jQuery.isFunction(subordinate.promise) ? length : 0,
                deferred = 1 === remaining ? subordinate : jQuery.Deferred(),
                updateFunc = function(i, contexts, values) {
                    return function(value) {
                        contexts[i] = this, values[i] = arguments.length > 1 ? core_slice.call(arguments) : value, values === progressValues ? deferred.notifyWith(contexts, values) : --remaining || deferred.resolveWith(contexts, values)
                    }
                };
            if (length > 1)
                for (progressValues = Array(length), progressContexts = Array(length), resolveContexts = Array(length); length > i; i++) resolveValues[i] && jQuery.isFunction(resolveValues[i].promise) ? resolveValues[i].promise().done(updateFunc(i, resolveContexts, resolveValues)).fail(deferred.reject).progress(updateFunc(i, progressContexts, progressValues)) : --remaining;
            return remaining || deferred.resolveWith(resolveContexts, resolveValues), deferred.promise()
        }
    }), jQuery.support = function(support) {
        var all, a, input, select, fragment, opt, eventName, isSupported, i, div = document.createElement("div");
        if (div.setAttribute("className", "t"), div.innerHTML = " <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", all = div.getElementsByTagName("*") || [], a = div.getElementsByTagName("a")[0], !a || !a.style || !all.length) return support;
        select = document.createElement("select"), opt = select.appendChild(document.createElement("option")), input = div.getElementsByTagName("input")[0], a.style.cssText = "top:1px;float:left;opacity:.5", support.getSetAttribute = "t" !== div.className, support.leadingWhitespace = 3 === div.firstChild.nodeType, support.tbody = !div.getElementsByTagName("tbody").length, support.htmlSerialize = !! div.getElementsByTagName("link").length, support.style = /top/.test(a.getAttribute("style")), support.hrefNormalized = "/a" === a.getAttribute("href"), support.opacity = /^0.5/.test(a.style.opacity), support.cssFloat = !! a.style.cssFloat, support.checkOn = !! input.value, support.optSelected = opt.selected, support.enctype = !! document.createElement("form").enctype, support.html5Clone = "<:nav></:nav>" !== document.createElement("nav").cloneNode(!0).outerHTML, support.inlineBlockNeedsLayout = !1, support.shrinkWrapBlocks = !1, support.pixelPosition = !1, support.deleteExpando = !0, support.noCloneEvent = !0, support.reliableMarginRight = !0, support.boxSizingReliable = !0, input.checked = !0, support.noCloneChecked = input.cloneNode(!0).checked, select.disabled = !0, support.optDisabled = !opt.disabled;
        try {
            delete div.test
        } catch (e) {
            support.deleteExpando = !1
        }
        input = document.createElement("input"), input.setAttribute("value", ""), support.input = "" === input.getAttribute("value"), input.value = "t", input.setAttribute("type", "radio"), support.radioValue = "t" === input.value, input.setAttribute("checked", "t"), input.setAttribute("name", "t"), fragment = document.createDocumentFragment(), fragment.appendChild(input), support.appendChecked = input.checked, support.checkClone = fragment.cloneNode(!0).cloneNode(!0).lastChild.checked, div.attachEvent && (div.attachEvent("onclick", function() {
            support.noCloneEvent = !1
        }), div.cloneNode(!0).click());
        for (i in {
            submit: !0,
            change: !0,
            focusin: !0
        }) div.setAttribute(eventName = "on" + i, "t"), support[i + "Bubbles"] = eventName in window || div.attributes[eventName].expando === !1;
        div.style.backgroundClip = "content-box", div.cloneNode(!0).style.backgroundClip = "", support.clearCloneStyle = "content-box" === div.style.backgroundClip;
        for (i in jQuery(support)) break;
        return support.ownLast = "0" !== i, jQuery(function() {
            var container, marginDiv, tds, divReset = "padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;",
                body = document.getElementsByTagName("body")[0];
            body && (container = document.createElement("div"), container.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px", body.appendChild(container).appendChild(div), div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>", tds = div.getElementsByTagName("td"), tds[0].style.cssText = "padding:0;margin:0;border:0;display:none", isSupported = 0 === tds[0].offsetHeight, tds[0].style.display = "", tds[1].style.display = "none", support.reliableHiddenOffsets = isSupported && 0 === tds[0].offsetHeight, div.innerHTML = "", div.style.cssText = "box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;", jQuery.swap(body, null != body.style.zoom ? {
                zoom: 1
            } : {}, function() {
                support.boxSizing = 4 === div.offsetWidth
            }), window.getComputedStyle && (support.pixelPosition = "1%" !== (window.getComputedStyle(div, null) || {}).top, support.boxSizingReliable = "4px" === (window.getComputedStyle(div, null) || {
                width: "4px"
            }).width, marginDiv = div.appendChild(document.createElement("div")), marginDiv.style.cssText = div.style.cssText = divReset, marginDiv.style.marginRight = marginDiv.style.width = "0", div.style.width = "1px", support.reliableMarginRight = !parseFloat((window.getComputedStyle(marginDiv, null) || {}).marginRight)), typeof div.style.zoom !== core_strundefined && (div.innerHTML = "", div.style.cssText = divReset + "width:1px;padding:1px;display:inline;zoom:1", support.inlineBlockNeedsLayout = 3 === div.offsetWidth, div.style.display = "block", div.innerHTML = "<div></div>", div.firstChild.style.width = "5px", support.shrinkWrapBlocks = 3 !== div.offsetWidth, support.inlineBlockNeedsLayout && (body.style.zoom = 1)), body.removeChild(container), container = div = tds = marginDiv = null)
        }), all = select = fragment = opt = a = input = null, support
    }({});
    var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
        rmultiDash = /([A-Z])/g;
    jQuery.extend({
        cache: {},
        noData: {
            applet: !0,
            embed: !0,
            object: "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
        },
        hasData: function(elem) {
            return elem = elem.nodeType ? jQuery.cache[elem[jQuery.expando]] : elem[jQuery.expando], !! elem && !isEmptyDataObject(elem)
        },
        data: function(elem, name, data) {
            return internalData(elem, name, data)
        },
        removeData: function(elem, name) {
            return internalRemoveData(elem, name)
        },
        _data: function(elem, name, data) {
            return internalData(elem, name, data, !0)
        },
        _removeData: function(elem, name) {
            return internalRemoveData(elem, name, !0)
        },
        acceptData: function(elem) {
            if (elem.nodeType && 1 !== elem.nodeType && 9 !== elem.nodeType) return !1;
            var noData = elem.nodeName && jQuery.noData[elem.nodeName.toLowerCase()];
            return !noData || noData !== !0 && elem.getAttribute("classid") === noData
        }
    }), jQuery.fn.extend({
        data: function(key, value) {
            var attrs, name, data = null,
                i = 0,
                elem = this[0];
            if (key === undefined) {
                if (this.length && (data = jQuery.data(elem), 1 === elem.nodeType && !jQuery._data(elem, "parsedAttrs"))) {
                    for (attrs = elem.attributes; attrs.length > i; i++) name = attrs[i].name, 0 === name.indexOf("data-") && (name = jQuery.camelCase(name.slice(5)), dataAttr(elem, name, data[name]));
                    jQuery._data(elem, "parsedAttrs", !0)
                }
                return data
            }
            return "object" == typeof key ? this.each(function() {
                jQuery.data(this, key)
            }) : arguments.length > 1 ? this.each(function() {
                jQuery.data(this, key, value)
            }) : elem ? dataAttr(elem, key, jQuery.data(elem, key)) : null
        },
        removeData: function(key) {
            return this.each(function() {
                jQuery.removeData(this, key)
            })
        }
    }), jQuery.extend({
        queue: function(elem, type, data) {
            var queue;
            return elem ? (type = (type || "fx") + "queue", queue = jQuery._data(elem, type), data && (!queue || jQuery.isArray(data) ? queue = jQuery._data(elem, type, jQuery.makeArray(data)) : queue.push(data)), queue || []) : undefined
        },
        dequeue: function(elem, type) {
            type = type || "fx";
            var queue = jQuery.queue(elem, type),
                startLength = queue.length,
                fn = queue.shift(),
                hooks = jQuery._queueHooks(elem, type),
                next = function() {
                    jQuery.dequeue(elem, type)
                };
            "inprogress" === fn && (fn = queue.shift(), startLength--), fn && ("fx" === type && queue.unshift("inprogress"), delete hooks.stop, fn.call(elem, next, hooks)), !startLength && hooks && hooks.empty.fire()
        },
        _queueHooks: function(elem, type) {
            var key = type + "queueHooks";
            return jQuery._data(elem, key) || jQuery._data(elem, key, {
                empty: jQuery.Callbacks("once memory").add(function() {
                    jQuery._removeData(elem, type + "queue"), jQuery._removeData(elem, key)
                })
            })
        }
    }), jQuery.fn.extend({
        queue: function(type, data) {
            var setter = 2;
            return "string" != typeof type && (data = type, type = "fx", setter--), setter > arguments.length ? jQuery.queue(this[0], type) : data === undefined ? this : this.each(function() {
                var queue = jQuery.queue(this, type, data);
                jQuery._queueHooks(this, type), "fx" === type && "inprogress" !== queue[0] && jQuery.dequeue(this, type)
            })
        },
        dequeue: function(type) {
            return this.each(function() {
                jQuery.dequeue(this, type)
            })
        },
        delay: function(time, type) {
            return time = jQuery.fx ? jQuery.fx.speeds[time] || time : time, type = type || "fx", this.queue(type, function(next, hooks) {
                var timeout = setTimeout(next, time);
                hooks.stop = function() {
                    clearTimeout(timeout)
                }
            })
        },
        clearQueue: function(type) {
            return this.queue(type || "fx", [])
        },
        promise: function(type, obj) {
            var tmp, count = 1,
                defer = jQuery.Deferred(),
                elements = this,
                i = this.length,
                resolve = function() {
                    --count || defer.resolveWith(elements, [elements])
                };
            for ("string" != typeof type && (obj = type, type = undefined), type = type || "fx"; i--;) tmp = jQuery._data(elements[i], type + "queueHooks"), tmp && tmp.empty && (count++, tmp.empty.add(resolve));
            return resolve(), defer.promise(obj)
        }
    });
    var nodeHook, boolHook, rclass = /[\t\r\n\f]/g,
        rreturn = /\r/g,
        rfocusable = /^(?:input|select|textarea|button|object)$/i,
        rclickable = /^(?:a|area)$/i,
        ruseDefault = /^(?:checked|selected)$/i,
        getSetAttribute = jQuery.support.getSetAttribute,
        getSetInput = jQuery.support.input;
    jQuery.fn.extend({
        attr: function(name, value) {
            return jQuery.access(this, jQuery.attr, name, value, arguments.length > 1)
        },
        removeAttr: function(name) {
            return this.each(function() {
                jQuery.removeAttr(this, name)
            })
        },
        prop: function(name, value) {
            return jQuery.access(this, jQuery.prop, name, value, arguments.length > 1)
        },
        removeProp: function(name) {
            return name = jQuery.propFix[name] || name, this.each(function() {
                try {
                    this[name] = undefined, delete this[name]
                } catch (e) {}
            })
        },
        addClass: function(value) {
            var classes, elem, cur, clazz, j, i = 0,
                len = this.length,
                proceed = "string" == typeof value && value;
            if (jQuery.isFunction(value)) return this.each(function(j) {
                jQuery(this).addClass(value.call(this, j, this.className))
            });
            if (proceed)
                for (classes = (value || "").match(core_rnotwhite) || []; len > i; i++)
                    if (elem = this[i], cur = 1 === elem.nodeType && (elem.className ? (" " + elem.className + " ").replace(rclass, " ") : " ")) {
                        for (j = 0; clazz = classes[j++];) 0 > cur.indexOf(" " + clazz + " ") && (cur += clazz + " ");
                        elem.className = jQuery.trim(cur)
                    }
            return this
        },
        removeClass: function(value) {
            var classes, elem, cur, clazz, j, i = 0,
                len = this.length,
                proceed = 0 === arguments.length || "string" == typeof value && value;
            if (jQuery.isFunction(value)) return this.each(function(j) {
                jQuery(this).removeClass(value.call(this, j, this.className))
            });
            if (proceed)
                for (classes = (value || "").match(core_rnotwhite) || []; len > i; i++)
                    if (elem = this[i], cur = 1 === elem.nodeType && (elem.className ? (" " + elem.className + " ").replace(rclass, " ") : "")) {
                        for (j = 0; clazz = classes[j++];)
                            for (; cur.indexOf(" " + clazz + " ") >= 0;) cur = cur.replace(" " + clazz + " ", " ");
                        elem.className = value ? jQuery.trim(cur) : ""
                    }
            return this
        },
        toggleClass: function(value, stateVal) {
            var type = typeof value,
                isBool = "boolean" == typeof stateVal;
            return jQuery.isFunction(value) ? this.each(function(i) {
                jQuery(this).toggleClass(value.call(this, i, this.className, stateVal), stateVal)
            }) : this.each(function() {
                if ("string" === type)
                    for (var className, i = 0, self = jQuery(this), state = stateVal, classNames = value.match(core_rnotwhite) || []; className = classNames[i++];) state = isBool ? state : !self.hasClass(className), self[state ? "addClass" : "removeClass"](className);
                else(type === core_strundefined || "boolean" === type) && (this.className && jQuery._data(this, "__className__", this.className), this.className = this.className || value === !1 ? "" : jQuery._data(this, "__className__") || "")
            })
        },
        hasClass: function(selector) {
            for (var className = " " + selector + " ", i = 0, l = this.length; l > i; i++)
                if (1 === this[i].nodeType && (" " + this[i].className + " ").replace(rclass, " ").indexOf(className) >= 0) return !0;
            return !1
        },
        val: function(value) {
            var ret, hooks, isFunction, elem = this[0]; {
                if (arguments.length) return isFunction = jQuery.isFunction(value), this.each(function(i) {
                    var val;
                    1 === this.nodeType && (val = isFunction ? value.call(this, i, jQuery(this).val()) : value, null == val ? val = "" : "number" == typeof val ? val += "" : jQuery.isArray(val) && (val = jQuery.map(val, function(value) {
                        return null == value ? "" : value + ""
                    })), hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()], hooks && "set" in hooks && hooks.set(this, val, "value") !== undefined || (this.value = val))
                });
                if (elem) return hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()], hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== undefined ? ret : (ret = elem.value, "string" == typeof ret ? ret.replace(rreturn, "") : null == ret ? "" : ret)
            }
        }
    }), jQuery.extend({
        valHooks: {
            option: {
                get: function(elem) {
                    var val = jQuery.find.attr(elem, "value");
                    return null != val ? val : elem.text
                }
            },
            select: {
                get: function(elem) {
                    for (var value, option, options = elem.options, index = elem.selectedIndex, one = "select-one" === elem.type || 0 > index, values = one ? null : [], max = one ? index + 1 : options.length, i = 0 > index ? max : one ? index : 0; max > i; i++)
                        if (option = options[i], !(!option.selected && i !== index || (jQuery.support.optDisabled ? option.disabled : null !== option.getAttribute("disabled")) || option.parentNode.disabled && jQuery.nodeName(option.parentNode, "optgroup"))) {
                            if (value = jQuery(option).val(), one) return value;
                            values.push(value)
                        }
                    return values
                },
                set: function(elem, value) {
                    for (var optionSet, option, options = elem.options, values = jQuery.makeArray(value), i = options.length; i--;) option = options[i], (option.selected = jQuery.inArray(jQuery(option).val(), values) >= 0) && (optionSet = !0);
                    return optionSet || (elem.selectedIndex = -1), values
                }
            }
        },
        attr: function(elem, name, value) {
            var hooks, ret, nType = elem.nodeType;
            if (elem && 3 !== nType && 8 !== nType && 2 !== nType) return typeof elem.getAttribute === core_strundefined ? jQuery.prop(elem, name, value) : (1 === nType && jQuery.isXMLDoc(elem) || (name = name.toLowerCase(), hooks = jQuery.attrHooks[name] || (jQuery.expr.match.bool.test(name) ? boolHook : nodeHook)), value === undefined ? hooks && "get" in hooks && null !== (ret = hooks.get(elem, name)) ? ret : (ret = jQuery.find.attr(elem, name), null == ret ? undefined : ret) : null !== value ? hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined ? ret : (elem.setAttribute(name, value + ""), value) : (jQuery.removeAttr(elem, name), undefined))
        },
        removeAttr: function(elem, value) {
            var name, propName, i = 0,
                attrNames = value && value.match(core_rnotwhite);
            if (attrNames && 1 === elem.nodeType)
                for (; name = attrNames[i++];) propName = jQuery.propFix[name] || name, jQuery.expr.match.bool.test(name) ? getSetInput && getSetAttribute || !ruseDefault.test(name) ? elem[propName] = !1 : elem[jQuery.camelCase("default-" + name)] = elem[propName] = !1 : jQuery.attr(elem, name, ""), elem.removeAttribute(getSetAttribute ? name : propName)
        },
        attrHooks: {
            type: {
                set: function(elem, value) {
                    if (!jQuery.support.radioValue && "radio" === value && jQuery.nodeName(elem, "input")) {
                        var val = elem.value;
                        return elem.setAttribute("type", value), val && (elem.value = val), value
                    }
                }
            }
        },
        propFix: {
            "for": "htmlFor",
            "class": "className"
        },
        prop: function(elem, name, value) {
            var ret, hooks, notxml, nType = elem.nodeType;
            if (elem && 3 !== nType && 8 !== nType && 2 !== nType) return notxml = 1 !== nType || !jQuery.isXMLDoc(elem), notxml && (name = jQuery.propFix[name] || name, hooks = jQuery.propHooks[name]), value !== undefined ? hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined ? ret : elem[name] = value : hooks && "get" in hooks && null !== (ret = hooks.get(elem, name)) ? ret : elem[name]
        },
        propHooks: {
            tabIndex: {
                get: function(elem) {
                    var tabindex = jQuery.find.attr(elem, "tabindex");
                    return tabindex ? parseInt(tabindex, 10) : rfocusable.test(elem.nodeName) || rclickable.test(elem.nodeName) && elem.href ? 0 : -1
                }
            }
        }
    }), boolHook = {
        set: function(elem, value, name) {
            return value === !1 ? jQuery.removeAttr(elem, name) : getSetInput && getSetAttribute || !ruseDefault.test(name) ? elem.setAttribute(!getSetAttribute && jQuery.propFix[name] || name, name) : elem[jQuery.camelCase("default-" + name)] = elem[name] = !0, name
        }
    }, jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g), function(i, name) {
        var getter = jQuery.expr.attrHandle[name] || jQuery.find.attr;
        jQuery.expr.attrHandle[name] = getSetInput && getSetAttribute || !ruseDefault.test(name) ? function(elem, name, isXML) {
            var fn = jQuery.expr.attrHandle[name],
                ret = isXML ? undefined : (jQuery.expr.attrHandle[name] = undefined) != getter(elem, name, isXML) ? name.toLowerCase() : null;
            return jQuery.expr.attrHandle[name] = fn, ret
        } : function(elem, name, isXML) {
            return isXML ? undefined : elem[jQuery.camelCase("default-" + name)] ? name.toLowerCase() : null
        }
    }), getSetInput && getSetAttribute || (jQuery.attrHooks.value = {
        set: function(elem, value, name) {
            return jQuery.nodeName(elem, "input") ? (elem.defaultValue = value, undefined) : nodeHook && nodeHook.set(elem, value, name)
        }
    }), getSetAttribute || (nodeHook = {
        set: function(elem, value, name) {
            var ret = elem.getAttributeNode(name);
            return ret || elem.setAttributeNode(ret = elem.ownerDocument.createAttribute(name)), ret.value = value += "", "value" === name || value === elem.getAttribute(name) ? value : undefined
        }
    }, jQuery.expr.attrHandle.id = jQuery.expr.attrHandle.name = jQuery.expr.attrHandle.coords = function(elem, name, isXML) {
        var ret;
        return isXML ? undefined : (ret = elem.getAttributeNode(name)) && "" !== ret.value ? ret.value : null
    }, jQuery.valHooks.button = {
        get: function(elem, name) {
            var ret = elem.getAttributeNode(name);
            return ret && ret.specified ? ret.value : undefined
        },
        set: nodeHook.set
    }, jQuery.attrHooks.contenteditable = {
        set: function(elem, value, name) {
            nodeHook.set(elem, "" === value ? !1 : value, name)
        }
    }, jQuery.each(["width", "height"], function(i, name) {
        jQuery.attrHooks[name] = {
            set: function(elem, value) {
                return "" === value ? (elem.setAttribute(name, "auto"), value) : undefined
            }
        }
    })), jQuery.support.hrefNormalized || jQuery.each(["href", "src"], function(i, name) {
        jQuery.propHooks[name] = {
            get: function(elem) {
                return elem.getAttribute(name, 4)
            }
        }
    }), jQuery.support.style || (jQuery.attrHooks.style = {
        get: function(elem) {
            return elem.style.cssText || undefined
        },
        set: function(elem, value) {
            return elem.style.cssText = value + ""
        }
    }), jQuery.support.optSelected || (jQuery.propHooks.selected = {
        get: function(elem) {
            var parent = elem.parentNode;
            return parent && (parent.selectedIndex, parent.parentNode && parent.parentNode.selectedIndex), null
        }
    }), jQuery.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function() {
        jQuery.propFix[this.toLowerCase()] = this
    }), jQuery.support.enctype || (jQuery.propFix.enctype = "encoding"), jQuery.each(["radio", "checkbox"], function() {
        jQuery.valHooks[this] = {
            set: function(elem, value) {
                return jQuery.isArray(value) ? elem.checked = jQuery.inArray(jQuery(elem).val(), value) >= 0 : undefined
            }
        }, jQuery.support.checkOn || (jQuery.valHooks[this].get = function(elem) {
            return null === elem.getAttribute("value") ? "on" : elem.value
        })
    });
    var rformElems = /^(?:input|select|textarea)$/i,
        rkeyEvent = /^key/,
        rmouseEvent = /^(?:mouse|contextmenu)|click/,
        rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
        rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;
    jQuery.event = {
        global: {},
        add: function(elem, types, handler, data, selector) {
            var tmp, events, t, handleObjIn, special, eventHandle, handleObj, handlers, type, namespaces, origType, elemData = jQuery._data(elem);
            if (elemData) {
                for (handler.handler && (handleObjIn = handler, handler = handleObjIn.handler, selector = handleObjIn.selector), handler.guid || (handler.guid = jQuery.guid++), (events = elemData.events) || (events = elemData.events = {}), (eventHandle = elemData.handle) || (eventHandle = elemData.handle = function(e) {
                    return typeof jQuery === core_strundefined || e && jQuery.event.triggered === e.type ? undefined : jQuery.event.dispatch.apply(eventHandle.elem, arguments)
                }, eventHandle.elem = elem), types = (types || "").match(core_rnotwhite) || [""], t = types.length; t--;) tmp = rtypenamespace.exec(types[t]) || [], type = origType = tmp[1], namespaces = (tmp[2] || "").split(".").sort(), type && (special = jQuery.event.special[type] || {}, type = (selector ? special.delegateType : special.bindType) || type, special = jQuery.event.special[type] || {}, handleObj = jQuery.extend({
                    type: type,
                    origType: origType,
                    data: data,
                    handler: handler,
                    guid: handler.guid,
                    selector: selector,
                    needsContext: selector && jQuery.expr.match.needsContext.test(selector),
                    namespace: namespaces.join(".")
                }, handleObjIn), (handlers = events[type]) || (handlers = events[type] = [], handlers.delegateCount = 0, special.setup && special.setup.call(elem, data, namespaces, eventHandle) !== !1 || (elem.addEventListener ? elem.addEventListener(type, eventHandle, !1) : elem.attachEvent && elem.attachEvent("on" + type, eventHandle))), special.add && (special.add.call(elem, handleObj), handleObj.handler.guid || (handleObj.handler.guid = handler.guid)), selector ? handlers.splice(handlers.delegateCount++, 0, handleObj) : handlers.push(handleObj), jQuery.event.global[type] = !0);
                elem = null
            }
        },
        remove: function(elem, types, handler, selector, mappedTypes) {
            var j, handleObj, tmp, origCount, t, events, special, handlers, type, namespaces, origType, elemData = jQuery.hasData(elem) && jQuery._data(elem);
            if (elemData && (events = elemData.events)) {
                for (types = (types || "").match(core_rnotwhite) || [""], t = types.length; t--;)
                    if (tmp = rtypenamespace.exec(types[t]) || [], type = origType = tmp[1], namespaces = (tmp[2] || "").split(".").sort(), type) {
                        for (special = jQuery.event.special[type] || {}, type = (selector ? special.delegateType : special.bindType) || type, handlers = events[type] || [], tmp = tmp[2] && RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)"), origCount = j = handlers.length; j--;) handleObj = handlers[j], !mappedTypes && origType !== handleObj.origType || handler && handler.guid !== handleObj.guid || tmp && !tmp.test(handleObj.namespace) || selector && selector !== handleObj.selector && ("**" !== selector || !handleObj.selector) || (handlers.splice(j, 1), handleObj.selector && handlers.delegateCount--, special.remove && special.remove.call(elem, handleObj));
                        origCount && !handlers.length && (special.teardown && special.teardown.call(elem, namespaces, elemData.handle) !== !1 || jQuery.removeEvent(elem, type, elemData.handle), delete events[type])
                    } else
                        for (type in events) jQuery.event.remove(elem, type + types[t], handler, selector, !0);
                jQuery.isEmptyObject(events) && (delete elemData.handle, jQuery._removeData(elem, "events"))
            }
        },
        trigger: function(event, data, elem, onlyHandlers) {
            var handle, ontype, cur, bubbleType, special, tmp, i, eventPath = [elem || document],
                type = core_hasOwn.call(event, "type") ? event.type : event,
                namespaces = core_hasOwn.call(event, "namespace") ? event.namespace.split(".") : [];
            if (cur = tmp = elem = elem || document, 3 !== elem.nodeType && 8 !== elem.nodeType && !rfocusMorph.test(type + jQuery.event.triggered) && (type.indexOf(".") >= 0 && (namespaces = type.split("."), type = namespaces.shift(), namespaces.sort()), ontype = 0 > type.indexOf(":") && "on" + type, event = event[jQuery.expando] ? event : new jQuery.Event(type, "object" == typeof event && event), event.isTrigger = onlyHandlers ? 2 : 3, event.namespace = namespaces.join("."), event.namespace_re = event.namespace ? RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null, event.result = undefined, event.target || (event.target = elem), data = null == data ? [event] : jQuery.makeArray(data, [event]), special = jQuery.event.special[type] || {}, onlyHandlers || !special.trigger || special.trigger.apply(elem, data) !== !1)) {
                if (!onlyHandlers && !special.noBubble && !jQuery.isWindow(elem)) {
                    for (bubbleType = special.delegateType || type, rfocusMorph.test(bubbleType + type) || (cur = cur.parentNode); cur; cur = cur.parentNode) eventPath.push(cur), tmp = cur;
                    tmp === (elem.ownerDocument || document) && eventPath.push(tmp.defaultView || tmp.parentWindow || window)
                }
                for (i = 0;
                    (cur = eventPath[i++]) && !event.isPropagationStopped();) event.type = i > 1 ? bubbleType : special.bindType || type, handle = (jQuery._data(cur, "events") || {})[event.type] && jQuery._data(cur, "handle"), handle && handle.apply(cur, data), handle = ontype && cur[ontype], handle && jQuery.acceptData(cur) && handle.apply && handle.apply(cur, data) === !1 && event.preventDefault();
                if (event.type = type, !onlyHandlers && !event.isDefaultPrevented() && (!special._default || special._default.apply(eventPath.pop(), data) === !1) && jQuery.acceptData(elem) && ontype && elem[type] && !jQuery.isWindow(elem)) {
                    tmp = elem[ontype], tmp && (elem[ontype] = null), jQuery.event.triggered = type;
                    try {
                        elem[type]()
                    } catch (e) {}
                    jQuery.event.triggered = undefined, tmp && (elem[ontype] = tmp)
                }
                return event.result
            }
        },
        dispatch: function(event) {
            event = jQuery.event.fix(event);
            var i, ret, handleObj, matched, j, handlerQueue = [],
                args = core_slice.call(arguments),
                handlers = (jQuery._data(this, "events") || {})[event.type] || [],
                special = jQuery.event.special[event.type] || {};
            if (args[0] = event, event.delegateTarget = this, !special.preDispatch || special.preDispatch.call(this, event) !== !1) {
                for (handlerQueue = jQuery.event.handlers.call(this, event, handlers), i = 0;
                    (matched = handlerQueue[i++]) && !event.isPropagationStopped();)
                    for (event.currentTarget = matched.elem, j = 0;
                        (handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped();)(!event.namespace_re || event.namespace_re.test(handleObj.namespace)) && (event.handleObj = handleObj, event.data = handleObj.data, ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args), ret !== undefined && (event.result = ret) === !1 && (event.preventDefault(), event.stopPropagation()));
                return special.postDispatch && special.postDispatch.call(this, event), event.result
            }
        },
        handlers: function(event, handlers) {
            var sel, handleObj, matches, i, handlerQueue = [],
                delegateCount = handlers.delegateCount,
                cur = event.target;
            if (delegateCount && cur.nodeType && (!event.button || "click" !== event.type))
                for (; cur != this; cur = cur.parentNode || this)
                    if (1 === cur.nodeType && (cur.disabled !== !0 || "click" !== event.type)) {
                        for (matches = [], i = 0; delegateCount > i; i++) handleObj = handlers[i], sel = handleObj.selector + " ", matches[sel] === undefined && (matches[sel] = handleObj.needsContext ? jQuery(sel, this).index(cur) >= 0 : jQuery.find(sel, this, null, [cur]).length), matches[sel] && matches.push(handleObj);
                        matches.length && handlerQueue.push({
                            elem: cur,
                            handlers: matches
                        })
                    }
            return handlers.length > delegateCount && handlerQueue.push({
                elem: this,
                handlers: handlers.slice(delegateCount)
            }), handlerQueue
        },
        fix: function(event) {
            if (event[jQuery.expando]) return event;
            var i, prop, copy, type = event.type,
                originalEvent = event,
                fixHook = this.fixHooks[type];
            for (fixHook || (this.fixHooks[type] = fixHook = rmouseEvent.test(type) ? this.mouseHooks : rkeyEvent.test(type) ? this.keyHooks : {}), copy = fixHook.props ? this.props.concat(fixHook.props) : this.props, event = new jQuery.Event(originalEvent), i = copy.length; i--;) prop = copy[i], event[prop] = originalEvent[prop];
            return event.target || (event.target = originalEvent.srcElement || document), 3 === event.target.nodeType && (event.target = event.target.parentNode), event.metaKey = !! event.metaKey, fixHook.filter ? fixHook.filter(event, originalEvent) : event
        },
        props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
        fixHooks: {},
        keyHooks: {
            props: "char charCode key keyCode".split(" "),
            filter: function(event, original) {
                return null == event.which && (event.which = null != original.charCode ? original.charCode : original.keyCode), event
            }
        },
        mouseHooks: {
            props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
            filter: function(event, original) {
                var body, eventDoc, doc, button = original.button,
                    fromElement = original.fromElement;
                return null == event.pageX && null != original.clientX && (eventDoc = event.target.ownerDocument || document, doc = eventDoc.documentElement, body = eventDoc.body, event.pageX = original.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0), event.pageY = original.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0)), !event.relatedTarget && fromElement && (event.relatedTarget = fromElement === event.target ? original.toElement : fromElement), event.which || button === undefined || (event.which = 1 & button ? 1 : 2 & button ? 3 : 4 & button ? 2 : 0), event
            }
        },
        special: {
            load: {
                noBubble: !0
            },
            focus: {
                trigger: function() {
                    if (this !== safeActiveElement() && this.focus) try {
                        return this.focus(), !1
                    } catch (e) {}
                },
                delegateType: "focusin"
            },
            blur: {
                trigger: function() {
                    return this === safeActiveElement() && this.blur ? (this.blur(), !1) : undefined
                },
                delegateType: "focusout"
            },
            click: {
                trigger: function() {
                    return jQuery.nodeName(this, "input") && "checkbox" === this.type && this.click ? (this.click(), !1) : undefined
                },
                _default: function(event) {
                    return jQuery.nodeName(event.target, "a")
                }
            },
            beforeunload: {
                postDispatch: function(event) {
                    event.result !== undefined && (event.originalEvent.returnValue = event.result)
                }
            }
        },
        simulate: function(type, elem, event, bubble) {
            var e = jQuery.extend(new jQuery.Event, event, {
                type: type,
                isSimulated: !0,
                originalEvent: {}
            });
            bubble ? jQuery.event.trigger(e, null, elem) : jQuery.event.dispatch.call(elem, e), e.isDefaultPrevented() && event.preventDefault()
        }
    }, jQuery.removeEvent = document.removeEventListener ? function(elem, type, handle) {
        elem.removeEventListener && elem.removeEventListener(type, handle, !1)
    } : function(elem, type, handle) {
        var name = "on" + type;
        elem.detachEvent && (typeof elem[name] === core_strundefined && (elem[name] = null), elem.detachEvent(name, handle))
    }, jQuery.Event = function(src, props) {
        return this instanceof jQuery.Event ? (src && src.type ? (this.originalEvent = src, this.type = src.type, this.isDefaultPrevented = src.defaultPrevented || src.returnValue === !1 || src.getPreventDefault && src.getPreventDefault() ? returnTrue : returnFalse) : this.type = src, props && jQuery.extend(this, props), this.timeStamp = src && src.timeStamp || jQuery.now(), this[jQuery.expando] = !0, undefined) : new jQuery.Event(src, props)
    }, jQuery.Event.prototype = {
        isDefaultPrevented: returnFalse,
        isPropagationStopped: returnFalse,
        isImmediatePropagationStopped: returnFalse,
        preventDefault: function() {
            var e = this.originalEvent;
            this.isDefaultPrevented = returnTrue, e && (e.preventDefault ? e.preventDefault() : e.returnValue = !1)
        },
        stopPropagation: function() {
            var e = this.originalEvent;
            this.isPropagationStopped = returnTrue, e && (e.stopPropagation && e.stopPropagation(), e.cancelBubble = !0)
        },
        stopImmediatePropagation: function() {
            this.isImmediatePropagationStopped = returnTrue, this.stopPropagation()
        }
    }, jQuery.each({
        mouseenter: "mouseover",
        mouseleave: "mouseout"
    }, function(orig, fix) {
        jQuery.event.special[orig] = {
            delegateType: fix,
            bindType: fix,
            handle: function(event) {
                var ret, target = this,
                    related = event.relatedTarget,
                    handleObj = event.handleObj;
                return (!related || related !== target && !jQuery.contains(target, related)) && (event.type = handleObj.origType, ret = handleObj.handler.apply(this, arguments), event.type = fix), ret
            }
        }
    }), jQuery.support.submitBubbles || (jQuery.event.special.submit = {
        setup: function() {
            return jQuery.nodeName(this, "form") ? !1 : (jQuery.event.add(this, "click._submit keypress._submit", function(e) {
                var elem = e.target,
                    form = jQuery.nodeName(elem, "input") || jQuery.nodeName(elem, "button") ? elem.form : undefined;
                form && !jQuery._data(form, "submitBubbles") && (jQuery.event.add(form, "submit._submit", function(event) {
                    event._submit_bubble = !0
                }), jQuery._data(form, "submitBubbles", !0))
            }), undefined)
        },
        postDispatch: function(event) {
            event._submit_bubble && (delete event._submit_bubble, this.parentNode && !event.isTrigger && jQuery.event.simulate("submit", this.parentNode, event, !0))
        },
        teardown: function() {
            return jQuery.nodeName(this, "form") ? !1 : (jQuery.event.remove(this, "._submit"), undefined)
        }
    }), jQuery.support.changeBubbles || (jQuery.event.special.change = {
        setup: function() {
            return rformElems.test(this.nodeName) ? (("checkbox" === this.type || "radio" === this.type) && (jQuery.event.add(this, "propertychange._change", function(event) {
                "checked" === event.originalEvent.propertyName && (this._just_changed = !0)
            }), jQuery.event.add(this, "click._change", function(event) {
                this._just_changed && !event.isTrigger && (this._just_changed = !1), jQuery.event.simulate("change", this, event, !0)
            })), !1) : (jQuery.event.add(this, "beforeactivate._change", function(e) {
                var elem = e.target;
                rformElems.test(elem.nodeName) && !jQuery._data(elem, "changeBubbles") && (jQuery.event.add(elem, "change._change", function(event) {
                    !this.parentNode || event.isSimulated || event.isTrigger || jQuery.event.simulate("change", this.parentNode, event, !0)
                }), jQuery._data(elem, "changeBubbles", !0))
            }), undefined)
        },
        handle: function(event) {
            var elem = event.target;
            return this !== elem || event.isSimulated || event.isTrigger || "radio" !== elem.type && "checkbox" !== elem.type ? event.handleObj.handler.apply(this, arguments) : undefined
        },
        teardown: function() {
            return jQuery.event.remove(this, "._change"), !rformElems.test(this.nodeName)
        }
    }), jQuery.support.focusinBubbles || jQuery.each({
        focus: "focusin",
        blur: "focusout"
    }, function(orig, fix) {
        var attaches = 0,
            handler = function(event) {
                jQuery.event.simulate(fix, event.target, jQuery.event.fix(event), !0)
            };
        jQuery.event.special[fix] = {
            setup: function() {
                0 === attaches++ && document.addEventListener(orig, handler, !0)
            },
            teardown: function() {
                0 === --attaches && document.removeEventListener(orig, handler, !0)
            }
        }
    }), jQuery.fn.extend({
        on: function(types, selector, data, fn, one) {
            var type, origFn;
            if ("object" == typeof types) {
                "string" != typeof selector && (data = data || selector, selector = undefined);
                for (type in types) this.on(type, selector, data, types[type], one);
                return this
            }
            if (null == data && null == fn ? (fn = selector, data = selector = undefined) : null == fn && ("string" == typeof selector ? (fn = data, data = undefined) : (fn = data, data = selector, selector = undefined)), fn === !1) fn = returnFalse;
            else if (!fn) return this;
            return 1 === one && (origFn = fn, fn = function(event) {
                return jQuery().off(event), origFn.apply(this, arguments)
            }, fn.guid = origFn.guid || (origFn.guid = jQuery.guid++)), this.each(function() {
                jQuery.event.add(this, types, fn, data, selector)
            })
        },
        one: function(types, selector, data, fn) {
            return this.on(types, selector, data, fn, 1)
        },
        off: function(types, selector, fn) {
            var handleObj, type;
            if (types && types.preventDefault && types.handleObj) return handleObj = types.handleObj, jQuery(types.delegateTarget).off(handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType, handleObj.selector, handleObj.handler), this;
            if ("object" == typeof types) {
                for (type in types) this.off(type, selector, types[type]);
                return this
            }
            return (selector === !1 || "function" == typeof selector) && (fn = selector, selector = undefined), fn === !1 && (fn = returnFalse), this.each(function() {
                jQuery.event.remove(this, types, fn, selector)
            })
        },
        trigger: function(type, data) {
            return this.each(function() {
                jQuery.event.trigger(type, data, this)
            })
        },
        triggerHandler: function(type, data) {
            var elem = this[0];
            return elem ? jQuery.event.trigger(type, data, elem, !0) : undefined
        }
    });
    var isSimple = /^.[^:#\[\.,]*$/,
        rparentsprev = /^(?:parents|prev(?:Until|All))/,
        rneedsContext = jQuery.expr.match.needsContext,
        guaranteedUnique = {
            children: !0,
            contents: !0,
            next: !0,
            prev: !0
        };
    jQuery.fn.extend({
        find: function(selector) {
            var i, ret = [],
                self = this,
                len = self.length;
            if ("string" != typeof selector) return this.pushStack(jQuery(selector).filter(function() {
                for (i = 0; len > i; i++)
                    if (jQuery.contains(self[i], this)) return !0
            }));
            for (i = 0; len > i; i++) jQuery.find(selector, self[i], ret);
            return ret = this.pushStack(len > 1 ? jQuery.unique(ret) : ret), ret.selector = this.selector ? this.selector + " " + selector : selector, ret
        },
        has: function(target) {
            var i, targets = jQuery(target, this),
                len = targets.length;
            return this.filter(function() {
                for (i = 0; len > i; i++)
                    if (jQuery.contains(this, targets[i])) return !0
            })
        },
        not: function(selector) {
            return this.pushStack(winnow(this, selector || [], !0))
        },
        filter: function(selector) {
            return this.pushStack(winnow(this, selector || [], !1))
        },
        is: function(selector) {
            return !!winnow(this, "string" == typeof selector && rneedsContext.test(selector) ? jQuery(selector) : selector || [], !1).length
        },
        closest: function(selectors, context) {
            for (var cur, i = 0, l = this.length, ret = [], pos = rneedsContext.test(selectors) || "string" != typeof selectors ? jQuery(selectors, context || this.context) : 0; l > i; i++)
                for (cur = this[i]; cur && cur !== context; cur = cur.parentNode)
                    if (11 > cur.nodeType && (pos ? pos.index(cur) > -1 : 1 === cur.nodeType && jQuery.find.matchesSelector(cur, selectors))) {
                        cur = ret.push(cur);
                        break
                    }
            return this.pushStack(ret.length > 1 ? jQuery.unique(ret) : ret)
        },
        index: function(elem) {
            return elem ? "string" == typeof elem ? jQuery.inArray(this[0], jQuery(elem)) : jQuery.inArray(elem.jquery ? elem[0] : elem, this) : this[0] && this[0].parentNode ? this.first().prevAll().length : -1
        },
        add: function(selector, context) {
            var set = "string" == typeof selector ? jQuery(selector, context) : jQuery.makeArray(selector && selector.nodeType ? [selector] : selector),
                all = jQuery.merge(this.get(), set);
            return this.pushStack(jQuery.unique(all))
        },
        addBack: function(selector) {
            return this.add(null == selector ? this.prevObject : this.prevObject.filter(selector))
        }
    }), jQuery.each({
        parent: function(elem) {
            var parent = elem.parentNode;
            return parent && 11 !== parent.nodeType ? parent : null
        },
        parents: function(elem) {
            return jQuery.dir(elem, "parentNode")
        },
        parentsUntil: function(elem, i, until) {
            return jQuery.dir(elem, "parentNode", until)
        },
        next: function(elem) {
            return sibling(elem, "nextSibling")
        },
        prev: function(elem) {
            return sibling(elem, "previousSibling")
        },
        nextAll: function(elem) {
            return jQuery.dir(elem, "nextSibling")
        },
        prevAll: function(elem) {
            return jQuery.dir(elem, "previousSibling")
        },
        nextUntil: function(elem, i, until) {
            return jQuery.dir(elem, "nextSibling", until)
        },
        prevUntil: function(elem, i, until) {
            return jQuery.dir(elem, "previousSibling", until)
        },
        siblings: function(elem) {
            return jQuery.sibling((elem.parentNode || {}).firstChild, elem)
        },
        children: function(elem) {
            return jQuery.sibling(elem.firstChild)
        },
        contents: function(elem) {
            return jQuery.nodeName(elem, "iframe") ? elem.contentDocument || elem.contentWindow.document : jQuery.merge([], elem.childNodes)
        }
    }, function(name, fn) {
        jQuery.fn[name] = function(until, selector) {
            var ret = jQuery.map(this, fn, until);
            return "Until" !== name.slice(-5) && (selector = until), selector && "string" == typeof selector && (ret = jQuery.filter(selector, ret)), this.length > 1 && (guaranteedUnique[name] || (ret = jQuery.unique(ret)), rparentsprev.test(name) && (ret = ret.reverse())), this.pushStack(ret)
        }
    }), jQuery.extend({
        filter: function(expr, elems, not) {
            var elem = elems[0];
            return not && (expr = ":not(" + expr + ")"), 1 === elems.length && 1 === elem.nodeType ? jQuery.find.matchesSelector(elem, expr) ? [elem] : [] : jQuery.find.matches(expr, jQuery.grep(elems, function(elem) {
                return 1 === elem.nodeType
            }))
        },
        dir: function(elem, dir, until) {
            for (var matched = [], cur = elem[dir]; cur && 9 !== cur.nodeType && (until === undefined || 1 !== cur.nodeType || !jQuery(cur).is(until));) 1 === cur.nodeType && matched.push(cur), cur = cur[dir];
            return matched
        },
        sibling: function(n, elem) {
            for (var r = []; n; n = n.nextSibling) 1 === n.nodeType && n !== elem && r.push(n);
            return r
        }
    });
    var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
        rinlinejQuery = / jQuery\d+="(?:null|\d+)"/g,
        rnoshimcache = RegExp("<(?:" + nodeNames + ")[\\s/>]", "i"),
        rleadingWhitespace = /^\s+/,
        rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
        rtagName = /<([\w:]+)/,
        rtbody = /<tbody/i,
        rhtml = /<|&#?\w+;/,
        rnoInnerhtml = /<(?:script|style|link)/i,
        manipulation_rcheckableType = /^(?:checkbox|radio)$/i,
        rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
        rscriptType = /^$|\/(?:java|ecma)script/i,
        rscriptTypeMasked = /^true\/(.*)/,
        rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,
        wrapMap = {
            option: [1, "<select multiple='multiple'>", "</select>"],
            legend: [1, "<fieldset>", "</fieldset>"],
            area: [1, "<map>", "</map>"],
            param: [1, "<object>", "</object>"],
            thead: [1, "<table>", "</table>"],
            tr: [2, "<table><tbody>", "</tbody></table>"],
            col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
            td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
            _default: jQuery.support.htmlSerialize ? [0, "", ""] : [1, "X<div>", "</div>"]
        }, safeFragment = createSafeFragment(document),
        fragmentDiv = safeFragment.appendChild(document.createElement("div"));
    wrapMap.optgroup = wrapMap.option, wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead, wrapMap.th = wrapMap.td, jQuery.fn.extend({
        text: function(value) {
            return jQuery.access(this, function(value) {
                return value === undefined ? jQuery.text(this) : this.empty().append((this[0] && this[0].ownerDocument || document).createTextNode(value))
            }, null, value, arguments.length)
        },
        append: function() {
            return this.domManip(arguments, function(elem) {
                if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
                    var target = manipulationTarget(this, elem);
                    target.appendChild(elem)
                }
            })
        },
        prepend: function() {
            return this.domManip(arguments, function(elem) {
                if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
                    var target = manipulationTarget(this, elem);
                    target.insertBefore(elem, target.firstChild)
                }
            })
        },
        before: function() {
            return this.domManip(arguments, function(elem) {
                this.parentNode && this.parentNode.insertBefore(elem, this)
            })
        },
        after: function() {
            return this.domManip(arguments, function(elem) {
                this.parentNode && this.parentNode.insertBefore(elem, this.nextSibling)
            })
        },
        remove: function(selector, keepData) {
            for (var elem, elems = selector ? jQuery.filter(selector, this) : this, i = 0; null != (elem = elems[i]); i++) keepData || 1 !== elem.nodeType || jQuery.cleanData(getAll(elem)), elem.parentNode && (keepData && jQuery.contains(elem.ownerDocument, elem) && setGlobalEval(getAll(elem, "script")), elem.parentNode.removeChild(elem));
            return this
        },
        empty: function() {
            for (var elem, i = 0; null != (elem = this[i]); i++) {
                for (1 === elem.nodeType && jQuery.cleanData(getAll(elem, !1)); elem.firstChild;) elem.removeChild(elem.firstChild);
                elem.options && jQuery.nodeName(elem, "select") && (elem.options.length = 0)
            }
            return this
        },
        clone: function(dataAndEvents, deepDataAndEvents) {
            return dataAndEvents = null == dataAndEvents ? !1 : dataAndEvents, deepDataAndEvents = null == deepDataAndEvents ? dataAndEvents : deepDataAndEvents, this.map(function() {
                return jQuery.clone(this, dataAndEvents, deepDataAndEvents)
            })
        },
        html: function(value) {
            return jQuery.access(this, function(value) {
                var elem = this[0] || {}, i = 0,
                    l = this.length;
                if (value === undefined) return 1 === elem.nodeType ? elem.innerHTML.replace(rinlinejQuery, "") : undefined;
                if (!("string" != typeof value || rnoInnerhtml.test(value) || !jQuery.support.htmlSerialize && rnoshimcache.test(value) || !jQuery.support.leadingWhitespace && rleadingWhitespace.test(value) || wrapMap[(rtagName.exec(value) || ["", ""])[1].toLowerCase()])) {
                    value = value.replace(rxhtmlTag, "<$1></$2>");
                    try {
                        for (; l > i; i++) elem = this[i] || {}, 1 === elem.nodeType && (jQuery.cleanData(getAll(elem, !1)), elem.innerHTML = value);
                        elem = 0
                    } catch (e) {}
                }
                elem && this.empty().append(value)
            }, null, value, arguments.length)
        },
        replaceWith: function() {
            var args = jQuery.map(this, function(elem) {
                return [elem.nextSibling, elem.parentNode]
            }),
                i = 0;
            return this.domManip(arguments, function(elem) {
                var next = args[i++],
                    parent = args[i++];
                parent && (next && next.parentNode !== parent && (next = this.nextSibling), jQuery(this).remove(), parent.insertBefore(elem, next))
            }, !0), i ? this : this.remove()
        },
        detach: function(selector) {
            return this.remove(selector, !0)
        },
        domManip: function(args, callback, allowIntersection) {
            args = core_concat.apply([], args);
            var first, node, hasScripts, scripts, doc, fragment, i = 0,
                l = this.length,
                set = this,
                iNoClone = l - 1,
                value = args[0],
                isFunction = jQuery.isFunction(value);
            if (isFunction || !(1 >= l || "string" != typeof value || jQuery.support.checkClone) && rchecked.test(value)) return this.each(function(index) {
                var self = set.eq(index);
                isFunction && (args[0] = value.call(this, index, self.html())), self.domManip(args, callback, allowIntersection)
            });
            if (l && (fragment = jQuery.buildFragment(args, this[0].ownerDocument, !1, !allowIntersection && this), first = fragment.firstChild, 1 === fragment.childNodes.length && (fragment = first), first)) {
                for (scripts = jQuery.map(getAll(fragment, "script"), disableScript), hasScripts = scripts.length; l > i; i++) node = fragment, i !== iNoClone && (node = jQuery.clone(node, !0, !0), hasScripts && jQuery.merge(scripts, getAll(node, "script"))), callback.call(this[i], node, i);
                if (hasScripts)
                    for (doc = scripts[scripts.length - 1].ownerDocument, jQuery.map(scripts, restoreScript), i = 0; hasScripts > i; i++) node = scripts[i], rscriptType.test(node.type || "") && !jQuery._data(node, "globalEval") && jQuery.contains(doc, node) && (node.src ? jQuery._evalUrl(node.src) : jQuery.globalEval((node.text || node.textContent || node.innerHTML || "").replace(rcleanScript, "")));
                fragment = first = null
            }
            return this
        }
    }), jQuery.each({
        appendTo: "append",
        prependTo: "prepend",
        insertBefore: "before",
        insertAfter: "after",
        replaceAll: "replaceWith"
    }, function(name, original) {
        jQuery.fn[name] = function(selector) {
            for (var elems, i = 0, ret = [], insert = jQuery(selector), last = insert.length - 1; last >= i; i++) elems = i === last ? this : this.clone(!0), jQuery(insert[i])[original](elems), core_push.apply(ret, elems.get());
            return this.pushStack(ret)
        }
    }), jQuery.extend({
        clone: function(elem, dataAndEvents, deepDataAndEvents) {
            var destElements, node, clone, i, srcElements, inPage = jQuery.contains(elem.ownerDocument, elem);
            if (jQuery.support.html5Clone || jQuery.isXMLDoc(elem) || !rnoshimcache.test("<" + elem.nodeName + ">") ? clone = elem.cloneNode(!0) : (fragmentDiv.innerHTML = elem.outerHTML, fragmentDiv.removeChild(clone = fragmentDiv.firstChild)), !(jQuery.support.noCloneEvent && jQuery.support.noCloneChecked || 1 !== elem.nodeType && 11 !== elem.nodeType || jQuery.isXMLDoc(elem)))
                for (destElements = getAll(clone), srcElements = getAll(elem), i = 0; null != (node = srcElements[i]); ++i) destElements[i] && fixCloneNodeIssues(node, destElements[i]);
            if (dataAndEvents)
                if (deepDataAndEvents)
                    for (srcElements = srcElements || getAll(elem), destElements = destElements || getAll(clone), i = 0; null != (node = srcElements[i]); i++) cloneCopyEvent(node, destElements[i]);
                else cloneCopyEvent(elem, clone);
            return destElements = getAll(clone, "script"), destElements.length > 0 && setGlobalEval(destElements, !inPage && getAll(elem, "script")), destElements = srcElements = node = null, clone
        },
        buildFragment: function(elems, context, scripts, selection) {
            for (var j, elem, contains, tmp, tag, tbody, wrap, l = elems.length, safe = createSafeFragment(context), nodes = [], i = 0; l > i; i++)
                if (elem = elems[i], elem || 0 === elem)
                    if ("object" === jQuery.type(elem)) jQuery.merge(nodes, elem.nodeType ? [elem] : elem);
                    else
            if (rhtml.test(elem)) {
                for (tmp = tmp || safe.appendChild(context.createElement("div")), tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase(), wrap = wrapMap[tag] || wrapMap._default, tmp.innerHTML = wrap[1] + elem.replace(rxhtmlTag, "<$1></$2>") + wrap[2], j = wrap[0]; j--;) tmp = tmp.lastChild;
                if (!jQuery.support.leadingWhitespace && rleadingWhitespace.test(elem) && nodes.push(context.createTextNode(rleadingWhitespace.exec(elem)[0])), !jQuery.support.tbody)
                    for (elem = "table" !== tag || rtbody.test(elem) ? "<table>" !== wrap[1] || rtbody.test(elem) ? 0 : tmp : tmp.firstChild, j = elem && elem.childNodes.length; j--;) jQuery.nodeName(tbody = elem.childNodes[j], "tbody") && !tbody.childNodes.length && elem.removeChild(tbody);
                for (jQuery.merge(nodes, tmp.childNodes), tmp.textContent = ""; tmp.firstChild;) tmp.removeChild(tmp.firstChild);
                tmp = safe.lastChild
            } else nodes.push(context.createTextNode(elem));
            for (tmp && safe.removeChild(tmp), jQuery.support.appendChecked || jQuery.grep(getAll(nodes, "input"), fixDefaultChecked), i = 0; elem = nodes[i++];)
                if ((!selection || -1 === jQuery.inArray(elem, selection)) && (contains = jQuery.contains(elem.ownerDocument, elem), tmp = getAll(safe.appendChild(elem), "script"), contains && setGlobalEval(tmp), scripts))
                    for (j = 0; elem = tmp[j++];) rscriptType.test(elem.type || "") && scripts.push(elem);
            return tmp = null, safe
        },
        cleanData: function(elems, acceptData) {
            for (var elem, type, id, data, i = 0, internalKey = jQuery.expando, cache = jQuery.cache, deleteExpando = jQuery.support.deleteExpando, special = jQuery.event.special; null != (elem = elems[i]); i++)
                if ((acceptData || jQuery.acceptData(elem)) && (id = elem[internalKey], data = id && cache[id])) {
                    if (data.events)
                        for (type in data.events) special[type] ? jQuery.event.remove(elem, type) : jQuery.removeEvent(elem, type, data.handle);
                    cache[id] && (delete cache[id], deleteExpando ? delete elem[internalKey] : typeof elem.removeAttribute !== core_strundefined ? elem.removeAttribute(internalKey) : elem[internalKey] = null, core_deletedIds.push(id))
                }
        },
        _evalUrl: function(url) {
            return jQuery.ajax({
                url: url,
                type: "GET",
                dataType: "script",
                async: !1,
                global: !1,
                "throws": !0
            })
        }
    }), jQuery.fn.extend({
        wrapAll: function(html) {
            if (jQuery.isFunction(html)) return this.each(function(i) {
                jQuery(this).wrapAll(html.call(this, i))
            });
            if (this[0]) {
                var wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(!0);
                this[0].parentNode && wrap.insertBefore(this[0]), wrap.map(function() {
                    for (var elem = this; elem.firstChild && 1 === elem.firstChild.nodeType;) elem = elem.firstChild;
                    return elem
                }).append(this)
            }
            return this
        },
        wrapInner: function(html) {
            return jQuery.isFunction(html) ? this.each(function(i) {
                jQuery(this).wrapInner(html.call(this, i))
            }) : this.each(function() {
                var self = jQuery(this),
                    contents = self.contents();
                contents.length ? contents.wrapAll(html) : self.append(html)
            })
        },
        wrap: function(html) {
            var isFunction = jQuery.isFunction(html);
            return this.each(function(i) {
                jQuery(this).wrapAll(isFunction ? html.call(this, i) : html)
            })
        },
        unwrap: function() {
            return this.parent().each(function() {
                jQuery.nodeName(this, "body") || jQuery(this).replaceWith(this.childNodes)
            }).end()
        }
    });
    var iframe, getStyles, curCSS, ralpha = /alpha\([^)]*\)/i,
        ropacity = /opacity\s*=\s*([^)]*)/,
        rposition = /^(top|right|bottom|left)$/,
        rdisplayswap = /^(none|table(?!-c[ea]).+)/,
        rmargin = /^margin/,
        rnumsplit = RegExp("^(" + core_pnum + ")(.*)$", "i"),
        rnumnonpx = RegExp("^(" + core_pnum + ")(?!px)[a-z%]+$", "i"),
        rrelNum = RegExp("^([+-])=(" + core_pnum + ")", "i"),
        elemdisplay = {
            BODY: "block"
        }, cssShow = {
            position: "absolute",
            visibility: "hidden",
            display: "block"
        }, cssNormalTransform = {
            letterSpacing: 0,
            fontWeight: 400
        }, cssExpand = ["Top", "Right", "Bottom", "Left"],
        cssPrefixes = ["Webkit", "O", "Moz", "ms"];
    jQuery.fn.extend({
        css: function(name, value) {
            return jQuery.access(this, function(elem, name, value) {
                var len, styles, map = {}, i = 0;
                if (jQuery.isArray(name)) {
                    for (styles = getStyles(elem), len = name.length; len > i; i++) map[name[i]] = jQuery.css(elem, name[i], !1, styles);
                    return map
                }
                return value !== undefined ? jQuery.style(elem, name, value) : jQuery.css(elem, name)
            }, name, value, arguments.length > 1)
        },
        show: function() {
            return showHide(this, !0)
        },
        hide: function() {
            return showHide(this)
        },
        toggle: function(state) {
            var bool = "boolean" == typeof state;
            return this.each(function() {
                (bool ? state : isHidden(this)) ? jQuery(this).show() : jQuery(this).hide()
            })
        }
    }), jQuery.extend({
        cssHooks: {
            opacity: {
                get: function(elem, computed) {
                    if (computed) {
                        var ret = curCSS(elem, "opacity");
                        return "" === ret ? "1" : ret
                    }
                }
            }
        },
        cssNumber: {
            columnCount: !0,
            fillOpacity: !0,
            fontWeight: !0,
            lineHeight: !0,
            opacity: !0,
            orphans: !0,
            widows: !0,
            zIndex: !0,
            zoom: !0
        },
        cssProps: {
            "float": jQuery.support.cssFloat ? "cssFloat" : "styleFloat"
        },
        style: function(elem, name, value, extra) {
            if (elem && 3 !== elem.nodeType && 8 !== elem.nodeType && elem.style) {
                var ret, type, hooks, origName = jQuery.camelCase(name),
                    style = elem.style;
                if (name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(style, origName)), hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName], value === undefined) return hooks && "get" in hooks && (ret = hooks.get(elem, !1, extra)) !== undefined ? ret : style[name];
                if (type = typeof value, "string" === type && (ret = rrelNum.exec(value)) && (value = (ret[1] + 1) * ret[2] + parseFloat(jQuery.css(elem, name)), type = "number"), !(null == value || "number" === type && isNaN(value) || ("number" !== type || jQuery.cssNumber[origName] || (value += "px"), jQuery.support.clearCloneStyle || "" !== value || 0 !== name.indexOf("background") || (style[name] = "inherit"), hooks && "set" in hooks && (value = hooks.set(elem, value, extra)) === undefined))) try {
                    style[name] = value
                } catch (e) {}
            }
        },
        css: function(elem, name, extra, styles) {
            var num, val, hooks, origName = jQuery.camelCase(name);
            return name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(elem.style, origName)), hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName], hooks && "get" in hooks && (val = hooks.get(elem, !0, extra)), val === undefined && (val = curCSS(elem, name, styles)), "normal" === val && name in cssNormalTransform && (val = cssNormalTransform[name]), "" === extra || extra ? (num = parseFloat(val), extra === !0 || jQuery.isNumeric(num) ? num || 0 : val) : val
        }
    }), window.getComputedStyle ? (getStyles = function(elem) {
        return window.getComputedStyle(elem, null)
    }, curCSS = function(elem, name, _computed) {
        var width, minWidth, maxWidth, computed = _computed || getStyles(elem),
            ret = computed ? computed.getPropertyValue(name) || computed[name] : undefined,
            style = elem.style;
        return computed && ("" !== ret || jQuery.contains(elem.ownerDocument, elem) || (ret = jQuery.style(elem, name)), rnumnonpx.test(ret) && rmargin.test(name) && (width = style.width, minWidth = style.minWidth, maxWidth = style.maxWidth, style.minWidth = style.maxWidth = style.width = ret, ret = computed.width, style.width = width, style.minWidth = minWidth, style.maxWidth = maxWidth)), ret
    }) : document.documentElement.currentStyle && (getStyles = function(elem) {
        return elem.currentStyle
    }, curCSS = function(elem, name, _computed) {
        var left, rs, rsLeft, computed = _computed || getStyles(elem),
            ret = computed ? computed[name] : undefined,
            style = elem.style;
        return null == ret && style && style[name] && (ret = style[name]), rnumnonpx.test(ret) && !rposition.test(name) && (left = style.left, rs = elem.runtimeStyle, rsLeft = rs && rs.left, rsLeft && (rs.left = elem.currentStyle.left), style.left = "fontSize" === name ? "1em" : ret, ret = style.pixelLeft + "px", style.left = left, rsLeft && (rs.left = rsLeft)), "" === ret ? "auto" : ret
    }), jQuery.each(["height", "width"], function(i, name) {
        jQuery.cssHooks[name] = {
            get: function(elem, computed, extra) {
                return computed ? 0 === elem.offsetWidth && rdisplayswap.test(jQuery.css(elem, "display")) ? jQuery.swap(elem, cssShow, function() {
                    return getWidthOrHeight(elem, name, extra)
                }) : getWidthOrHeight(elem, name, extra) : undefined
            },
            set: function(elem, value, extra) {
                var styles = extra && getStyles(elem);
                return setPositiveNumber(elem, value, extra ? augmentWidthOrHeight(elem, name, extra, jQuery.support.boxSizing && "border-box" === jQuery.css(elem, "boxSizing", !1, styles), styles) : 0)
            }
        }
    }), jQuery.support.opacity || (jQuery.cssHooks.opacity = {
        get: function(elem, computed) {
            return ropacity.test((computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "") ? .01 * parseFloat(RegExp.$1) + "" : computed ? "1" : ""
        },
        set: function(elem, value) {
            var style = elem.style,
                currentStyle = elem.currentStyle,
                opacity = jQuery.isNumeric(value) ? "alpha(opacity=" + 100 * value + ")" : "",
                filter = currentStyle && currentStyle.filter || style.filter || "";
            style.zoom = 1, (value >= 1 || "" === value) && "" === jQuery.trim(filter.replace(ralpha, "")) && style.removeAttribute && (style.removeAttribute("filter"), "" === value || currentStyle && !currentStyle.filter) || (style.filter = ralpha.test(filter) ? filter.replace(ralpha, opacity) : filter + " " + opacity)
        }
    }), jQuery(function() {
        jQuery.support.reliableMarginRight || (jQuery.cssHooks.marginRight = {
            get: function(elem, computed) {
                return computed ? jQuery.swap(elem, {
                    display: "inline-block"
                }, curCSS, [elem, "marginRight"]) : undefined
            }
        }), !jQuery.support.pixelPosition && jQuery.fn.position && jQuery.each(["top", "left"], function(i, prop) {
            jQuery.cssHooks[prop] = {
                get: function(elem, computed) {
                    return computed ? (computed = curCSS(elem, prop), rnumnonpx.test(computed) ? jQuery(elem).position()[prop] + "px" : computed) : undefined
                }
            }
        })
    }), jQuery.expr && jQuery.expr.filters && (jQuery.expr.filters.hidden = function(elem) {
        return 0 >= elem.offsetWidth && 0 >= elem.offsetHeight || !jQuery.support.reliableHiddenOffsets && "none" === (elem.style && elem.style.display || jQuery.css(elem, "display"))
    }, jQuery.expr.filters.visible = function(elem) {
        return !jQuery.expr.filters.hidden(elem)
    }), jQuery.each({
        margin: "",
        padding: "",
        border: "Width"
    }, function(prefix, suffix) {
        jQuery.cssHooks[prefix + suffix] = {
            expand: function(value) {
                for (var i = 0, expanded = {}, parts = "string" == typeof value ? value.split(" ") : [value]; 4 > i; i++) expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
                return expanded
            }
        }, rmargin.test(prefix) || (jQuery.cssHooks[prefix + suffix].set = setPositiveNumber)
    });
    var r20 = /%20/g,
        rbracket = /\[\]$/,
        rCRLF = /\r?\n/g,
        rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
        rsubmittable = /^(?:input|select|textarea|keygen)/i;
    jQuery.fn.extend({
        serialize: function() {
            return jQuery.param(this.serializeArray())
        },
        serializeArray: function() {
            return this.map(function() {
                var elements = jQuery.prop(this, "elements");
                return elements ? jQuery.makeArray(elements) : this
            }).filter(function() {
                var type = this.type;
                return this.name && !jQuery(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !manipulation_rcheckableType.test(type))
            }).map(function(i, elem) {
                var val = jQuery(this).val();
                return null == val ? null : jQuery.isArray(val) ? jQuery.map(val, function(val) {
                    return {
                        name: elem.name,
                        value: val.replace(rCRLF, "\r\n")
                    }
                }) : {
                    name: elem.name,
                    value: val.replace(rCRLF, "\r\n")
                }
            }).get()
        }
    }), jQuery.param = function(a, traditional) {
        var prefix, s = [],
            add = function(key, value) {
                value = jQuery.isFunction(value) ? value() : null == value ? "" : value, s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value)
            };
        if (traditional === undefined && (traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional), jQuery.isArray(a) || a.jquery && !jQuery.isPlainObject(a)) jQuery.each(a, function() {
            add(this.name, this.value)
        });
        else
            for (prefix in a) buildParams(prefix, a[prefix], traditional, add);
        return s.join("&").replace(r20, "+")
    }, jQuery.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "), function(i, name) {
        jQuery.fn[name] = function(data, fn) {
            return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name)
        }
    }), jQuery.fn.extend({
        hover: function(fnOver, fnOut) {
            return this.mouseenter(fnOver).mouseleave(fnOut || fnOver)
        },
        bind: function(types, data, fn) {
            return this.on(types, null, data, fn)
        },
        unbind: function(types, fn) {
            return this.off(types, null, fn)
        },
        delegate: function(selector, types, data, fn) {
            return this.on(types, selector, data, fn)
        },
        undelegate: function(selector, types, fn) {
            return 1 === arguments.length ? this.off(selector, "**") : this.off(types, selector || "**", fn)
        }
    });
    var ajaxLocParts, ajaxLocation, ajax_nonce = jQuery.now(),
        ajax_rquery = /\?/,
        rhash = /#.*$/,
        rts = /([?&])_=[^&]*/,
        rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/gm,
        rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
        rnoContent = /^(?:GET|HEAD)$/,
        rprotocol = /^\/\//,
        rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,
        _load = jQuery.fn.load,
        prefilters = {}, transports = {}, allTypes = "*/".concat("*");
    try {
        ajaxLocation = location.href
    } catch (e) {
        ajaxLocation = document.createElement("a"), ajaxLocation.href = "", ajaxLocation = ajaxLocation.href
    }
    ajaxLocParts = rurl.exec(ajaxLocation.toLowerCase()) || [], jQuery.fn.load = function(url, params, callback) {
        if ("string" != typeof url && _load) return _load.apply(this, arguments);
        var selector, response, type, self = this,
            off = url.indexOf(" ");
        return off >= 0 && (selector = url.slice(off, url.length), url = url.slice(0, off)), jQuery.isFunction(params) ? (callback = params, params = undefined) : params && "object" == typeof params && (type = "POST"), self.length > 0 && jQuery.ajax({
            url: url,
            type: type,
            dataType: "html",
            data: params
        }).done(function(responseText) {
            response = arguments, self.html(selector ? jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector) : responseText)
        }).complete(callback && function(jqXHR, status) {
            self.each(callback, response || [jqXHR.responseText, status, jqXHR])
        }), this
    }, jQuery.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function(i, type) {
        jQuery.fn[type] = function(fn) {
            return this.on(type, fn)
        }
    }), jQuery.extend({
        active: 0,
        lastModified: {},
        etag: {},
        ajaxSettings: {
            url: ajaxLocation,
            type: "GET",
            isLocal: rlocalProtocol.test(ajaxLocParts[1]),
            global: !0,
            processData: !0,
            async: !0,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            accepts: {
                "*": allTypes,
                text: "text/plain",
                html: "text/html",
                xml: "application/xml, text/xml",
                json: "application/json, text/javascript"
            },
            contents: {
                xml: /xml/,
                html: /html/,
                json: /json/
            },
            responseFields: {
                xml: "responseXML",
                text: "responseText",
                json: "responseJSON"
            },
            converters: {
                "* text": String,
                "text html": !0,
                "text json": jQuery.parseJSON,
                "text xml": jQuery.parseXML
            },
            flatOptions: {
                url: !0,
                context: !0
            }
        },
        ajaxSetup: function(target, settings) {
            return settings ? ajaxExtend(ajaxExtend(target, jQuery.ajaxSettings), settings) : ajaxExtend(jQuery.ajaxSettings, target)
        },
        ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
        ajaxTransport: addToPrefiltersOrTransports(transports),
        ajax: function(url, options) {
            function done(status, nativeStatusText, responses, headers) {
                var isSuccess, success, error, response, modified, statusText = nativeStatusText;
                2 !== state && (state = 2, timeoutTimer && clearTimeout(timeoutTimer), transport = undefined, responseHeadersString = headers || "", jqXHR.readyState = status > 0 ? 4 : 0, isSuccess = status >= 200 && 300 > status || 304 === status, responses && (response = ajaxHandleResponses(s, jqXHR, responses)), response = ajaxConvert(s, response, jqXHR, isSuccess), isSuccess ? (s.ifModified && (modified = jqXHR.getResponseHeader("Last-Modified"), modified && (jQuery.lastModified[cacheURL] = modified), modified = jqXHR.getResponseHeader("etag"), modified && (jQuery.etag[cacheURL] = modified)), 204 === status || "HEAD" === s.type ? statusText = "nocontent" : 304 === status ? statusText = "notmodified" : (statusText = response.state, success = response.data, error = response.error, isSuccess = !error)) : (error = statusText, (status || !statusText) && (statusText = "error", 0 > status && (status = 0))), jqXHR.status = status, jqXHR.statusText = (nativeStatusText || statusText) + "", isSuccess ? deferred.resolveWith(callbackContext, [success, statusText, jqXHR]) : deferred.rejectWith(callbackContext, [jqXHR, statusText, error]), jqXHR.statusCode(statusCode), statusCode = undefined, fireGlobals && globalEventContext.trigger(isSuccess ? "ajaxSuccess" : "ajaxError", [jqXHR, s, isSuccess ? success : error]), completeDeferred.fireWith(callbackContext, [jqXHR, statusText]), fireGlobals && (globalEventContext.trigger("ajaxComplete", [jqXHR, s]), --jQuery.active || jQuery.event.trigger("ajaxStop")))
            }
            "object" == typeof url && (options = url, url = undefined), options = options || {};
            var parts, i, cacheURL, responseHeadersString, timeoutTimer, fireGlobals, transport, responseHeaders, s = jQuery.ajaxSetup({}, options),
                callbackContext = s.context || s,
                globalEventContext = s.context && (callbackContext.nodeType || callbackContext.jquery) ? jQuery(callbackContext) : jQuery.event,
                deferred = jQuery.Deferred(),
                completeDeferred = jQuery.Callbacks("once memory"),
                statusCode = s.statusCode || {}, requestHeaders = {}, requestHeadersNames = {}, state = 0,
                strAbort = "canceled",
                jqXHR = {
                    readyState: 0,
                    getResponseHeader: function(key) {
                        var match;
                        if (2 === state) {
                            if (!responseHeaders)
                                for (responseHeaders = {}; match = rheaders.exec(responseHeadersString);) responseHeaders[match[1].toLowerCase()] = match[2];
                            match = responseHeaders[key.toLowerCase()]
                        }
                        return null == match ? null : match
                    },
                    getAllResponseHeaders: function() {
                        return 2 === state ? responseHeadersString : null
                    },
                    setRequestHeader: function(name, value) {
                        var lname = name.toLowerCase();
                        return state || (name = requestHeadersNames[lname] = requestHeadersNames[lname] || name, requestHeaders[name] = value), this
                    },
                    overrideMimeType: function(type) {
                        return state || (s.mimeType = type), this
                    },
                    statusCode: function(map) {
                        var code;
                        if (map)
                            if (2 > state)
                                for (code in map) statusCode[code] = [statusCode[code], map[code]];
                            else jqXHR.always(map[jqXHR.status]);
                        return this
                    },
                    abort: function(statusText) {
                        var finalText = statusText || strAbort;
                        return transport && transport.abort(finalText), done(0, finalText), this
                    }
                };
            if (deferred.promise(jqXHR).complete = completeDeferred.add, jqXHR.success = jqXHR.done, jqXHR.error = jqXHR.fail, s.url = ((url || s.url || ajaxLocation) + "").replace(rhash, "").replace(rprotocol, ajaxLocParts[1] + "//"), s.type = options.method || options.type || s.method || s.type, s.dataTypes = jQuery.trim(s.dataType || "*").toLowerCase().match(core_rnotwhite) || [""], null == s.crossDomain && (parts = rurl.exec(s.url.toLowerCase()), s.crossDomain = !(!parts || parts[1] === ajaxLocParts[1] && parts[2] === ajaxLocParts[2] && (parts[3] || ("http:" === parts[1] ? "80" : "443")) === (ajaxLocParts[3] || ("http:" === ajaxLocParts[1] ? "80" : "443")))), s.data && s.processData && "string" != typeof s.data && (s.data = jQuery.param(s.data, s.traditional)), inspectPrefiltersOrTransports(prefilters, s, options, jqXHR), 2 === state) return jqXHR;
            fireGlobals = s.global, fireGlobals && 0 === jQuery.active++ && jQuery.event.trigger("ajaxStart"), s.type = s.type.toUpperCase(), s.hasContent = !rnoContent.test(s.type), cacheURL = s.url, s.hasContent || (s.data && (cacheURL = s.url += (ajax_rquery.test(cacheURL) ? "&" : "?") + s.data, delete s.data), s.cache === !1 && (s.url = rts.test(cacheURL) ? cacheURL.replace(rts, "$1_=" + ajax_nonce++) : cacheURL + (ajax_rquery.test(cacheURL) ? "&" : "?") + "_=" + ajax_nonce++)), s.ifModified && (jQuery.lastModified[cacheURL] && jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[cacheURL]), jQuery.etag[cacheURL] && jqXHR.setRequestHeader("If-None-Match", jQuery.etag[cacheURL])), (s.data && s.hasContent && s.contentType !== !1 || options.contentType) && jqXHR.setRequestHeader("Content-Type", s.contentType), jqXHR.setRequestHeader("Accept", s.dataTypes[0] && s.accepts[s.dataTypes[0]] ? s.accepts[s.dataTypes[0]] + ("*" !== s.dataTypes[0] ? ", " + allTypes + "; q=0.01" : "") : s.accepts["*"]);
            for (i in s.headers) jqXHR.setRequestHeader(i, s.headers[i]);
            if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === !1 || 2 === state)) return jqXHR.abort();
            strAbort = "abort";
            for (i in {
                success: 1,
                error: 1,
                complete: 1
            }) jqXHR[i](s[i]);
            if (transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR)) {
                jqXHR.readyState = 1, fireGlobals && globalEventContext.trigger("ajaxSend", [jqXHR, s]), s.async && s.timeout > 0 && (timeoutTimer = setTimeout(function() {
                    jqXHR.abort("timeout")
                }, s.timeout));
                try {
                    state = 1, transport.send(requestHeaders, done)
                } catch (e) {
                    if (!(2 > state)) throw e;
                    done(-1, e)
                }
            } else done(-1, "No Transport");
            return jqXHR
        },
        getJSON: function(url, data, callback) {
            return jQuery.get(url, data, callback, "json")
        },
        getScript: function(url, callback) {
            return jQuery.get(url, undefined, callback, "script")
        }
    }), jQuery.each(["get", "post"], function(i, method) {
        jQuery[method] = function(url, data, callback, type) {
            return jQuery.isFunction(data) && (type = type || callback, callback = data, data = undefined), jQuery.ajax({
                url: url,
                type: method,
                dataType: type,
                data: data,
                success: callback
            })
        }
    }), jQuery.ajaxSetup({
        accepts: {
            script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
        },
        contents: {
            script: /(?:java|ecma)script/
        },
        converters: {
            "text script": function(text) {
                return jQuery.globalEval(text), text
            }
        }
    }), jQuery.ajaxPrefilter("script", function(s) {
        s.cache === undefined && (s.cache = !1), s.crossDomain && (s.type = "GET", s.global = !1)
    }), jQuery.ajaxTransport("script", function(s) {
        if (s.crossDomain) {
            var script, head = document.head || jQuery("head")[0] || document.documentElement;
            return {
                send: function(_, callback) {
                    script = document.createElement("script"), script.async = !0, s.scriptCharset && (script.charset = s.scriptCharset), script.src = s.url, script.onload = script.onreadystatechange = function(_, isAbort) {
                        (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) && (script.onload = script.onreadystatechange = null, script.parentNode && script.parentNode.removeChild(script), script = null, isAbort || callback(200, "success"))
                    }, head.insertBefore(script, head.firstChild)
                },
                abort: function() {
                    script && script.onload(undefined, !0)
                }
            }
        }
    });
    var oldCallbacks = [],
        rjsonp = /(=)\?(?=&|$)|\?\?/;
    jQuery.ajaxSetup({
        jsonp: "callback",
        jsonpCallback: function() {
            var callback = oldCallbacks.pop() || jQuery.expando + "_" + ajax_nonce++;
            return this[callback] = !0, callback
        }
    }), jQuery.ajaxPrefilter("json jsonp", function(s, originalSettings, jqXHR) {
        var callbackName, overwritten, responseContainer, jsonProp = s.jsonp !== !1 && (rjsonp.test(s.url) ? "url" : "string" == typeof s.data && !(s.contentType || "").indexOf("application/x-www-form-urlencoded") && rjsonp.test(s.data) && "data");
        return jsonProp || "jsonp" === s.dataTypes[0] ? (callbackName = s.jsonpCallback = jQuery.isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback, jsonProp ? s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName) : s.jsonp !== !1 && (s.url += (ajax_rquery.test(s.url) ? "&" : "?") + s.jsonp + "=" + callbackName), s.converters["script json"] = function() {
            return responseContainer || jQuery.error(callbackName + " was not called"), responseContainer[0]
        }, s.dataTypes[0] = "json", overwritten = window[callbackName], window[callbackName] = function() {
            responseContainer = arguments
        }, jqXHR.always(function() {
            window[callbackName] = overwritten, s[callbackName] && (s.jsonpCallback = originalSettings.jsonpCallback, oldCallbacks.push(callbackName)), responseContainer && jQuery.isFunction(overwritten) && overwritten(responseContainer[0]), responseContainer = overwritten = undefined
        }), "script") : undefined
    });
    var xhrCallbacks, xhrSupported, xhrId = 0,
        xhrOnUnloadAbort = window.ActiveXObject && function() {
            var key;
            for (key in xhrCallbacks) xhrCallbacks[key](undefined, !0)
        };
    jQuery.ajaxSettings.xhr = window.ActiveXObject ? function() {
        return !this.isLocal && createStandardXHR() || createActiveXHR()
    } : createStandardXHR, xhrSupported = jQuery.ajaxSettings.xhr(), jQuery.support.cors = !! xhrSupported && "withCredentials" in xhrSupported, xhrSupported = jQuery.support.ajax = !! xhrSupported, xhrSupported && jQuery.ajaxTransport(function(s) {
        if (!s.crossDomain || jQuery.support.cors) {
            var callback;
            return {
                send: function(headers, complete) {
                    var handle, i, xhr = s.xhr();
                    if (s.username ? xhr.open(s.type, s.url, s.async, s.username, s.password) : xhr.open(s.type, s.url, s.async), s.xhrFields)
                        for (i in s.xhrFields) xhr[i] = s.xhrFields[i];
                    s.mimeType && xhr.overrideMimeType && xhr.overrideMimeType(s.mimeType), s.crossDomain || headers["X-Requested-With"] || (headers["X-Requested-With"] = "XMLHttpRequest");
                    try {
                        for (i in headers) xhr.setRequestHeader(i, headers[i])
                    } catch (err) {}
                    xhr.send(s.hasContent && s.data || null), callback = function(_, isAbort) {
                        var status, responseHeaders, statusText, responses;
                        try {
                            if (callback && (isAbort || 4 === xhr.readyState))
                                if (callback = undefined, handle && (xhr.onreadystatechange = jQuery.noop, xhrOnUnloadAbort && delete xhrCallbacks[handle]), isAbort) 4 !== xhr.readyState && xhr.abort();
                                else {
                                    responses = {}, status = xhr.status, responseHeaders = xhr.getAllResponseHeaders(), "string" == typeof xhr.responseText && (responses.text = xhr.responseText);
                                    try {
                                        statusText = xhr.statusText
                                    } catch (e) {
                                        statusText = ""
                                    }
                                    status || !s.isLocal || s.crossDomain ? 1223 === status && (status = 204) : status = responses.text ? 200 : 404
                                }
                        } catch (firefoxAccessException) {
                            isAbort || complete(-1, firefoxAccessException)
                        }
                        responses && complete(status, statusText, responses, responseHeaders)
                    }, s.async ? 4 === xhr.readyState ? setTimeout(callback) : (handle = ++xhrId, xhrOnUnloadAbort && (xhrCallbacks || (xhrCallbacks = {}, jQuery(window).unload(xhrOnUnloadAbort)), xhrCallbacks[handle] = callback), xhr.onreadystatechange = callback) : callback()
                },
                abort: function() {
                    callback && callback(undefined, !0)
                }
            }
        }
    });
    var fxNow, timerId, rfxtypes = /^(?:toggle|show|hide)$/,
        rfxnum = RegExp("^(?:([+-])=|)(" + core_pnum + ")([a-z%]*)$", "i"),
        rrun = /queueHooks$/,
        animationPrefilters = [defaultPrefilter],
        tweeners = {
            "*": [
                function(prop, value) {
                    var tween = this.createTween(prop, value),
                        target = tween.cur(),
                        parts = rfxnum.exec(value),
                        unit = parts && parts[3] || (jQuery.cssNumber[prop] ? "" : "px"),
                        start = (jQuery.cssNumber[prop] || "px" !== unit && +target) && rfxnum.exec(jQuery.css(tween.elem, prop)),
                        scale = 1,
                        maxIterations = 20;
                    if (start && start[3] !== unit) {
                        unit = unit || start[3], parts = parts || [], start = +target || 1;
                        do scale = scale || ".5", start /= scale, jQuery.style(tween.elem, prop, start + unit); while (scale !== (scale = tween.cur() / target) && 1 !== scale && --maxIterations)
                    }
                    return parts && (start = tween.start = +start || +target || 0, tween.unit = unit, tween.end = parts[1] ? start + (parts[1] + 1) * parts[2] : +parts[2]), tween
                }
            ]
        };
    jQuery.Animation = jQuery.extend(Animation, {
        tweener: function(props, callback) {
            jQuery.isFunction(props) ? (callback = props, props = ["*"]) : props = props.split(" ");
            for (var prop, index = 0, length = props.length; length > index; index++) prop = props[index], tweeners[prop] = tweeners[prop] || [], tweeners[prop].unshift(callback)
        },
        prefilter: function(callback, prepend) {
            prepend ? animationPrefilters.unshift(callback) : animationPrefilters.push(callback)
        }
    }), jQuery.Tween = Tween, Tween.prototype = {
        constructor: Tween,
        init: function(elem, options, prop, end, easing, unit) {
            this.elem = elem, this.prop = prop, this.easing = easing || "swing", this.options = options, this.start = this.now = this.cur(), this.end = end, this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px")
        },
        cur: function() {
            var hooks = Tween.propHooks[this.prop];
            return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this)
        },
        run: function(percent) {
            var eased, hooks = Tween.propHooks[this.prop];
            return this.pos = eased = this.options.duration ? jQuery.easing[this.easing](percent, this.options.duration * percent, 0, 1, this.options.duration) : percent, this.now = (this.end - this.start) * eased + this.start, this.options.step && this.options.step.call(this.elem, this.now, this), hooks && hooks.set ? hooks.set(this) : Tween.propHooks._default.set(this), this
        }
    }, Tween.prototype.init.prototype = Tween.prototype, Tween.propHooks = {
        _default: {
            get: function(tween) {
                var result;
                return null == tween.elem[tween.prop] || tween.elem.style && null != tween.elem.style[tween.prop] ? (result = jQuery.css(tween.elem, tween.prop, ""), result && "auto" !== result ? result : 0) : tween.elem[tween.prop]
            },
            set: function(tween) {
                jQuery.fx.step[tween.prop] ? jQuery.fx.step[tween.prop](tween) : tween.elem.style && (null != tween.elem.style[jQuery.cssProps[tween.prop]] || jQuery.cssHooks[tween.prop]) ? jQuery.style(tween.elem, tween.prop, tween.now + tween.unit) : tween.elem[tween.prop] = tween.now
            }
        }
    }, Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
        set: function(tween) {
            tween.elem.nodeType && tween.elem.parentNode && (tween.elem[tween.prop] = tween.now)
        }
    }, jQuery.each(["toggle", "show", "hide"], function(i, name) {
        var cssFn = jQuery.fn[name];
        jQuery.fn[name] = function(speed, easing, callback) {
            return null == speed || "boolean" == typeof speed ? cssFn.apply(this, arguments) : this.animate(genFx(name, !0), speed, easing, callback)
        }
    }), jQuery.fn.extend({
        fadeTo: function(speed, to, easing, callback) {
            return this.filter(isHidden).css("opacity", 0).show().end().animate({
                opacity: to
            }, speed, easing, callback)
        },
        animate: function(prop, speed, easing, callback) {
            var empty = jQuery.isEmptyObject(prop),
                optall = jQuery.speed(speed, easing, callback),
                doAnimation = function() {
                    var anim = Animation(this, jQuery.extend({}, prop), optall);
                    (empty || jQuery._data(this, "finish")) && anim.stop(!0)
                };
            return doAnimation.finish = doAnimation, empty || optall.queue === !1 ? this.each(doAnimation) : this.queue(optall.queue, doAnimation)
        },
        stop: function(type, clearQueue, gotoEnd) {
            var stopQueue = function(hooks) {
                var stop = hooks.stop;
                delete hooks.stop, stop(gotoEnd)
            };
            return "string" != typeof type && (gotoEnd = clearQueue, clearQueue = type, type = undefined), clearQueue && type !== !1 && this.queue(type || "fx", []), this.each(function() {
                var dequeue = !0,
                    index = null != type && type + "queueHooks",
                    timers = jQuery.timers,
                    data = jQuery._data(this);
                if (index) data[index] && data[index].stop && stopQueue(data[index]);
                else
                    for (index in data) data[index] && data[index].stop && rrun.test(index) && stopQueue(data[index]);
                for (index = timers.length; index--;) timers[index].elem !== this || null != type && timers[index].queue !== type || (timers[index].anim.stop(gotoEnd), dequeue = !1, timers.splice(index, 1));
                (dequeue || !gotoEnd) && jQuery.dequeue(this, type)
            })
        },
        finish: function(type) {
            return type !== !1 && (type = type || "fx"), this.each(function() {
                var index, data = jQuery._data(this),
                    queue = data[type + "queue"],
                    hooks = data[type + "queueHooks"],
                    timers = jQuery.timers,
                    length = queue ? queue.length : 0;
                for (data.finish = !0, jQuery.queue(this, type, []), hooks && hooks.stop && hooks.stop.call(this, !0), index = timers.length; index--;) timers[index].elem === this && timers[index].queue === type && (timers[index].anim.stop(!0), timers.splice(index, 1));
                for (index = 0; length > index; index++) queue[index] && queue[index].finish && queue[index].finish.call(this);
                delete data.finish
            })
        }
    }), jQuery.each({
        slideDown: genFx("show"),
        slideUp: genFx("hide"),
        slideToggle: genFx("toggle"),
        fadeIn: {
            opacity: "show"
        },
        fadeOut: {
            opacity: "hide"
        },
        fadeToggle: {
            opacity: "toggle"
        }
    }, function(name, props) {
        jQuery.fn[name] = function(speed, easing, callback) {
            return this.animate(props, speed, easing, callback)
        }
    }), jQuery.speed = function(speed, easing, fn) {
        var opt = speed && "object" == typeof speed ? jQuery.extend({}, speed) : {
            complete: fn || !fn && easing || jQuery.isFunction(speed) && speed,
            duration: speed,
            easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
        };
        return opt.duration = jQuery.fx.off ? 0 : "number" == typeof opt.duration ? opt.duration : opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[opt.duration] : jQuery.fx.speeds._default, (null == opt.queue || opt.queue === !0) && (opt.queue = "fx"), opt.old = opt.complete, opt.complete = function() {
            jQuery.isFunction(opt.old) && opt.old.call(this), opt.queue && jQuery.dequeue(this, opt.queue)
        }, opt
    }, jQuery.easing = {
        linear: function(p) {
            return p
        },
        swing: function(p) {
            return .5 - Math.cos(p * Math.PI) / 2
        }
    }, jQuery.timers = [], jQuery.fx = Tween.prototype.init, jQuery.fx.tick = function() {
        var timer, timers = jQuery.timers,
            i = 0;
        for (fxNow = jQuery.now(); timers.length > i; i++) timer = timers[i], timer() || timers[i] !== timer || timers.splice(i--, 1);
        timers.length || jQuery.fx.stop(), fxNow = undefined
    }, jQuery.fx.timer = function(timer) {
        timer() && jQuery.timers.push(timer) && jQuery.fx.start()
    }, jQuery.fx.interval = 13, jQuery.fx.start = function() {
        timerId || (timerId = setInterval(jQuery.fx.tick, jQuery.fx.interval))
    }, jQuery.fx.stop = function() {
        clearInterval(timerId), timerId = null
    }, jQuery.fx.speeds = {
        slow: 600,
        fast: 200,
        _default: 400
    }, jQuery.fx.step = {}, jQuery.expr && jQuery.expr.filters && (jQuery.expr.filters.animated = function(elem) {
        return jQuery.grep(jQuery.timers, function(fn) {
            return elem === fn.elem
        }).length
    }), jQuery.fn.offset = function(options) {
        if (arguments.length) return options === undefined ? this : this.each(function(i) {
            jQuery.offset.setOffset(this, options, i)
        });
        var docElem, win, box = {
                top: 0,
                left: 0
            }, elem = this[0],
            doc = elem && elem.ownerDocument;
        if (doc) return docElem = doc.documentElement, jQuery.contains(docElem, elem) ? (typeof elem.getBoundingClientRect !== core_strundefined && (box = elem.getBoundingClientRect()), win = getWindow(doc), {
            top: box.top + (win.pageYOffset || docElem.scrollTop) - (docElem.clientTop || 0),
            left: box.left + (win.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0)
        }) : box
    }, jQuery.offset = {
        setOffset: function(elem, options, i) {
            var position = jQuery.css(elem, "position");
            "static" === position && (elem.style.position = "relative");
            var curTop, curLeft, curElem = jQuery(elem),
                curOffset = curElem.offset(),
                curCSSTop = jQuery.css(elem, "top"),
                curCSSLeft = jQuery.css(elem, "left"),
                calculatePosition = ("absolute" === position || "fixed" === position) && jQuery.inArray("auto", [curCSSTop, curCSSLeft]) > -1,
                props = {}, curPosition = {};
            calculatePosition ? (curPosition = curElem.position(), curTop = curPosition.top, curLeft = curPosition.left) : (curTop = parseFloat(curCSSTop) || 0, curLeft = parseFloat(curCSSLeft) || 0), jQuery.isFunction(options) && (options = options.call(elem, i, curOffset)), null != options.top && (props.top = options.top - curOffset.top + curTop), null != options.left && (props.left = options.left - curOffset.left + curLeft), "using" in options ? options.using.call(elem, props) : curElem.css(props)
        }
    }, jQuery.fn.extend({
        position: function() {
            if (this[0]) {
                var offsetParent, offset, parentOffset = {
                        top: 0,
                        left: 0
                    }, elem = this[0];
                return "fixed" === jQuery.css(elem, "position") ? offset = elem.getBoundingClientRect() : (offsetParent = this.offsetParent(), offset = this.offset(), jQuery.nodeName(offsetParent[0], "html") || (parentOffset = offsetParent.offset()), parentOffset.top += jQuery.css(offsetParent[0], "borderTopWidth", !0), parentOffset.left += jQuery.css(offsetParent[0], "borderLeftWidth", !0)), {
                    top: offset.top - parentOffset.top - jQuery.css(elem, "marginTop", !0),
                    left: offset.left - parentOffset.left - jQuery.css(elem, "marginLeft", !0)
                }
            }
        },
        offsetParent: function() {
            return this.map(function() {
                for (var offsetParent = this.offsetParent || docElem; offsetParent && !jQuery.nodeName(offsetParent, "html") && "static" === jQuery.css(offsetParent, "position");) offsetParent = offsetParent.offsetParent;
                return offsetParent || docElem
            })
        }
    }), jQuery.each({
        scrollLeft: "pageXOffset",
        scrollTop: "pageYOffset"
    }, function(method, prop) {
        var top = /Y/.test(prop);
        jQuery.fn[method] = function(val) {
            return jQuery.access(this, function(elem, method, val) {
                var win = getWindow(elem);
                return val === undefined ? win ? prop in win ? win[prop] : win.document.documentElement[method] : elem[method] : (win ? win.scrollTo(top ? jQuery(win).scrollLeft() : val, top ? val : jQuery(win).scrollTop()) : elem[method] = val, undefined)
            }, method, val, arguments.length, null)
        }
    }), jQuery.each({
        Height: "height",
        Width: "width"
    }, function(name, type) {
        jQuery.each({
            padding: "inner" + name,
            content: type,
            "": "outer" + name
        }, function(defaultExtra, funcName) {
            jQuery.fn[funcName] = function(margin, value) {
                var chainable = arguments.length && (defaultExtra || "boolean" != typeof margin),
                    extra = defaultExtra || (margin === !0 || value === !0 ? "margin" : "border");
                return jQuery.access(this, function(elem, type, value) {
                    var doc;
                    return jQuery.isWindow(elem) ? elem.document.documentElement["client" + name] : 9 === elem.nodeType ? (doc = elem.documentElement, Math.max(elem.body["scroll" + name], doc["scroll" + name], elem.body["offset" + name], doc["offset" + name], doc["client" + name])) : value === undefined ? jQuery.css(elem, type, extra) : jQuery.style(elem, type, value, extra)
                }, type, chainable ? margin : undefined, chainable, null)
            }
        })
    }), jQuery.fn.size = function() {
        return this.length
    }, jQuery.fn.andSelf = jQuery.fn.addBack, "object" == typeof module && module && "object" == typeof module.exports ? module.exports = jQuery : (window.jQuery = window.$ = jQuery, "function" == typeof define && define.amd && define("jquery", [], function() {
        return jQuery
    }))
}(window), define("jquery-src", [], function() {}), define("jquery", ["jquery-src"], function() {
    function needFastClick() {
        var ua = navigator.userAgent;
        return /Chrome\/[0-9]+/i.test(ua) && /Windows NT/i.test(ua) ? !1 : !0
    }

    function returnFalse() {
        return !1
    }
    return "ontouchstart" in window ? (require("mod/touch", function() {}), needFastClick() ? (jQuery.fn.extend({
        on: function(types, selector, data, fn, one) {
            var origFn, type;
            if ("object" == typeof types) {
                "string" != typeof selector && (data = data || selector, selector = void 0);
                for (type in types) this.on(type, selector, data, types[type], one);
                return this
            }
            if (null == data && null == fn ? (fn = selector, data = selector = void 0) : null == fn && ("string" == typeof selector ? (fn = data, data = void 0) : (fn = data, data = selector, selector = void 0)), fn === !1) fn = returnFalse;
            else if (!fn) return this;
            return 1 === one && (origFn = fn, fn = function(event) {
                return jQuery().off(event), origFn.apply(this, arguments)
            }, fn.guid = origFn.guid || (origFn.guid = jQuery.guid++)), this.each(function() {
                types = /click/g.test(types) && !/preventDefault/g.test(fn) && selector ? types.replace("click", "tap") : types, jQuery.event.add(this, types, fn, data, selector)
            })
        }
    }), jQuery) : jQuery) : jQuery
}), define("mod/ajax", ["jquery", "mod/cookie"], function($, cookie) {
    function ajax() {
        var args = arguments,
            options = args[args.length - 1] || {};
        if (options.arkWithDocReferer && cookie("prev_referer", document.referrer, {
            path: "/",
            "max-age": 2
        }), options.type && "GET" !== options.type.toUpperCase() && (options.data = $.extend({}, options.data, {
            ck: cookie("ck")
        })), cookie("profile")) {
            var userFilter = null;
            $.each(options, function(key, val) {
                "dataFilter" === key && (userFilter = val, delete args[key])
            }), options = $.extend(options, {
                dataFilter: function(data) {
                    try {
                        data = $.parseJSON(data)
                    } catch (e) {
                        data = data
                    }
                    return require("widget/profile", function(profile) {
                        profile = profile || Ark.profile, profile.add({
                            time: data.pt,
                            uri: data.uri,
                            type: options.type,
                            stdout: data.profile
                        })
                    }), null === userFilter ? data.rawData : userFilter(data.rawData)
                }
            })
        }
        return $.ajax.apply($, args)
    }
    return ajax.post = function(url, data, callback, dataType) {
        return $.isFunction(data) && (dataType = dataType || callback, callback = data, data = void 0), ajax(url, {
            type: "POST",
            data: data,
            success: callback,
            dataType: dataType || "json"
        })
    }, ajax.get = function(url, callback, dataType) {
        return ajax(url, {
            type: "GET",
            success: callback,
            dataType: dataType || "json"
        })
    }, ajax.methodMap = {
        read: "GET",
        create: "POST",
        update: "PUT",
        patch: "PATCH",
        "delete": "DELETE"
    }, ajax.request = function(method, url, data, options, dataType) {
        return $.isFunction(data) && (dataType = options, options = data, data = {}), ajax(url, $.extend({
            type: method,
            data: data,
            dataType: dataType || "text"
        }, options))
    }, ajax
}),
function() {
    var root = this,
        previousUnderscore = root._,
        breaker = {}, ArrayProto = Array.prototype,
        ObjProto = Object.prototype,
        FuncProto = Function.prototype,
        push = ArrayProto.push,
        slice = ArrayProto.slice,
        concat = ArrayProto.concat,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty,
        nativeForEach = ArrayProto.forEach,
        nativeMap = ArrayProto.map,
        nativeReduce = ArrayProto.reduce,
        nativeReduceRight = ArrayProto.reduceRight,
        nativeFilter = ArrayProto.filter,
        nativeEvery = ArrayProto.every,
        nativeSome = ArrayProto.some,
        nativeIndexOf = ArrayProto.indexOf,
        nativeLastIndexOf = ArrayProto.lastIndexOf,
        nativeIsArray = Array.isArray,
        nativeKeys = Object.keys,
        nativeBind = FuncProto.bind,
        _ = function(obj) {
            return obj instanceof _ ? obj : this instanceof _ ? (this._wrapped = obj, void 0) : new _(obj)
        };
    "undefined" != typeof exports ? ("undefined" != typeof module && module.exports && (exports = module.exports = _), exports._ = _) : root._ = _, _.VERSION = "1.4.4";
    var each = _.each = _.forEach = function(obj, iterator, context) {
        if (null != obj)
            if (nativeForEach && obj.forEach === nativeForEach) obj.forEach(iterator, context);
            else
        if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; l > i; i++)
                if (iterator.call(context, obj[i], i, obj) === breaker) return
        } else
            for (var key in obj)
                if (_.has(obj, key) && iterator.call(context, obj[key], key, obj) === breaker) return
    };
    _.map = _.collect = function(obj, iterator, context) {
        var results = [];
        return null == obj ? results : nativeMap && obj.map === nativeMap ? obj.map(iterator, context) : (each(obj, function(value, index, list) {
            results.push(iterator.call(context, value, index, list))
        }), results)
    };
    var reduceError = "Reduce of empty array with no initial value";
    _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
        var initial = arguments.length > 2;
        if (null == obj && (obj = []), nativeReduce && obj.reduce === nativeReduce) return context && (iterator = _.bind(iterator, context)), initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
        if (each(obj, function(value, index, list) {
            initial ? memo = iterator.call(context, memo, value, index, list) : (memo = value, initial = !0)
        }), !initial) throw new TypeError(reduceError);
        return memo
    }, _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
        var initial = arguments.length > 2;
        if (null == obj && (obj = []), nativeReduceRight && obj.reduceRight === nativeReduceRight) return context && (iterator = _.bind(iterator, context)), initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
        var length = obj.length;
        if (length !== +length) {
            var keys = _.keys(obj);
            length = keys.length
        }
        if (each(obj, function(value, index, list) {
            index = keys ? keys[--length] : --length, initial ? memo = iterator.call(context, memo, obj[index], index, list) : (memo = obj[index], initial = !0)
        }), !initial) throw new TypeError(reduceError);
        return memo
    }, _.find = _.detect = function(obj, iterator, context) {
        var result;
        return any(obj, function(value, index, list) {
            return iterator.call(context, value, index, list) ? (result = value, !0) : void 0
        }), result
    }, _.filter = _.select = function(obj, iterator, context) {
        var results = [];
        return null == obj ? results : nativeFilter && obj.filter === nativeFilter ? obj.filter(iterator, context) : (each(obj, function(value, index, list) {
            iterator.call(context, value, index, list) && results.push(value)
        }), results)
    }, _.reject = function(obj, iterator, context) {
        return _.filter(obj, function(value, index, list) {
            return !iterator.call(context, value, index, list)
        }, context)
    }, _.every = _.all = function(obj, iterator, context) {
        iterator || (iterator = _.identity);
        var result = !0;
        return null == obj ? result : nativeEvery && obj.every === nativeEvery ? obj.every(iterator, context) : (each(obj, function(value, index, list) {
            return (result = result && iterator.call(context, value, index, list)) ? void 0 : breaker
        }), !! result)
    };
    var any = _.some = _.any = function(obj, iterator, context) {
        iterator || (iterator = _.identity);
        var result = !1;
        return null == obj ? result : nativeSome && obj.some === nativeSome ? obj.some(iterator, context) : (each(obj, function(value, index, list) {
            return result || (result = iterator.call(context, value, index, list)) ? breaker : void 0
        }), !! result)
    };
    _.contains = _.include = function(obj, target) {
        return null == obj ? !1 : nativeIndexOf && obj.indexOf === nativeIndexOf ? -1 != obj.indexOf(target) : any(obj, function(value) {
            return value === target
        })
    }, _.invoke = function(obj, method) {
        var args = slice.call(arguments, 2),
            isFunc = _.isFunction(method);
        return _.map(obj, function(value) {
            return (isFunc ? method : value[method]).apply(value, args)
        })
    }, _.pluck = function(obj, key) {
        return _.map(obj, function(value) {
            return value[key]
        })
    }, _.where = function(obj, attrs, first) {
        return _.isEmpty(attrs) ? first ? void 0 : [] : _[first ? "find" : "filter"](obj, function(value) {
            for (var key in attrs)
                if (attrs[key] !== value[key]) return !1;
            return !0
        })
    }, _.findWhere = function(obj, attrs) {
        return _.where(obj, attrs, !0)
    }, _.max = function(obj, iterator, context) {
        if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && 65535 > obj.length) return Math.max.apply(Math, obj);
        if (!iterator && _.isEmpty(obj)) return -1 / 0;
        var result = {
            computed: -1 / 0,
            value: -1 / 0
        };
        return each(obj, function(value, index, list) {
            var computed = iterator ? iterator.call(context, value, index, list) : value;
            computed >= result.computed && (result = {
                value: value,
                computed: computed
            })
        }), result.value
    }, _.min = function(obj, iterator, context) {
        if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && 65535 > obj.length) return Math.min.apply(Math, obj);
        if (!iterator && _.isEmpty(obj)) return 1 / 0;
        var result = {
            computed: 1 / 0,
            value: 1 / 0
        };
        return each(obj, function(value, index, list) {
            var computed = iterator ? iterator.call(context, value, index, list) : value;
            result.computed > computed && (result = {
                value: value,
                computed: computed
            })
        }), result.value
    }, _.shuffle = function(obj) {
        var rand, index = 0,
            shuffled = [];
        return each(obj, function(value) {
            rand = _.random(index++), shuffled[index - 1] = shuffled[rand], shuffled[rand] = value
        }), shuffled
    };
    var lookupIterator = function(value) {
        return _.isFunction(value) ? value : function(obj) {
            return obj[value]
        }
    };
    _.sortBy = function(obj, value, context) {
        var iterator = lookupIterator(value);
        return _.pluck(_.map(obj, function(value, index, list) {
            return {
                value: value,
                index: index,
                criteria: iterator.call(context, value, index, list)
            }
        }).sort(function(left, right) {
            var a = left.criteria,
                b = right.criteria;
            if (a !== b) {
                if (a > b || void 0 === a) return 1;
                if (b > a || void 0 === b) return -1
            }
            return left.index < right.index ? -1 : 1
        }), "value")
    };
    var group = function(obj, value, context, behavior) {
        var result = {}, iterator = lookupIterator(null == value ? _.identity : value);
        return each(obj, function(value, index) {
            var key = iterator.call(context, value, index, obj);
            behavior(result, key, value)
        }), result
    };
    _.groupBy = function(obj, value, context) {
        return group(obj, value, context, function(result, key, value) {
            (_.has(result, key) ? result[key] : result[key] = []).push(value)
        })
    }, _.countBy = function(obj, value, context) {
        return group(obj, value, context, function(result, key) {
            _.has(result, key) || (result[key] = 0), result[key]++
        })
    }, _.sortedIndex = function(array, obj, iterator, context) {
        iterator = null == iterator ? _.identity : lookupIterator(iterator);
        for (var value = iterator.call(context, obj), low = 0, high = array.length; high > low;) {
            var mid = low + high >>> 1;
            value > iterator.call(context, array[mid]) ? low = mid + 1 : high = mid
        }
        return low
    }, _.toArray = function(obj) {
        return obj ? _.isArray(obj) ? slice.call(obj) : obj.length === +obj.length ? _.map(obj, _.identity) : _.values(obj) : []
    }, _.size = function(obj) {
        return null == obj ? 0 : obj.length === +obj.length ? obj.length : _.keys(obj).length
    }, _.first = _.head = _.take = function(array, n, guard) {
        return null == array ? void 0 : null == n || guard ? array[0] : slice.call(array, 0, n)
    }, _.initial = function(array, n, guard) {
        return slice.call(array, 0, array.length - (null == n || guard ? 1 : n))
    }, _.last = function(array, n, guard) {
        return null == array ? void 0 : null == n || guard ? array[array.length - 1] : slice.call(array, Math.max(array.length - n, 0))
    }, _.rest = _.tail = _.drop = function(array, n, guard) {
        return slice.call(array, null == n || guard ? 1 : n)
    }, _.compact = function(array) {
        return _.filter(array, _.identity)
    };
    var flatten = function(input, shallow, output) {
        return each(input, function(value) {
            _.isArray(value) ? shallow ? push.apply(output, value) : flatten(value, shallow, output) : output.push(value)
        }), output
    };
    _.flatten = function(array, shallow) {
        return flatten(array, shallow, [])
    }, _.without = function(array) {
        return _.difference(array, slice.call(arguments, 1))
    }, _.uniq = _.unique = function(array, isSorted, iterator, context) {
        _.isFunction(isSorted) && (context = iterator, iterator = isSorted, isSorted = !1);
        var initial = iterator ? _.map(array, iterator, context) : array,
            results = [],
            seen = [];
        return each(initial, function(value, index) {
            (isSorted ? index && seen[seen.length - 1] === value : _.contains(seen, value)) || (seen.push(value), results.push(array[index]))
        }), results
    }, _.union = function() {
        return _.uniq(concat.apply(ArrayProto, arguments))
    }, _.intersection = function(array) {
        var rest = slice.call(arguments, 1);
        return _.filter(_.uniq(array), function(item) {
            return _.every(rest, function(other) {
                return _.indexOf(other, item) >= 0
            })
        })
    }, _.difference = function(array) {
        var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
        return _.filter(array, function(value) {
            return !_.contains(rest, value)
        })
    }, _.zip = function() {
        for (var args = slice.call(arguments), length = _.max(_.pluck(args, "length")), results = Array(length), i = 0; length > i; i++) results[i] = _.pluck(args, "" + i);
        return results
    }, _.object = function(list, values) {
        if (null == list) return {};
        for (var result = {}, i = 0, l = list.length; l > i; i++) values ? result[list[i]] = values[i] : result[list[i][0]] = list[i][1];
        return result
    }, _.indexOf = function(array, item, isSorted) {
        if (null == array) return -1;
        var i = 0,
            l = array.length;
        if (isSorted) {
            if ("number" != typeof isSorted) return i = _.sortedIndex(array, item), array[i] === item ? i : -1;
            i = 0 > isSorted ? Math.max(0, l + isSorted) : isSorted
        }
        if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
        for (; l > i; i++)
            if (array[i] === item) return i;
        return -1
    }, _.lastIndexOf = function(array, item, from) {
        if (null == array) return -1;
        var hasIndex = null != from;
        if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
        for (var i = hasIndex ? from : array.length; i--;)
            if (array[i] === item) return i;
        return -1
    }, _.range = function(start, stop, step) {
        1 >= arguments.length && (stop = start || 0, start = 0), step = arguments[2] || 1;
        for (var len = Math.max(Math.ceil((stop - start) / step), 0), idx = 0, range = Array(len); len > idx;) range[idx++] = start, start += step;
        return range
    };
    var ctor = function() {};
    _.bind = function(func, context) {
        var args, bound;
        if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
        if (!_.isFunction(func)) throw new TypeError;
        return args = slice.call(arguments, 2), bound = function() {
            if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
            ctor.prototype = func.prototype;
            var self = new ctor;
            ctor.prototype = null;
            var result = func.apply(self, args.concat(slice.call(arguments)));
            return Object(result) === result ? result : self
        }
    }, _.partial = function(func) {
        var args = slice.call(arguments, 1);
        return function() {
            return func.apply(this, args.concat(slice.call(arguments)))
        }
    }, _.bindAll = function(obj) {
        var funcs = slice.call(arguments, 1);
        if (0 === funcs.length) throw Error("bindAll must be passed function names");
        return each(funcs, function(f) {
            obj[f] = _.bind(obj[f], obj)
        }), obj
    }, _.memoize = function(func, hasher) {
        var memo = {};
        return hasher || (hasher = _.identity),
        function() {
            var key = hasher.apply(this, arguments);
            return _.has(memo, key) ? memo[key] : memo[key] = func.apply(this, arguments)
        }
    }, _.delay = function(func, wait) {
        var args = slice.call(arguments, 2);
        return setTimeout(function() {
            return func.apply(null, args)
        }, wait)
    }, _.defer = function(func) {
        return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)))
    }, _.throttle = function(func, wait, immediate) {
        var context, args, timeout, result, previous = 0,
            later = function() {
                previous = new Date, timeout = null, result = func.apply(context, args)
            };
        return function() {
            var now = new Date;
            previous || immediate !== !1 || (previous = now);
            var remaining = wait - (now - previous);
            return context = this, args = arguments, 0 >= remaining ? (clearTimeout(timeout), timeout = null, previous = now, result = func.apply(context, args)) : timeout || (timeout = setTimeout(later, remaining)), result
        }
    }, _.debounce = function(func, wait, immediate) {
        var timeout, result;
        return function() {
            var context = this,
                args = arguments,
                later = function() {
                    timeout = null, immediate || (result = func.apply(context, args))
                }, callNow = immediate && !timeout;
            return clearTimeout(timeout), timeout = setTimeout(later, wait), callNow && (result = func.apply(context, args)), result
        }
    }, _.once = function(func) {
        var memo, ran = !1;
        return function() {
            return ran ? memo : (ran = !0, memo = func.apply(this, arguments), func = null, memo)
        }
    }, _.wrap = function(func, wrapper) {
        return function() {
            var args = [func];
            return push.apply(args, arguments), wrapper.apply(this, args)
        }
    }, _.compose = function() {
        var funcs = arguments;
        return function() {
            for (var args = arguments, i = funcs.length - 1; i >= 0; i--) args = [funcs[i].apply(this, args)];
            return args[0]
        }
    }, _.after = function(times, func) {
        return 0 >= times ? func() : function() {
            return 1 > --times ? func.apply(this, arguments) : void 0
        }
    }, _.keys = nativeKeys || function(obj) {
        if (obj !== Object(obj)) throw new TypeError("Invalid object");
        var keys = [];
        for (var key in obj) _.has(obj, key) && keys.push(key);
        return keys
    }, _.values = function(obj) {
        var values = [];
        for (var key in obj) _.has(obj, key) && values.push(obj[key]);
        return values
    }, _.pairs = function(obj) {
        var pairs = [];
        for (var key in obj) _.has(obj, key) && pairs.push([key, obj[key]]);
        return pairs
    }, _.invert = function(obj) {
        var result = {};
        for (var key in obj) _.has(obj, key) && (result[obj[key]] = key);
        return result
    }, _.functions = _.methods = function(obj) {
        var names = [];
        for (var key in obj) _.isFunction(obj[key]) && names.push(key);
        return names.sort()
    }, _.extend = function(obj) {
        return each(slice.call(arguments, 1), function(source) {
            if (source)
                for (var prop in source) obj[prop] = source[prop]
        }), obj
    }, _.pick = function(obj) {
        var copy = {}, keys = concat.apply(ArrayProto, slice.call(arguments, 1));
        return each(keys, function(key) {
            key in obj && (copy[key] = obj[key])
        }), copy
    }, _.omit = function(obj) {
        var copy = {}, keys = concat.apply(ArrayProto, slice.call(arguments, 1));
        for (var key in obj) _.contains(keys, key) || (copy[key] = obj[key]);
        return copy
    }, _.defaults = function(obj) {
        return each(slice.call(arguments, 1), function(source) {
            if (source)
                for (var prop in source) void 0 === obj[prop] && (obj[prop] = source[prop])
        }), obj
    }, _.clone = function(obj) {
        return _.isObject(obj) ? _.isArray(obj) ? obj.slice() : _.extend({}, obj) : obj
    }, _.tap = function(obj, interceptor) {
        return interceptor(obj), obj
    };
    var eq = function(a, b, aStack, bStack) {
        if (a === b) return 0 !== a || 1 / a == 1 / b;
        if (null == a || null == b) return a === b;
        a instanceof _ && (a = a._wrapped), b instanceof _ && (b = b._wrapped);
        var className = toString.call(a);
        if (className != toString.call(b)) return !1;
        switch (className) {
            case "[object String]":
                return a == b + "";
            case "[object Number]":
                return a != +a ? b != +b : 0 == a ? 1 / a == 1 / b : a == +b;
            case "[object Date]":
            case "[object Boolean]":
                return +a == +b;
            case "[object RegExp]":
                return a.source == b.source && a.global == b.global && a.multiline == b.multiline && a.ignoreCase == b.ignoreCase
        }
        if ("object" != typeof a || "object" != typeof b) return !1;
        for (var length = aStack.length; length--;)
            if (aStack[length] == a) return bStack[length] == b;
        aStack.push(a), bStack.push(b);
        var size = 0,
            result = !0;
        if ("[object Array]" == className) {
            if (size = a.length, result = size == b.length)
                for (; size-- && (result = eq(a[size], b[size], aStack, bStack)););
        } else {
            var aCtor = a.constructor,
                bCtor = b.constructor;
            if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor)) return !1;
            for (var key in a)
                if (_.has(a, key) && (size++, !(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack)))) break;
            if (result) {
                for (key in b)
                    if (_.has(b, key) && !size--) break;
                result = !size
            }
        }
        return aStack.pop(), bStack.pop(), result
    };
    _.isEqual = function(a, b) {
        return eq(a, b, [], [])
    }, _.isEmpty = function(obj) {
        if (null == obj) return !0;
        if (_.isArray(obj) || _.isString(obj)) return 0 === obj.length;
        for (var key in obj)
            if (_.has(obj, key)) return !1;
        return !0
    }, _.isElement = function(obj) {
        return !(!obj || 1 !== obj.nodeType)
    }, _.isArray = nativeIsArray || function(obj) {
        return "[object Array]" == toString.call(obj)
    }, _.isObject = function(obj) {
        return obj === Object(obj)
    }, each(["Arguments", "Function", "String", "Number", "Date", "RegExp"], function(name) {
        _["is" + name] = function(obj) {
            return toString.call(obj) == "[object " + name + "]"
        }
    }), _.isArguments(arguments) || (_.isArguments = function(obj) {
        return !(!obj || !_.has(obj, "callee"))
    }), _.isFunction = function(obj) {
        return "function" == typeof obj
    }, _.isFinite = function(obj) {
        return isFinite(obj) && !isNaN(parseFloat(obj))
    }, _.isNaN = function(obj) {
        return _.isNumber(obj) && obj != +obj
    }, _.isBoolean = function(obj) {
        return obj === !0 || obj === !1 || "[object Boolean]" == toString.call(obj)
    }, _.isNull = function(obj) {
        return null === obj
    }, _.isUndefined = function(obj) {
        return void 0 === obj
    }, _.has = function(obj, key) {
        return hasOwnProperty.call(obj, key)
    }, _.noConflict = function() {
        return root._ = previousUnderscore, this
    }, _.identity = function(value) {
        return value
    }, _.times = function(n, iterator, context) {
        for (var accum = Array(n), i = 0; n > i; i++) accum[i] = iterator.call(context, i);
        return accum
    }, _.random = function(min, max) {
        return null == max && (max = min, min = 0), min + Math.floor(Math.random() * (max - min + 1))
    };
    var entityMap = {
        escape: {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;",
            "/": "&#x2F;"
        }
    };
    entityMap.unescape = _.invert(entityMap.escape);
    var entityRegexes = {
        escape: RegExp("[" + _.keys(entityMap.escape).join("") + "]", "g"),
        unescape: RegExp("(" + _.keys(entityMap.unescape).join("|") + ")", "g")
    };
    _.each(["escape", "unescape"], function(method) {
        _[method] = function(string) {
            return null == string ? "" : ("" + string).replace(entityRegexes[method], function(match) {
                return entityMap[method][match]
            })
        }
    }), _.result = function(object, property) {
        if (null == object) return void 0;
        var value = object[property];
        return _.isFunction(value) ? value.call(object) : value
    }, _.mixin = function(obj) {
        each(_.functions(obj), function(name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function() {
                var args = [this._wrapped];
                return push.apply(args, arguments), result.call(this, func.apply(_, args))
            }
        })
    };
    var idCounter = 0;
    _.uniqueId = function(prefix) {
        var id = ++idCounter + "";
        return prefix ? prefix + id : id
    }, _.templateSettings = {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        escape: /<%-([\s\S]+?)%>/g
    };
    var noMatch = /(.)^/,
        escapes = {
            "'": "'",
            "\\": "\\",
            "\r": "r",
            "\n": "n",
            " ": "t",
            "\u2028": "u2028",
            "\u2029": "u2029"
        }, escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
    _.template = function(text, data, settings) {
        var render;
        settings = _.defaults({}, settings, _.templateSettings);
        var matcher = RegExp([(settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source].join("|") + "|$", "g"),
            index = 0,
            source = "__p+='";
        text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
            return source += text.slice(index, offset).replace(escaper, function(match) {
                return "\\" + escapes[match]
            }), escape && (source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'"), interpolate && (source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'"), evaluate && (source += "';\n" + evaluate + "\n__p+='"), index = offset + match.length, match
        }), source += "';\n", settings.variable || (source = "with(obj||{}){\n" + source + "}\n"), source = "var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n" + source + "return __p;\n";
        try {
            render = Function(settings.variable || "obj", "_", source)
        } catch (e) {
            throw e.source = source, e
        }
        if (data) return render(data, _);
        var template = function(data) {
            return render.call(this, data, _)
        };
        return template.source = "function(" + (settings.variable || "obj") + "){\n" + source + "}", template
    }, _.chain = function(obj) {
        return _(obj).chain()
    };
    var result = function(obj) {
        return this._chain ? _(obj).chain() : obj
    };
    _.mixin(_), each(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function(name) {
        var method = ArrayProto[name];
        _.prototype[name] = function() {
            var obj = this._wrapped;
            return method.apply(obj, arguments), "shift" != name && "splice" != name || 0 !== obj.length || delete obj[0], result.call(this, obj)
        }
    }), each(["concat", "join", "slice"], function(name) {
        var method = ArrayProto[name];
        _.prototype[name] = function() {
            return result.call(this, method.apply(this._wrapped, arguments))
        }
    }), _.extend(_.prototype, {
        chain: function() {
            return this._chain = !0, this
        },
        value: function() {
            return this._wrapped
        }
    })
}.call(this), _.templateSettings = {
    evaluate: /\{\{([\s\S]+?)\}\}/g,
    interpolate: /\{\{=([\s\S]+?)\}\}/g,
    escape: /\{\{-([\s\S]+?)\}\}/g
}, define("underscore-src", [], function() {}),
function() {
    var Backbone, root = this,
        previousBackbone = root.Backbone,
        array = [],
        push = array.push,
        slice = array.slice,
        splice = array.splice;
    Backbone = "undefined" != typeof exports ? exports : root.Backbone = {}, Backbone.VERSION = "1.0.0";
    var _ = root._;
    _ || "undefined" == typeof require || (_ = require("underscore")), Backbone.$ = root.jQuery || root.Zepto || root.ender || root.$, Backbone.noConflict = function() {
        return root.Backbone = previousBackbone, this
    }, Backbone.emulateHTTP = !1, Backbone.emulateJSON = !1;
    var Events = Backbone.Events = {
        on: function(name, callback, context) {
            if (!eventsApi(this, "on", name, [callback, context]) || !callback) return this;
            this._events || (this._events = {});
            var events = this._events[name] || (this._events[name] = []);
            return events.push({
                callback: callback,
                context: context,
                ctx: context || this
            }), this
        },
        once: function(name, callback, context) {
            if (!eventsApi(this, "once", name, [callback, context]) || !callback) return this;
            var self = this,
                once = _.once(function() {
                    self.off(name, once), callback.apply(this, arguments)
                });
            return once._callback = callback, this.on(name, once, context)
        },
        off: function(name, callback, context) {
            var retain, ev, events, names, i, l, j, k;
            if (!this._events || !eventsApi(this, "off", name, [callback, context])) return this;
            if (!name && !callback && !context) return this._events = {}, this;
            for (names = name ? [name] : _.keys(this._events), i = 0, l = names.length; l > i; i++)
                if (name = names[i], events = this._events[name]) {
                    if (this._events[name] = retain = [], callback || context)
                        for (j = 0, k = events.length; k > j; j++) ev = events[j], (callback && callback !== ev.callback && callback !== ev.callback._callback || context && context !== ev.context) && retain.push(ev);
                    retain.length || delete this._events[name]
                }
            return this
        },
        trigger: function(name) {
            if (!this._events) return this;
            var args = slice.call(arguments, 1);
            if (!eventsApi(this, "trigger", name, args)) return this;
            var events = this._events[name],
                allEvents = this._events.all;
            return events && triggerEvents(events, args), allEvents && triggerEvents(allEvents, arguments), this
        },
        stopListening: function(obj, name, callback) {
            var listeners = this._listeners;
            if (!listeners) return this;
            var deleteListener = !name && !callback;
            "object" == typeof name && (callback = this), obj && ((listeners = {})[obj._listenerId] = obj);
            for (var id in listeners) listeners[id].off(name, callback, this), deleteListener && delete this._listeners[id];
            return this
        }
    }, eventSplitter = /\s+/,
        eventsApi = function(obj, action, name, rest) {
            if (!name) return !0;
            if ("object" == typeof name) {
                for (var key in name) obj[action].apply(obj, [key, name[key]].concat(rest));
                return !1
            }
            if (eventSplitter.test(name)) {
                for (var names = name.split(eventSplitter), i = 0, l = names.length; l > i; i++) obj[action].apply(obj, [names[i]].concat(rest));
                return !1
            }
            return !0
        }, triggerEvents = function(events, args) {
            var ev, i = -1,
                l = events.length,
                a1 = args[0],
                a2 = args[1],
                a3 = args[2];
            switch (args.length) {
                case 0:
                    for (; l > ++i;)(ev = events[i]).callback.call(ev.ctx);
                    return;
                case 1:
                    for (; l > ++i;)(ev = events[i]).callback.call(ev.ctx, a1);
                    return;
                case 2:
                    for (; l > ++i;)(ev = events[i]).callback.call(ev.ctx, a1, a2);
                    return;
                case 3:
                    for (; l > ++i;)(ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
                    return;
                default:
                    for (; l > ++i;)(ev = events[i]).callback.apply(ev.ctx, args)
            }
        }, listenMethods = {
            listenTo: "on",
            listenToOnce: "once"
        };
    _.each(listenMethods, function(implementation, method) {
        Events[method] = function(obj, name, callback) {
            var listeners = this._listeners || (this._listeners = {}),
                id = obj._listenerId || (obj._listenerId = _.uniqueId("l"));
            return listeners[id] = obj, "object" == typeof name && (callback = this), obj[implementation](name, callback, this), this
        }
    }), Events.bind = Events.on, Events.unbind = Events.off, _.extend(Backbone, Events);
    var Model = Backbone.Model = function(attributes, options) {
        var defaults, attrs = attributes || {};
        options || (options = {}), this.cid = _.uniqueId("c"), this.attributes = {}, _.extend(this, _.pick(options, modelOptions)), options.parse && (attrs = this.parse(attrs, options) || {}), (defaults = _.result(this, "defaults")) && (attrs = _.defaults({}, attrs, defaults)), this.set(attrs, options), this.changed = {}, this.initialize.apply(this, arguments)
    }, modelOptions = ["url", "urlRoot", "collection"];
    _.extend(Model.prototype, Events, {
        changed: null,
        validationError: null,
        idAttribute: "id",
        initialize: function() {},
        toJSON: function() {
            return _.clone(this.attributes)
        },
        sync: function() {
            return Backbone.sync.apply(this, arguments)
        },
        get: function(attr) {
            return this.attributes[attr]
        },
        escape: function(attr) {
            return _.escape(this.get(attr))
        },
        has: function(attr) {
            return null != this.get(attr)
        },
        set: function(key, val, options) {
            var attr, attrs, unset, changes, silent, changing, prev, current;
            if (null == key) return this;
            if ("object" == typeof key ? (attrs = key, options = val) : (attrs = {})[key] = val, options || (options = {}), !this._validate(attrs, options)) return !1;
            unset = options.unset, silent = options.silent, changes = [], changing = this._changing, this._changing = !0, changing || (this._previousAttributes = _.clone(this.attributes), this.changed = {}), current = this.attributes, prev = this._previousAttributes, this.idAttribute in attrs && (this.id = attrs[this.idAttribute]);
            for (attr in attrs) val = attrs[attr], _.isEqual(current[attr], val) || changes.push(attr), _.isEqual(prev[attr], val) ? delete this.changed[attr] : this.changed[attr] = val, unset ? delete current[attr] : current[attr] = val;
            if (!silent) {
                changes.length && (this._pending = !0);
                for (var i = 0, l = changes.length; l > i; i++) this.trigger("change:" + changes[i], this, current[changes[i]], options)
            }
            if (changing) return this;
            if (!silent)
                for (; this._pending;) this._pending = !1, this.trigger("change", this, options);
            return this._pending = !1, this._changing = !1, this
        },
        unset: function(attr, options) {
            return this.set(attr, void 0, _.extend({}, options, {
                unset: !0
            }))
        },
        clear: function(options) {
            var attrs = {};
            for (var key in this.attributes) attrs[key] = void 0;
            return this.set(attrs, _.extend({}, options, {
                unset: !0
            }))
        },
        hasChanged: function(attr) {
            return null == attr ? !_.isEmpty(this.changed) : _.has(this.changed, attr)
        },
        changedAttributes: function(diff) {
            if (!diff) return this.hasChanged() ? _.clone(this.changed) : !1;
            var val, changed = !1,
                old = this._changing ? this._previousAttributes : this.attributes;
            for (var attr in diff) _.isEqual(old[attr], val = diff[attr]) || ((changed || (changed = {}))[attr] = val);
            return changed
        },
        previous: function(attr) {
            return null != attr && this._previousAttributes ? this._previousAttributes[attr] : null
        },
        previousAttributes: function() {
            return _.clone(this._previousAttributes)
        },
        fetch: function(options) {
            options = options ? _.clone(options) : {}, void 0 === options.parse && (options.parse = !0);
            var model = this,
                success = options.success;
            return options.success = function(resp) {
                return model.set(model.parse(resp, options), options) ? (success && success(model, resp, options), model.trigger("sync", model, resp, options), void 0) : !1
            }, wrapError(this, options), this.sync("read", this, options)
        },
        save: function(key, val, options) {
            var attrs, method, xhr, attributes = this.attributes;
            if (null == key || "object" == typeof key ? (attrs = key, options = val) : (attrs = {})[key] = val, !(!attrs || options && options.wait || this.set(attrs, options))) return !1;
            if (options = _.extend({
                validate: !0
            }, options), !this._validate(attrs, options)) return !1;
            attrs && options.wait && (this.attributes = _.extend({}, attributes, attrs)), void 0 === options.parse && (options.parse = !0);
            var model = this,
                success = options.success;
            return options.success = function(resp) {
                model.attributes = attributes;
                var serverAttrs = model.parse(resp, options);
                return options.wait && (serverAttrs = _.extend(attrs || {}, serverAttrs)), _.isObject(serverAttrs) && !model.set(serverAttrs, options) ? !1 : (success && success(model, resp, options), model.trigger("sync", model, resp, options), void 0)
            }, wrapError(this, options), method = this.isNew() ? "create" : options.patch ? "patch" : "update", "patch" === method && (options.attrs = attrs), xhr = this.sync(method, this, options), attrs && options.wait && (this.attributes = attributes), xhr
        },
        destroy: function(options) {
            options = options ? _.clone(options) : {};
            var model = this,
                success = options.success,
                destroy = function() {
                    model.trigger("destroy", model, model.collection, options)
                };
            if (options.success = function(resp) {
                (options.wait || model.isNew()) && destroy(), success && success(model, resp, options), model.isNew() || model.trigger("sync", model, resp, options)
            }, this.isNew()) return options.success(), !1;
            wrapError(this, options);
            var xhr = this.sync("delete", this, options);
            return options.wait || destroy(), xhr
        },
        url: function() {
            var base = _.result(this, "urlRoot") || _.result(this.collection, "url") || urlError();
            return this.isNew() ? base : base + ("/" === base.charAt(base.length - 1) ? "" : "/") + encodeURIComponent(this.id)
        },
        parse: function(resp) {
            return resp
        },
        clone: function() {
            return new this.constructor(this.attributes)
        },
        isNew: function() {
            return null == this.id
        },
        isValid: function(options) {
            return this._validate({}, _.extend(options || {}, {
                validate: !0
            }))
        },
        _validate: function(attrs, options) {
            if (!options.validate || !this.validate) return !0;
            attrs = _.extend({}, this.attributes, attrs);
            var error = this.validationError = this.validate(attrs, options) || null;
            return error ? (this.trigger("invalid", this, error, _.extend(options || {}, {
                validationError: error
            })), !1) : !0
        }
    });
    var modelMethods = ["keys", "values", "pairs", "invert", "pick", "omit"];
    _.each(modelMethods, function(method) {
        Model.prototype[method] = function() {
            var args = slice.call(arguments);
            return args.unshift(this.attributes), _[method].apply(_, args)
        }
    });
    var Collection = Backbone.Collection = function(models, options) {
        options || (options = {}), options.url && (this.url = options.url), options.model && (this.model = options.model), void 0 !== options.comparator && (this.comparator = options.comparator), this._reset(), this.initialize.apply(this, arguments), models && this.reset(models, _.extend({
            silent: !0
        }, options))
    }, setOptions = {
            add: !0,
            remove: !0,
            merge: !0
        }, addOptions = {
            add: !0,
            merge: !1,
            remove: !1
        };
    _.extend(Collection.prototype, Events, {
        model: Model,
        initialize: function() {},
        toJSON: function(options) {
            return this.map(function(model) {
                return model.toJSON(options)
            })
        },
        sync: function() {
            return Backbone.sync.apply(this, arguments)
        },
        add: function(models, options) {
            return this.set(models, _.defaults(options || {}, addOptions))
        },
        remove: function(models, options) {
            models = _.isArray(models) ? models.slice() : [models], options || (options = {});
            var i, l, index, model;
            for (i = 0, l = models.length; l > i; i++) model = this.get(models[i]), model && (delete this._byId[model.id], delete this._byId[model.cid], index = this.indexOf(model), this.models.splice(index, 1), this.length--, options.silent || (options.index = index, model.trigger("remove", model, this, options)), this._removeReference(model));
            return this
        },
        set: function(models, options) {
            options = _.defaults(options || {}, setOptions), options.parse && (models = this.parse(models, options)), _.isArray(models) || (models = models ? [models] : []);
            var i, l, model, existing, sort, at = options.at,
                sortable = this.comparator && null == at && options.sort !== !1,
                sortAttr = _.isString(this.comparator) ? this.comparator : null,
                toAdd = [],
                toRemove = [],
                modelMap = {};
            for (i = 0, l = models.length; l > i; i++)(model = this._prepareModel(models[i], options)) && ((existing = this.get(model)) ? (options.remove && (modelMap[existing.cid] = !0), options.merge && (existing.set(model.attributes, options), sortable && !sort && existing.hasChanged(sortAttr) && (sort = !0))) : options.add && (toAdd.push(model), model.on("all", this._onModelEvent, this), this._byId[model.cid] = model, null != model.id && (this._byId[model.id] = model)));
            if (options.remove) {
                for (i = 0, l = this.length; l > i; ++i) modelMap[(model = this.models[i]).cid] || toRemove.push(model);
                toRemove.length && this.remove(toRemove, options)
            }
            if (toAdd.length && (sortable && (sort = !0), this.length += toAdd.length, null != at ? splice.apply(this.models, [at, 0].concat(toAdd)) : push.apply(this.models, toAdd)), sort && this.sort({
                silent: !0
            }), options.silent) return this;
            for (i = 0, l = toAdd.length; l > i; i++)(model = toAdd[i]).trigger("add", model, this, options);
            return sort && this.trigger("sort", this, options), this
        },
        reset: function(models, options) {
            options || (options = {});
            for (var i = 0, l = this.models.length; l > i; i++) this._removeReference(this.models[i]);
            return options.previousModels = this.models, this._reset(), this.add(models, _.extend({
                silent: !0
            }, options)), options.silent || this.trigger("reset", this, options), this
        },
        push: function(model, options) {
            return model = this._prepareModel(model, options), this.add(model, _.extend({
                at: this.length
            }, options)), model
        },
        pop: function(options) {
            var model = this.at(this.length - 1);
            return this.remove(model, options), model
        },
        unshift: function(model, options) {
            return model = this._prepareModel(model, options), this.add(model, _.extend({
                at: 0
            }, options)), model
        },
        shift: function(options) {
            var model = this.at(0);
            return this.remove(model, options), model
        },
        slice: function(begin, end) {
            return this.models.slice(begin, end)
        },
        get: function(obj) {
            return null == obj ? void 0 : this._byId[null != obj.id ? obj.id : obj.cid || obj]
        },
        at: function(index) {
            return this.models[index]
        },
        where: function(attrs, first) {
            return _.isEmpty(attrs) ? first ? void 0 : [] : this[first ? "find" : "filter"](function(model) {
                for (var key in attrs)
                    if (attrs[key] !== model.get(key)) return !1;
                return !0
            })
        },
        findWhere: function(attrs) {
            return this.where(attrs, !0)
        },
        sort: function(options) {
            if (!this.comparator) throw Error("Cannot sort a set without a comparator");
            return options || (options = {}), _.isString(this.comparator) || 1 === this.comparator.length ? this.models = this.sortBy(this.comparator, this) : this.models.sort(_.bind(this.comparator, this)), options.silent || this.trigger("sort", this, options), this
        },
        sortedIndex: function(model, value, context) {
            value || (value = this.comparator);
            var iterator = _.isFunction(value) ? value : function(model) {
                    return model.get(value)
                };
            return _.sortedIndex(this.models, model, iterator, context)
        },
        pluck: function(attr) {
            return _.invoke(this.models, "get", attr)
        },
        fetch: function(options) {
            options = options ? _.clone(options) : {}, void 0 === options.parse && (options.parse = !0);
            var success = options.success,
                collection = this;
            return options.success = function(resp) {
                var method = options.reset ? "reset" : "set";
                collection[method](resp, options), success && success(collection, resp, options), collection.trigger("sync", collection, resp, options)
            }, wrapError(this, options), this.sync("read", this, options)
        },
        create: function(model, options) {
            if (options = options ? _.clone(options) : {}, !(model = this._prepareModel(model, options))) return !1;
            options.wait || this.add(model, options);
            var collection = this,
                success = options.success;
            return options.success = function(resp) {
                options.wait && collection.add(model, options), success && success(model, resp, options)
            }, model.save(null, options), model
        },
        parse: function(resp) {
            return resp
        },
        clone: function() {
            return new this.constructor(this.models)
        },
        _reset: function() {
            this.length = 0, this.models = [], this._byId = {}
        },
        _prepareModel: function(attrs, options) {
            if (attrs instanceof Model) return attrs.collection || (attrs.collection = this), attrs;
            options || (options = {}), options.collection = this;
            var model = new this.model(attrs, options);
            return model._validate(attrs, options) ? model : (this.trigger("invalid", this, attrs, options), !1)
        },
        _removeReference: function(model) {
            this === model.collection && delete model.collection, model.off("all", this._onModelEvent, this)
        },
        _onModelEvent: function(event, model, collection, options) {
            ("add" !== event && "remove" !== event || collection === this) && ("destroy" === event && this.remove(model, options), model && event === "change:" + model.idAttribute && (delete this._byId[model.previous(model.idAttribute)], null != model.id && (this._byId[model.id] = model)), this.trigger.apply(this, arguments))
        }
    });
    var methods = ["forEach", "each", "map", "collect", "reduce", "foldl", "inject", "reduceRight", "foldr", "find", "detect", "filter", "select", "reject", "every", "all", "some", "any", "include", "contains", "invoke", "max", "min", "toArray", "size", "first", "head", "take", "initial", "rest", "tail", "drop", "last", "without", "indexOf", "shuffle", "lastIndexOf", "isEmpty", "chain"];
    _.each(methods, function(method) {
        Collection.prototype[method] = function() {
            var args = slice.call(arguments);
            return args.unshift(this.models), _[method].apply(_, args)
        }
    });
    var attributeMethods = ["groupBy", "countBy", "sortBy"];
    _.each(attributeMethods, function(method) {
        Collection.prototype[method] = function(value, context) {
            var iterator = _.isFunction(value) ? value : function(model) {
                    return model.get(value)
                };
            return _[method](this.models, iterator, context)
        }
    });
    var View = Backbone.View = function(options) {
        this.cid = _.uniqueId("view"), this._configure(options || {}), this._ensureElement(), this.initialize.apply(this, arguments), this.delegateEvents()
    }, delegateEventSplitter = /^(\S+)\s*(.*)$/,
        viewOptions = ["model", "collection", "el", "id", "attributes", "className", "tagName", "events"];
    _.extend(View.prototype, Events, {
        tagName: "div",
        $: function(selector) {
            return this.$el.find(selector)
        },
        initialize: function() {},
        render: function() {
            return this
        },
        remove: function() {
            return this.$el.remove(), this.stopListening(), this
        },
        setElement: function(element, delegate) {
            return this.$el && this.undelegateEvents(), this.$el = element instanceof Backbone.$ ? element : Backbone.$(element), this.el = this.$el[0], delegate !== !1 && this.delegateEvents(), this
        },
        delegateEvents: function(events) {
            if (!events && !(events = _.result(this, "events"))) return this;
            this.undelegateEvents();
            for (var key in events) {
                var method = events[key];
                if (_.isFunction(method) || (method = this[events[key]]), method) {
                    var match = key.match(delegateEventSplitter),
                        eventName = match[1],
                        selector = match[2];
                    method = _.bind(method, this), eventName += ".delegateEvents" + this.cid, "" === selector ? this.$el.on(eventName, method) : this.$el.on(eventName, selector, method)
                }
            }
            return this
        },
        undelegateEvents: function() {
            return this.$el.off(".delegateEvents" + this.cid), this
        },
        _configure: function(options) {
            this.options && (options = _.extend({}, _.result(this, "options"), options)), _.extend(this, _.pick(options, viewOptions)), this.options = options
        },
        _ensureElement: function() {
            if (this.el) this.setElement(_.result(this, "el"), !1);
            else {
                var attrs = _.extend({}, _.result(this, "attributes"));
                this.id && (attrs.id = _.result(this, "id")), this.className && (attrs["class"] = _.result(this, "className"));
                var $el = Backbone.$("<" + _.result(this, "tagName") + ">").attr(attrs);
                this.setElement($el, !1)
            }
        }
    }), Backbone.sync = function(method, model, options) {
        var type = methodMap[method];
        _.defaults(options || (options = {}), {
            emulateHTTP: Backbone.emulateHTTP,
            emulateJSON: Backbone.emulateJSON
        });
        var params = {
            type: type,
            dataType: "json"
        };
        if (options.url || (params.url = _.result(model, "url") || urlError()), null != options.data || !model || "create" !== method && "update" !== method && "patch" !== method || (params.contentType = "application/json", params.data = JSON.stringify(options.attrs || model.toJSON(options))), options.emulateJSON && (params.contentType = "application/x-www-form-urlencoded", params.data = params.data ? {
            model: params.data
        } : {}), options.emulateHTTP && ("PUT" === type || "DELETE" === type || "PATCH" === type)) {
            params.type = "POST", options.emulateJSON && (params.data._method = type);
            var beforeSend = options.beforeSend;
            options.beforeSend = function(xhr) {
                return xhr.setRequestHeader("X-HTTP-Method-Override", type), beforeSend ? beforeSend.apply(this, arguments) : void 0
            }
        }
        "GET" === params.type || options.emulateJSON || (params.processData = !1), "PATCH" !== params.type || !window.ActiveXObject || window.external && window.external.msActiveXFilteringEnabled || (params.xhr = function() {
            return new ActiveXObject("Microsoft.XMLHTTP")
        });
        var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
        return model.trigger("request", model, xhr, options), xhr
    };
    var methodMap = {
        create: "POST",
        update: "PUT",
        patch: "PATCH",
        "delete": "DELETE",
        read: "GET"
    };
    Backbone.ajax = function() {
        return Backbone.$.ajax.apply(Backbone.$, arguments)
    };
    var Router = Backbone.Router = function(options) {
        options || (options = {}), options.routes && (this.routes = options.routes), this._bindRoutes(), this.initialize.apply(this, arguments)
    }, optionalParam = /\((.*?)\)/g,
        namedParam = /(\(\?)?:\w+/g,
        splatParam = /\*\w+/g,
        escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;
    _.extend(Router.prototype, Events, {
        initialize: function() {},
        route: function(route, name, callback) {
            _.isRegExp(route) || (route = this._routeToRegExp(route)), _.isFunction(name) && (callback = name, name = ""), callback || (callback = this[name]);
            var router = this;
            return Backbone.history.route(route, function(fragment) {
                var args = router._extractParameters(route, fragment);
                callback && callback.apply(router, args), router.trigger.apply(router, ["route:" + name].concat(args)), router.trigger("route", name, args), Backbone.history.trigger("route", router, name, args)
            }), this
        },
        navigate: function(fragment, options) {
            return Backbone.history.navigate(fragment, options), this
        },
        _bindRoutes: function() {
            if (this.routes) {
                this.routes = _.result(this, "routes");
                for (var route, routes = _.keys(this.routes); null != (route = routes.pop());) this.route(route, this.routes[route])
            }
        },
        _routeToRegExp: function(route) {
            return route = route.replace(escapeRegExp, "\\$&").replace(optionalParam, "(?:$1)?").replace(namedParam, function(match, optional) {
                return optional ? match : "([^/]+)"
            }).replace(splatParam, "(.*?)"), RegExp("^" + route + "$")
        },
        _extractParameters: function(route, fragment) {
            var params = route.exec(fragment).slice(1);
            return _.map(params, function(param) {
                return param ? decodeURIComponent(param) : null
            })
        }
    });
    var History = Backbone.History = function() {
        this.handlers = [], _.bindAll(this, "checkUrl"), "undefined" != typeof window && (this.location = window.location, this.history = window.history)
    }, routeStripper = /^[#\/]|\s+$/g,
        rootStripper = /^\/+|\/+$/g,
        isExplorer = /msie [\w.]+/,
        trailingSlash = /\/$/;
    History.started = !1, _.extend(History.prototype, Events, {
        interval: 50,
        getHash: function(window) {
            var match = (window || this).location.href.match(/#(.*)$/);
            return match ? match[1] : ""
        },
        getFragment: function(fragment, forcePushState) {
            if (null == fragment)
                if (this._hasPushState || !this._wantsHashChange || forcePushState) {
                    fragment = this.location.pathname;
                    var root = this.root.replace(trailingSlash, "");
                    fragment.indexOf(root) || (fragment = fragment.substr(root.length))
                } else fragment = this.getHash();
            return fragment.replace(routeStripper, "")
        },
        start: function(options) {
            if (History.started) throw Error("Backbone.history has already been started");
            History.started = !0, this.options = _.extend({}, {
                root: "/"
            }, this.options, options), this.root = this.options.root, this._wantsHashChange = this.options.hashChange !== !1, this._wantsPushState = !! this.options.pushState, this._hasPushState = !! (this.options.pushState && this.history && this.history.pushState);
            var fragment = this.getFragment(),
                docMode = document.documentMode,
                oldIE = isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || 7 >= docMode);
            this.root = ("/" + this.root + "/").replace(rootStripper, "/"), oldIE && this._wantsHashChange && (this.iframe = Backbone.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo("body")[0].contentWindow, this.navigate(fragment)), this._hasPushState ? Backbone.$(window).on("popstate", this.checkUrl) : this._wantsHashChange && "onhashchange" in window && !oldIE ? Backbone.$(window).on("hashchange", this.checkUrl) : this._wantsHashChange && (this._checkUrlInterval = setInterval(this.checkUrl, this.interval)), this.fragment = fragment;
            var loc = this.location,
                atRoot = loc.pathname.replace(/[^\/]$/, "$&/") === this.root;
            return this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot ? (this.fragment = this.getFragment(null, !0), this.location.replace(this.root + this.location.search + "#" + this.fragment), !0) : (this._wantsPushState && this._hasPushState && atRoot && loc.hash && (this.fragment = this.getHash().replace(routeStripper, ""), this.history.replaceState({}, document.title, this.root + this.fragment + loc.search)), this.options.silent ? void 0 : this.loadUrl())
        },
        stop: function() {
            Backbone.$(window).off("popstate", this.checkUrl).off("hashchange", this.checkUrl), clearInterval(this._checkUrlInterval), History.started = !1
        },
        route: function(route, callback) {
            this.handlers.unshift({
                route: route,
                callback: callback
            })
        },
        checkUrl: function() {
            var current = this.getFragment();
            return current === this.fragment && this.iframe && (current = this.getFragment(this.getHash(this.iframe))), current === this.fragment ? !1 : (this.iframe && this.navigate(current), this.loadUrl() || this.loadUrl(this.getHash()), void 0)
        },
        loadUrl: function(fragmentOverride) {
            var fragment = this.fragment = this.getFragment(fragmentOverride),
                matched = _.any(this.handlers, function(handler) {
                    return handler.route.test(fragment) ? (handler.callback(fragment), !0) : void 0
                });
            return matched
        },
        navigate: function(fragment, options) {
            if (!History.started) return !1;
            if (options && options !== !0 || (options = {
                trigger: options
            }), fragment = this.getFragment(fragment || ""), this.fragment !== fragment) {
                this.fragment = fragment;
                var url = this.root + fragment;
                if (this._hasPushState) this.history[options.replace ? "replaceState" : "pushState"]({}, document.title, url);
                else {
                    if (!this._wantsHashChange) return this.location.assign(url);
                    this._updateHash(this.location, fragment, options.replace), this.iframe && fragment !== this.getFragment(this.getHash(this.iframe)) && (options.replace || this.iframe.document.open().close(), this._updateHash(this.iframe.location, fragment, options.replace))
                }
                options.trigger && this.loadUrl(fragment)
            }
        },
        _updateHash: function(location, fragment, replace) {
            if (replace) {
                var href = location.href.replace(/(javascript:|#).*$/, "");
                location.replace(href + "#" + fragment)
            } else location.hash = "#" + fragment
        }
    }), Backbone.history = new History;
    var extend = function(protoProps, staticProps) {
        var child, parent = this;
        child = protoProps && _.has(protoProps, "constructor") ? protoProps.constructor : function() {
            return parent.apply(this, arguments)
        }, _.extend(child, parent, staticProps);
        var Surrogate = function() {
            this.constructor = child
        };
        return Surrogate.prototype = parent.prototype, child.prototype = new Surrogate, protoProps && _.extend(child.prototype, protoProps), child.__super__ = parent.prototype, child
    };
    Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;
    var urlError = function() {
        throw Error('A "url" property or function must be specified')
    }, wrapError = function(model, options) {
            var error = options.error;
            options.error = function(resp) {
                error && error(model, resp, options), model.trigger("error", model, resp, options)
            }
        }
}.call(this), define("backbone-src", ["jquery-src", "underscore-src"], function() {}), define("reader/models/user", ["backbone", "mod/ajax"], function(Backbone) {
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
}), define("reader/modules/open_login_and_signup", ["jquery", "underscore"], function($, _) {
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
}), define("reader/modules/storage_manager", ["jquery", "underscore"], function($, _) {
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
}), define("reader/modules/matchMedia", function() {
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
}), define("mod/detector", [], function() {
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
}), define("mod/bbsync", ["underscore", "mod/ajax"], function(_, Ajax) {
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
}), define("reader/router", ["backbone", "jquery", "reader/modules/ga"], function(Backbone, $, ga) {
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
}), define("reader/modules/coll_fetch_one", [], function() {
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
}), define("reader/modules/collection_add_dup", ["backbone", "underscore", "jquery"], function(Backbone, _, $) {
    var CProto = Backbone.Collection.prototype;
    return {
        add: function(models, options) {
            models = $.makeArray(models), models = _.forEach(models, function(m) {
                var r = this.get(m.id);
                r ? r.set(m) : CProto.add.call(this, m, options)
            }, this)
        }
    }
}), define("reader/models/rating", ["backbone", "underscore", "mod/ajax"], function(Backbone) {
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
}), define("reader/app", ["jquery", "underscore", "backbone"], function($, _, Backbone) {
    var app = {};
    return app.vent = _.extend({}, Backbone.Events), app
}), define("reader/models/article", ["backbone", "reader/app", "reader/models/rating", "mod/ajax"], function(Backbone, app, Rating, Ajax) {
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
}), define("reader/collections/articles", ["backbone", "underscore", "reader/models/article", "reader/modules/collection_add_dup", "reader/modules/coll_fetch_one"], function(Backbone, _, Article, addDup, fetchOne) {
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
}), define("reader/views/reading/mixins/panel", ["jquery", "underscore", "backbone"], function() {
    var mixinedMethods = {
        closePanel: function() {
            this.$el.trigger("close")
        }
    };
    return mixinedMethods
}), define("reader/views/reading/toc", ["jquery", "backbone", "underscore", "reader/views/reading/mixins/panel", "reader/modules/ga"], function($, Backbone, _, Panel, ga) {
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
}), define("reader/modules/parse_iso_time", function() {
    return /msie 8/i.test(navigator.userAgent) ? function(dateString) {
        var resultDate, timebits = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})([+-])([0-9]{2}):([0-9]{2})/,
            m = timebits.exec(dateString),
            makeInt = function(string) {
                return parseInt(string, 10)
            };
        if (m) {
            var timestamp = Date.UTC(makeInt(m[1]), makeInt(m[2]) - 1, makeInt(m[3]), makeInt(m[4]), makeInt(m[5]), m[6] && makeInt(m[6]) || 0),
                date = new Date,
                offsetMinutes = date.getTimezoneOffset();
            if (m[8] && m[9]) {
                var timezoneOffset = 60 * makeInt(m[8]),
                    sign = "+" === m[7] ? -1 : 1;
                offsetMinutes += 60 * sign * timezoneOffset + makeInt(m[9])
            }
            timestamp += 6e4 * offsetMinutes, resultDate = new Date(timestamp)
        }
        return resultDate
    } : function(dateString) {
        return new Date(dateString)
    }
}), define("reader/modules/bubble", ["jquery", "underscore", "backbone"], function($, _, Backbone) {
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
}), define("reader/modules/tooltip", ["jquery", "underscore", "backbone", "reader/modules/bubble"], function($, _, Backbone, Bubble) {
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
}), define("reader/views/reading/mixins/sharing", ["jquery", "underscore", "backbone", "reader/app", "mod/ajax", "mod/detector", "reader/modules/ga"], function($, _, Backbone, app, ajax) {
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
}), define("reader/models/sharing", ["backbone", "underscore", "jquery"], function(Backbone, _, $) {
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
}), define("reader/modules/toast", ["jquery", "underscore"], function($, _) {
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
}), define("mod/key", ["jquery"], function($) {
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
}), define("reader/modules/form_util", ["jquery", "mod/key"], function($, Key) {
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
}), define("reader/views/reading/tips/sharing_tip", ["jquery", "backbone", "underscore", "mod/ajax", "reader/modules/form_util", "reader/modules/toast", "reader/models/sharing", "reader/views/reading/mixins/sharing"], function($, Backbone, _, ajax, FormUtil, Toast, SharingModel, sharingMixin) {
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
}), define("mod/cursor", [], function() {
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
}), define("reader/views/reading/annotations_panel/note_inline_form", ["jquery", "backbone", "underscore", "mod/cursor", "reader/modules/form_util"], function($, Backbone, _, cursor, FormUtil) {
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
}), define("reader/views/reading/annotations_panel/annotations_item", ["jquery", "backbone", "underscore", "reader/views/reading/annotations_panel/note_inline_form", "reader/views/reading/tips/sharing_tip", "reader/modules/parse_iso_time"], function($, Backbone, _, NoteInlineForm, SharingForm, parseIsoTime) {
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
                var date = parseIsoTime(ISOTime);
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
            this.config.trigger("goto:stamp", stamp)
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
}), define("reader/models/annotation_info", ["backbone", "underscore"], function(Backbone) {
    var AnnotationInfo = Backbone.Model.extend({
        parse: function(data) {
            return data.percent = parseInt(data.percent, 10), data
        }
    });
    return AnnotationInfo
}), define("reader/collections/annotation_infos", ["backbone", "underscore", "jquery", "reader/models/annotation_info"], function(Backbone, _, $, AnnotationInfo) {
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
}), define("reader/views/reading/annotations_panel/view", ["jquery", "backbone", "underscore", "reader/collections/annotation_infos", "reader/views/reading/annotations_panel/annotations_item", "reader/views/reading/mixins/panel", "reader/modules/tooltip", "reader/modules/parse_iso_time"], function($, Backbone, _, AnnotationInfos, AnnotationsItem, Panel, Tooltip, parseIsoTime) {
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
                    return -parseIsoTime(annotation.get("create_time"))
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
}), define("ui/collapse", ["jquery"], function($) {
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
}), define("reader/views/reading/controls_panel", ["backbone", "underscore", "jquery", "ui/collapse", "reader/modules/ga", "reader/views/reading/annotations_panel/view", "reader/views/reading/toc"], function(Backbone, _, $, Collapse, ga, AnnotationsPanel, Toc) {
    var ControlsPanel = Backbone.View.extend({
        el: ".controls-panel",
        template: $("#tmpl-controls-panel").html(),
        initialize: function(app, config, vent) {
            _.bindAll(this, "closeTips", "closePopups", "resetHeight", "resizePanel", "togglePanel", "initControls", "toggleShortcutTips"), this.app = app, this.config = config, this.win = $(window), this.body = $("body"), this.vent = vent, this.vent.on({
                "close:popups": this.closePopups,
                "close:shortcutTips": this.closeTips,
                "toggle:shortcutTips": this.toggleShortcutTips,
                "finish:paging": this.initControls
            }), this.config.on("goto:stamp", function() {
                this.switcher.hideAll()
            }, this), this.$el.html(_.template(this.template)), this.shortcutTips = this.$(".shortcut-tips"), this.tocView = new Toc({
                el: this.$(".toc"),
                app: this.app,
                config: this.config,
                pagination: this
            }), this.toc = this.tocView.$el, this.tocSwitcher = this.$(".toggle-toc"), this.toc.on("action:toggle", this.togglePanel).on("action:toggle", $.proxy(function(e, action) {
                this.trigger("toc:toggled", action)
            }, this)).on("action:expand", function() {
                ga._trackEvent("openToc")
            }), this.annotationsPanelView = new AnnotationsPanel({
                el: ".content-annotations-panel",
                app: this.app,
                config: this.config
            }), this.annotationsPanel = this.annotationsPanelView.$el, this.annotationsPanelSwitcher = this.$(".toggle-annotations-panel"), this.switcher = new Collapse([this.tocSwitcher, this.annotationsPanelSwitcher], [this.toc, this.annotationsPanel], {
                allowDisabled: !0
            }), this.annotationsPanel.on("action:toggle", this.togglePanel)
        },
        render: function() {
            return this.resetPanelAsResize(), this.switcher.disableHandlers(), this.contentsPaddingTop = parseFloat(this.toc.css("paddingTop")), this
        },
        events: {
            "click .controls-buttons li": "deselectAll",
            "click .close-tips": "closeTips"
        },
        deselectAll: function(e) {
            this.closeTips();
            var el = $(e.currentTarget);
            el.is(".list-icon-outer") || this.switcher.hideAll(), this.$el.find(".on").not(el).removeClass("on")
        },
        closeTips: function() {
            this.shortcutTips.hide(), $("i.tips").remove()
        },
        toggleShortcutTips: function() {
            this.shortcutTips.toggle()
        },
        closePopups: function() {
            this.switcher.hideAll(), this.$el.find(".on").removeClass("on")
        },
        resetHeight: function(el) {
            this.app.fitForMobile || el.height(this.win.height() / 16 - 5 + "em")
        },
        dealingWithScrollbar: function(action) {
            var opened = "expand" === action;
            this.body.css("overflow", opened ? "hidden" : "auto")
        },
        togglePanel: function(e, content, action) {
            this.dealingWithScrollbar(action), this.resetHeight(content)
        },
        resizePanel: function() {
            this.resetHeight(this.toc), this.resetHeight(this.annotationsPanel)
        },
        resetPanelAsResize: function() {
            this.win.resize(_.debounce(this.resizePanel, 80))
        },
        initToc: function(list) {
            var hasToc = !! list.length;
            this.tocSwitcher[hasToc ? "removeClass" : "addClass"]("disabled"), this.tocView.render(list), this.trigger("list:render")
        },
        initAnnotationsPanel: function() {
            this.annotationsPanelSwitcher.removeClass("disabled")
        },
        initControls: function(list) {
            this.initAnnotationsPanel(), this.initToc(list)
        }
    }),
        AnonymousMixin = Ark.me.isAnonymous ? {
            initAnnotationsPanel: $.noop
        } : {};
    return _.extend(ControlsPanel.prototype, AnonymousMixin), ControlsPanel
}), define("reader/views/reading/page_number", ["jquery", "backbone", "underscore", "reader/modules/ga"], function($, Backbone, _, ga) {
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
}), define("reader/views/reading/progress", ["backbone", "underscore", "jquery"], function(Backbone, _, $) {
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
}), define("reader/views/reading/pagination", ["jquery", "backbone", "underscore", "mod/detector", "reader/views/reading/progress", "reader/views/reading/page_number"], function($, Backbone, _, detector, Progress, PageNumber) {
    var Pagination = Backbone.View.extend({
        el: ".pagination",
        template: $("#tmpl-pagination").html(),
        initialize: function(app, config, vent) {
            _.bindAll(this, "pageJump", "initPagination", "verticalScroll", "saveReadingProgress", "processScrollingEvent"), this.win = $(window), this.scrollBody = $("html, body"), this.app = app, this.config = config, this.hasInputPage = 0, this.vent = vent, this.vent.on({
                "finish:paging": this.initPagination
            }), this.$el.html(_.template(this.template)), this.pageForm = this.$(".page-form"), this.pagePrev = this.$(".page-prev"), this.pageNext = this.$(".page-next"), this.emUnitBenchmark = 16, this.isShown = !! this.$el.is(":visible"), this.progressBar = new Progress({
                model: this.config
            }), this.pageNumber = new PageNumber({
                model: this.config,
                pagination: this,
                app: this.app
            })
        },
        render: function(article, book) {
            this.book = book, this.article = article, this.pageHeight = localStorage.pageHeight, this.pageOffset = this.config.get("pageOffset"), this.isSample = this.book.get("isSample"), this.isGift = this.book.get("isGift"), _.defer(_.bind(function() {
                this.articleInnerPadding = this.app.articleInner.css("paddingTop")
            }, this)), this.app.fitForMobile || this.progressBar.render(), this.trigger("view:render")
        },
        events: {
            "click .page-prev, .page-next": "pageTurning"
        },
        togglePagingBtns: function(layout) {
            this.$el.find(".page-prev, .page-next").toggle("horizontal" === layout)
        },
        processScrollingEvent: function(layout) {
            "vertical" === layout ? this.win.scroll(_.debounce(this.verticalScroll, 150)) : this.win.off("scroll")
        },
        initPagination: function() {
            this.pageNumber.render()
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
            }), this.saveReadingProgress()), (prevPage !== fakeCurrPage || this.hasInputPage) && (this.vent.trigger("render:verticelPages"), this.updateProgressBar(), this.hasInputPage = 0)
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
                if (this.updateProgressBar(), this.app.fitForMobile && this.vent.trigger("freeze:page"), "horizontal" === layout) {
                    var resetPosition = isForward ? {
                        right: "auto",
                        left: 2 === currPage ? 0 : -pageWidth + "em"
                    } : {
                        right: (currPage > 1 ? 0 : -pageWidth) - this.pageOffset + "em",
                        left: "auto"
                    }, slideStep = "-=" + pageWidth + "em",
                        slideProps = {}, duration = detector.hasTouch() ? 300 : 1;
                    if (this.article.css(resetPosition), this.vent.trigger("render:pages"), pageStep > 1 || 0 === pageStep || !prevPage) return this.article.css({
                        left: 1 === currPage ? 0 : -pageWidth + "em",
                        right: "auto"
                    }), this.vent.trigger("unfreeze:page").trigger("scroll:page", 1), void 0;
                    slideProps[isForward ? "left" : "right"] = slideStep, this.article.animate(slideProps, duration, _.bind(function() {
                        this.vent.trigger("scroll:page", 1), this.vent.trigger("horizontal:page:clearPreload", isForward), this[isForward ? "pageNext" : "pagePrev"].removeClass("on"), this.vent.trigger("unfreeze:page")
                    }, this)), this.trigger("page:updated", currPage)
                } else this.win.scrollTop(), this.vent.trigger("render:verticelPages"), this.scrollBody.animate({
                    scrollTop: (currPage - 1) * this.pageHeight + (1 === currPage ? 0 : 80) + "px"
                }, 1 === pageStep ? 400 : 0, $.proxy(function() {
                    this[isForward ? "pageNext" : "pagePrev"].removeClass("on"), this.vent.trigger("unfreeze:page")
                }, this))
            }
        },
        pageTurning: _.debounce(function(e) {
            this.vent.trigger("goto:stamp"), this.hasInputPage = 1;
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
    });
    return Pagination
}), define("reader/modules/prettify", function() {
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
}), define("reader/modules/typesetting", ["jquery", "underscore", "backbone"], function($, _) {
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
}), define("reader/modules/split_code_line", ["jquery", "underscore"], function() {
    var isIE8 = /msie 8/i.test(navigator.userAgent),
        splitCodeLine = function(text) {
            return text
        };
    return isIE8 && (splitCodeLine = function(text) {
        var lines = text.split("\n");
        return '<span class="line">' + lines.join('</span><span class="line">') + "</span>"
    }, splitCodeLine.doSplit = !0), splitCodeLine
}), define("reader/modules/is_mathplayer_installed", function() {
    return function() {
        try {
            return new ActiveXObject("MathPlayer.Factory.1"), !0
        } catch (err) {
            return !1
        }
    }
}), define("reader/modules/paging", ["jquery", "underscore", "reader/app", "reader/modules/typesetting", "reader/modules/is_mathplayer_installed", "reader/modules/split_code_line"], function($, _, app, typesetting, isMPInstalled, splitCodeLine) {
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
}), define("reader/modules/tinytips", ["jquery", "underscore", "backbone", "reader/modules/bubble"], function($, _, Backbone, Bubble) {
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
}), define("reader/modules/split_to_span", ["jquery", "underscore", "reader/modules/typesetting"], function($, _, typesetting) {
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
}), define("reader/views/reading/modules/build_line_info", ["jquery", "underscore"], function($, _) {
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
}), define("reader/views/reading/tips/note_form", ["jquery", "backbone", "underscore", "reader/modules/form_util"], function($, Backbone, _, FormUtil) {
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
}), /*! * zeroclipboard * The Zero Clipboard library provides an easy way to copy text to the clipboard using an invisible Adobe Flash movie, and a JavaScript interface. * Copyright 2012 Jon Rohan, James M. Greene, . * Released under the MIT license * http://jonrohan.github.com/ZeroClipboard/ * v1.1.7 */
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
            var html = ' <object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" id="global-zeroclipboard-flash-bridge" width="100%" height="100%"> <param name="movie" value="' + client.options.moviePath + _noCache(client.options.moviePath) + '"/> <param name="allowScriptAccess" value="' + client.options.allowScriptAccess + '"/> <param name="scale" value="exactfit"/> <param name="loop" value="false"/> <param name="menu" value="false"/> <param name="quality" value="best" /> <param name="bgcolor" value="#ffffff"/> <param name="wmode" value="transparent"/> <param name="flashvars" value="' + _vars(client.options) + '"/> <embed src="' + client.options.moviePath + _noCache(client.options.moviePath) + '" loop="false" menu="false" quality="best" bgcolor="#ffffff" width="100%" height="100%" name="global-zeroclipboard-flash-bridge" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" wmode="transparent" pluginspage="http://www.macromedia.com/go/getflashplayer" flashvars="' + _vars(client.options) + '" scale="exactfit"> </embed> </object>';
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
}(), define("mod/preload", ["jquery"], function($) {
    var preload = function(srcArrayOrSrc) {
        if (srcArrayOrSrc) {
            var srcArray = $.isArray(srcArrayOrSrc) ? srcArrayOrSrc : [srcArrayOrSrc];
            $.each(srcArray, function(index, src) {
                (new Image).src = src
            })
        }
    };
    return preload
}), define("reader/modules/create_zclipboard", ["jquery", "backbone", "underscore", "mod/preload", "lib/ZeroClipboard/ZeroClipboard"], function($, Backbone, _, preload, ZeroClipboard) {
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
}), define("reader/views/reading/tips/mixins/copy_btn", ["jquery", "backbone", "underscore", "reader/modules/create_zclipboard", "reader/modules/toast"], function($, Backbone, _, createZClipboard, Toast) {
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
}), define("reader/views/reading/tips/mixins/form_dialog", ["jquery", "backbone", "underscore", "mod/cursor"], function($, Backbone, _, cursor) {
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
}), define("reader/views/reading/tips/debug_tip", ["jquery", "backbone", "underscore", "reader/modules/toast", "reader/modules/form_util"], function($, Backbone, _, Toast, FormUtil) {
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
}), define("reader/views/reading/tips/btns_tip", ["jquery", "backbone", "underscore", "reader/views/reading/tips/debug_tip", "reader/views/reading/tips/sharing_tip", "reader/views/reading/tips/mixins/form_dialog", "reader/views/reading/tips/mixins/copy_btn"], function($, Backbone, _, DebugForm, SharingForm, FormDialogFunctions, CopyBtnMixin) {
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
}), define("reader/views/reading/tips/underline_btns", ["jquery", "backbone", "underscore", "reader/app", "reader/views/reading/tips/btns_tip", "reader/views/reading/tips/note_form", "reader/modules/open_login_and_signup"], function($, Backbone, _, app, BtnsTip, NoteForm, openLoginAndSignup) {
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
}), define("reader/views/reading/modules/find_span_info", ["jquery"], function($) {
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
}), define("reader/views/reading/mixins/plot_marking", ["jquery", "backbone", "underscore", "reader/app", "reader/views/reading/modules/build_line_info", "reader/views/reading/modules/find_span_info"], function($, Backbone, _, app, buildLineInfoFromPara, findSpanInfo) {
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
}), define("reader/views/reading/marking/underline", ["jquery", "backbone", "underscore", "reader/views/reading/mixins/plot_marking", "reader/views/reading/tips/underline_btns", "reader/modules/open_login_and_signup"], function($, Backbone, _, plotMarking, UnderlineBtns, openLoginAndSignup) {
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
}), define("reader/views/reading/marking/others_underline", ["underscore", "reader/views/reading/marking/underline"], function(_, UnderlineView) {
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
}), define("reader/views/reading/tips/note_display", ["jquery", "backbone", "underscore", "reader/views/reading/tips/sharing_tip", "reader/views/reading/tips/note_form", "reader/views/reading/tips/mixins/form_dialog"], function($, Backbone, _, SharingForm, NoteForm, FormDialogFunctions) {
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
}), define("reader/views/reading/marking/note", ["jquery", "backbone", "underscore", "reader/app", "reader/views/reading/tips/note_display", "reader/views/reading/modules/build_line_info", "reader/views/reading/modules/find_span_info", "reader/views/reading/mixins/plot_marking"], function($, Backbone, _, app, NoteDisplay, buildLineInfoFromPara, findSpanInfo, plotMarking) {
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
}), define("reader/views/reading/marking/selection", ["jquery", "backbone", "underscore", "reader/views/reading/mixins/plot_marking"], function($, Backbone, _, plotMarking) {
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
}), define("reader/views/reading/marking", ["jquery", "backbone", "underscore", "reader/views/reading/marking/underline", "reader/views/reading/marking/selection", "reader/views/reading/marking/note", "reader/views/reading/marking/others_underline"], function($, Backbone, _, UnderlineView, SelectionView, NoteView, OthersUnderlineView) {
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
}), define("reader/views/reading/page_marking_manager", ["jquery", "backbone", "underscore", "reader/app", "reader/views/reading/marking"], function($, Backbone, _, app, MarkingView) {
    var PageMarking = Backbone.View.extend({
        className: "markings-layer",
        initialize: function(options) {
            this.collection = options.collection, this.page = options.page, this.container = options.container, this.markingTips = options.markingTips, this.articleMarkingManager = options.articleMarkingManager, this.listenTo(this.articleMarkingManager, "render:selection", this._renderSelection, this)
        },
        render: function() {
            return this.$el.empty().css({
                top: -app.pageInfo.pageHeight
            }), this._renderMarkings(), this
        },
        _renderSelection: function(model) {
            var el = this._getMarkingView(model);
            this.$el.append(el)
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
            return pageNum >= startPage && endPage >= pageNum ? !0 : !1
        },
        hideAllLines: function() {
            this.$el.addClass("hide-all-lines"), this.$(".highlight").removeClass("highlight")
        },
        showAllLines: function() {
            this.$el.removeClass("hide-all-lines")
        }
    });
    return PageMarking
}), define("reader/views/reading/article_marking_manager", ["jquery", "backbone", "underscore", "reader/app", "reader/views/reading/page_marking_manager"], function($, Backbone, _, app, PageMarkingManager) {
    var ArticleMarking = Backbone.View.extend({
        initialize: function(options) {
            this.collection = options.collection, this.markingTips = options.markingTips, this.pagesManager = options.pagesManager, this.listenTo(this.pagesManager, "page:render", this.createPageMarkingManager, this), this.listenTo(this.pagesManager, "render:selection", function(model) {
                this.trigger("render:selection", model)
            })
        },
        createPageMarkingManager: function(page) {
            if (this.collection) {
                var markingContainer = page.$el,
                    manager = new PageMarkingManager({
                        collection: this.collection,
                        page: page,
                        container: markingContainer,
                        markingTips: this.markingTips,
                        articleMarkingManager: this
                    });
                return markingContainer.append(manager.render().el), manager
            }
        }
    });
    return ArticleMarking
}), define("reader/views/reading/tips/selection_btns", ["jquery", "backbone", "underscore", "reader/modules/toast", "reader/views/reading/tips/btns_tip", "reader/views/reading/tips/note_form"], function($, Backbone, _, Toast, BtnsTip, NoteForm) {
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
}), define("reader/views/reading/modules/find_point", ["jquery", "backbone", "underscore", "reader/views/reading/modules/build_line_info"], function($, Backbone, _, buildLineInfoFromPara) {
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
}), define("reader/models/marking", ["jquery", "backbone", "underscore"], function($, Backbone, _) {
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
}), define("reader/views/reading/selection_manager", ["jquery", "backbone", "underscore", "reader/models/marking", "reader/views/reading/modules/find_point", "reader/views/reading/tips/selection_btns"], function($, Backbone, _, MarkingModel, findPoint, SelectionBtns) {
    var SelectionManager = Backbone.View.extend({
        initialize: function(options) {
            this.pagesManager = options.pagesManager, this.tip = options.pagesManager.markingTips, this.collection = options.collection, this.body = $("body"), this.win = $(window), this.on("clear:selection", this.clearSelection, this), this.on("underline", this.convertToUnderline), this.on("del", this.splitUnderline)
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
            if (!this.model) {
                var pagesManager = this.pagesManager,
                    paragraphsIndex = pagesManager.content.getParasIndexs(),
                    articleId = pagesManager.book.id;
                this.model = new MarkingModel({
                    type: "selection"
                }, {
                    articleId: articleId,
                    paragraphsIndex: paragraphsIndex
                }), this.pagesManager.trigger("render:selection", this.model)
            }
            return this.model.setViaPoints(info.start, info.end)
        },
        convertToNote: function(note) {
            this.model && (this.model.set({
                note: note,
                type: "note"
            }), this.collection.add(this.model), this.resetModel())
        },
        convertToUnderline: function() {
            this.model && (this.model.set({
                type: "underline"
            }), this.collection.add(this.model), this.resetModel())
        },
        unbindAll: function() {
            this.stopListening(), this.undelegateEvents()
        }
    });
    return SelectionManager
}), define("widget/require-cdn", ["jquery", "underscore"], function($, _) {
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
}), define("widget/syntax_highlight", ["jquery", "underscore", "widget/require-cdn"], function($, _, RequireCdn) {
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
}), define("reader/views/reading/page", ["jquery", "backbone", "underscore", "reader/views/reading/modules/build_line_info", "widget/syntax_highlight"], function($, Backbone, _, build_line_info, Highlighter) {
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
}), define("reader/collections/markings", ["backbone", "underscore", "reader/models/marking"], function(Backbone, _, MarkingModel) {
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
}), define("reader/views/reading/pages_container", ["jquery", "backbone", "underscore", "reader/collections/markings", "reader/views/reading/page", "reader/views/reading/selection_manager", "reader/views/reading/article_marking_manager", "reader/views/reading/modules/build_line_info", "reader/modules/tooltip", "reader/modules/split_to_span"], function($, Backbone, _, MarkingsCollection, Page, SelectionManager, ArticleMarkingManager, buildLineInfo, Tooltip, splitToSpan) {
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
            }, this.book.attributes), this.listenTo(this.config, "goto:stamp", this.jumpStamp), Ark.isAnnotationEnabled && this.app.fitForDesktop) {
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
            this.selectionManager && this.selectionManager.unbindAll(), this.selectionManager = new SelectionManager({
                el: this.el,
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
}), define("mod/lang", [], function() {
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
}), define("mod/emitter", ["mod/lang"], function(_) {
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
}), define("ui/overlay", ["jquery", "mod/emitter"], function($, Emitter) {
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
}), define("reader/views/reading/article", ["jquery", "backbone", "underscore", "reader/app", "mod/cookie", "mod/ajax", "ui/overlay", "reader/views/reading/pages_container", "reader/models/article", "reader/modules/tinytips", "reader/modules/storage_manager", "reader/modules/paging", "reader/modules/typesetting", "reader/modules/prettify", "reader/modules/ga"], function($, Backbone, _, app, cookie, ajax, overlay, PagesContainer, Article, TinyTips, storageManager, pagingMaster, typesetting, prettify, ga) {
    var ArticleView = Backbone.View.extend({
        el: ".article",
        initialize: function(app, config, vent) {
            _.bindAll(this, "renderPages", "renderFullPages", "reRenderArticle", "resizeFigures", "pagingDone", "delayResizePage"), this.app = app, this.config = config, this.vent = vent, this.vent.on({
                "render:pages": this.renderPages,
                "render:verticelPages": this.renderFullPages,
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
            this.vent.trigger("finish:paging", data.contents), this._trackGAEvent()
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
                if(typeof resp === 'string'){
                    resp = JSON.parse(resp);
                }
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
                    this.vent.trigger("unfreeze:page")
                }, this)).open(), $(".full-legend").css({
                    width: origWidth + "px"
                }), this.vent.trigger("freeze:page")
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
                    cssContent = " .page { height: pageHeight } .page .bd { height: contentHeight } ".replace("pageHeight", pageHeight).replace("contentHeight", contentHeight),
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
}), define("reader/modules/template", ["underscore"], function(_) {
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
}), define("reader/views/mixins/rating_star", [], function() {
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
}), define("reader/views/reading/rating", ["backbone", "jquery", "reader/views/mixins/rating_star", "reader/modules/template"], function(Backbone, $, StarsMixin, tmpl) {
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
}), define("reader/views/reading/rating_form", ["backbone", "underscore", "jquery", "reader/views/reading/rating", "reader/modules/form_util"], function(Backbone, _, $, RatingView, FormUtil) {
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
}), define("reader/views/reading/panel", ["jquery", "underscore", "backbone", "mod/cookie", "mod/detector", "reader/modules/ga", "reader/modules/bubble", "reader/views/reading/rating_form"], function($, _, Backbone, cookie, detector, ga, Bubble, RatingFormView) {
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
            this.vent.trigger("close:shortcutTips"), this.layoutBtn.toggleClass("vertical", "vertical" === layout)
        },
        hideHelper: function() {
            $("i.tips").remove()
        },
        toggleHelper: function(e) {
            e.preventDefault(), "ontouchstart" in window || this.vent.trigger("toggle:shortcutTips");
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
            this.vent.trigger("close:popups"), $(document).scrollTop(0)
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
}), /*! * iScroll Lite base on iScroll v4.1.6 ~ Copyright (c) 2011 Matteo Spinelli, http://cubiq.org * Released under MIT license, http://cubiq.org/license */
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
}(), define("lib/iscroll-lite", [], function() {}), define("reader/modules/adapter", ["jquery", "mod/detector", "reader/modules/matchMedia", "lib/iscroll-lite"], function($, detector, matchMedia) {
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
                }, cssContent = " .page { width: pageWidth; height: pageHeight } .page .bd { height: contentHeight } .page .hd, .page .ft { width: contentWidth } ".replace("pageWidth", typePageSize.width).replace("pageHeight", typePageSize.height).replace("contentHeight", fillHeight(typePageSize.height) + "em").replace("contentWidth", typePageSize.width);
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
}), define("reader/models/page", ["backbone"], function(Backbone) {
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
}), define("reader/views/reading/canvas", ["jquery", "backbone", "underscore", "reader/app", "mod/key", "mod/detector", "reader/models/page", "reader/modules/adapter", "reader/modules/toast", "reader/views/reading/panel", "reader/views/reading/article", "reader/views/reading/pagination", "reader/views/reading/controls_panel"], function($, Backbone, _, app, Key, detector, PageModel, adapter, Toast, PanelView, ArticleView, Pagination, ControlsPanel) {
    var ReadView = Backbone.View.extend({
        el: "#ark-reader",
        initialize: function() {
            _.bindAll(this, "freezePage", "unfreezePage", "changeLayout"), this.vent = _.extend({}, Backbone.Events), localStorage.pageHeight = 768, localStorage.layout = localStorage.layout || "horizontal", this.config = new PageModel, this.panel = new PanelView(app, this.config, this.vent), this.article = new ArticleView(app, this.config, this.vent), this.pagination = new Pagination(app, this.config, this.vent), this.controlsPanel = new ControlsPanel(app, this.config, this.vent), adapter({
                ebook: {
                    canvas: this,
                    panel: this.panel,
                    article: this.article,
                    pagination: this.pagination,
                    config: this.config
                }
            }), this.win = $(window), this.body = $("body"), this.bindKeyEvents(), this.docElement = $(document.documentElement), this.savingTimer = 0, this.vent.on({
                "freeze:page": this.freezePage,
                "unfreeze:page": this.unfreezePage,
                "scroll:page": this.scrollPage,
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
            return this.articleId = articleId, this.article.render(articleId, onRender), this.panel.render(articleId), this.pagination.render(this.article.articleInner, this.article.book), this.controlsPanel.render(), app.fitForMobile || this.changeLayout(), this
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
            this.key.disable(), this.win.off("scroll"), this.win.off("resize"), this.docElement.removeClass("reading-view"), /msie/i.test(navigator.userAgent) && this.docElement.off(".unselectable"), this.controlsPanel.closeTips(), this.pagination.removeProgressBar(), this.$el.hide(), this.isShown = !1, $(".tips-outer").remove();
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
            this.panel.toggle(), this.panel.hideBubble(), this.controlsPanel.closeTips()
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
                self.controlsPanel.closeTips(), self.controlsPanel.closePopups()
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
}), define("reader/modules/exclusive_set", ["underscore", "backbone"], function(_, Backbone) {
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
}), define("reader/views/library_filter_tabs", ["backbone", "underscore", "reader/modules/exclusive_set"], function(Backbone, _, ES) {
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
}), define("reader/views/navigation", ["backbone"], function(Backbone) {
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
}), define("reader/modules/assert", [], function() {
    return function(predicate, msg) {
        if (!predicate) throw Error(msg)
    }
}), define("reader/modules/stars", ["underscore"], function(_) {
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
}), define("reader/modules/article_presenter", ["reader/modules/stars", "reader/modules/assert", "underscore"], function(stars, assert, _) {
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
}), define("reader/modules/progress_dots", ["underscore", "reader/modules/stars"], function(_, stars) {
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
}), define("reader/views/article_my_work_item", ["underscore", "jquery", "backbone", "reader/modules/stars", "reader/modules/progress_dots", "reader/modules/article_presenter", "reader/modules/template"], function(_, $, Backbone, stars, progressDots, articlePresenter, tmpl) {
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
}), define("ui/dialog_new", ["jquery", "ui/overlay", "mod/emitter"], function($, overlay, Emitter) {
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
}), define("reader/views/article_item", ["jquery", "backbone", "underscore", "reader/modules/stars", "reader/modules/progress_dots", "reader/modules/article_presenter", "reader/modules/template", "ui/dialog_new", "mod/cookie"], function($, Backbone, _, stars, progressDots, articlePresenter, tmpl, dialog, cookie) {
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
}), define("reader/views/article_list", ["backbone", "underscore", "jquery", "reader/views/article_item", "reader/views/article_my_work_item"], function(Backbone, _, $, ArticleItemView, MyWorkItemView) {
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
}), define("reader/views/home", ["underscore", "backbone", "jquery", "reader/app", "mod/detector", "reader/views/article_list", "reader/views/navigation", "reader/views/library_filter_tabs"], function(_, Backbone, $, app, detector, ArticleListView, Navigation, LibraryFilterTabs) {
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
}), define("reader/main", ["jquery", "backbone", "underscore", "reader/app", "reader/views/home", "reader/views/reading/canvas", "reader/collections/articles", "reader/router", "mod/bbsync", "mod/detector", "reader/modules/matchMedia", "reader/modules/storage_manager", "reader/modules/open_login_and_signup", "reader/models/user"], function($, Backbone, _, app, HomeView, ReadView, Articles, Router, BBSync, detector, matchMedia, storageManager, openLoginAndSignup, User) {
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
}), require.config({
    baseUrl: "/js/",
    loader: "lib/oz.js",
    distUrl: "/js/dist/"
}), define("jquery-src", "lib/jquery/jquery.js"), define("underscore-src", "lib/underscore.js"), define("backbone-src", ["jquery-src", "underscore-src"], "lib/backbone/backbone.js"), define("underscore", ["underscore-src"], function() {
    return _
}), define("backbone", ["backbone-src"], function() {
    return Backbone.inhert = Backbone.View.extend, Backbone
}), define("jquery", ["jquery-src"], "reader/lib/jquery.js"), "undefined" != typeof process && define("mathjax", [], function() {}), require(["reader/main"], function(App) {
    App.initialize()
});
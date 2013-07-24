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
})();
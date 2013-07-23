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
})
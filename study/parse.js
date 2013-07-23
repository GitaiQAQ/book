var fs = require('fs');
var rComment = /\/\/[^\n]*\n\s*|\/\*[^\*]*\*\//g;
var rDefine = /define\(\"([^\"]*)\",\s*(\[[^\]]*\]),\s*(function\s*\([^\)]*\)\s*{[\s\S]*\})\s*\)\s*/ig;
// var rDefine = /define\(\"([^\"]*)\"/g;
var sCode = fs.readFileSync('./setup-min.js', {encoding:'utf-8'});
sCode = sCode.replace(rComment, '').replace(/\n/g, '');
console.log(sCode);
fs.writeFile('fd', sCode, {encoding:'utf-8'});
Array.prototype.unique = function(){
    var o = {}, arr = [], that = this;
    for(var i = 0; i < that.length; i++){
        if(!o[that[i]]){
            o[that[i]] = 1;
            arr.push(that[i]);
        }
    }
    return arr;
};
var deps = sCode.match(rDefine).map(function (item, i, array) {
    var ret = item.replace(/define\s*\(\"/g, '').replace(/\"/g,'');
    return ret;
}).unique().sort();

var deps = ['jQuery'];
function writeF (){
    var ss = '';
    var i = 0;
    (function () {
        deps.forEach(function (dep) {
            i = sCode.indexOf(dep);
            function walk () {
                i += 1;
                ss += sCode.charAt(i);
                console.log(ss);
                if( /\[[^\]]*\]/.test(ss) ){
                    ss = '';
                    console.log(/\[[^\]]*\]/.exec(ss)[1]);
                }
            }
            walk();
        })
    })();
}
writeF();
// var ss = '';
// var i = 180000;
// function walk () {
//     if(i > str.length){return};
//     ss += str.charAt(i);
//     i++;
//     if (rDefine.test(ss)){
//         var substr= rDefine.exec(ss);
//         var path = substr[1] || '';
//         var requires = substr[2] || [];
//         var factroy = substr[3] || null;
//         console.log(path);
//         console.log(requires);
//         console.log(factroy);
//         ss = '';
//     }
//     walk ();
// }

// walk();
define(function() {
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
});
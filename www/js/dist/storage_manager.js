define(["jquery", "underscore"], function($, _) {
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
});
define(function() {
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
})
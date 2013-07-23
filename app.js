
/**
 * Module dependencies.
 */

var express = require('express')
  // , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , puer = require('puer')
  // , exec = require('child_process').exec
  , fs = require('fs');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(puer.connect(app, {
    dir: __dirname, //__与命令行不同的是必须输入__
    interval: 500,  // 监听文件的间隔,同上面的 -t --time参数
    ignored: /(\/|^)\..*|node_modules/  //忽略的监听文件，默认忽略dotfile 和 node_modules
}));
app.use(express.static(path.join(__dirname, 'www')));


app.get('/j/articles/bookshelf', function (req, res) {
    fs.readFile(__dirname + '/j/articles/bookshelf.json',
            {encoding : 'utf-8'}, function (err, data) {
        if (err) {
            console.log(err);
        }
        res.end(data);
    });
})

.post('/j/article_v2/get_reader_data', function (req, res) {
    fs.readFile(__dirname + '/j/article_v2/get_reader_data.json', function (err, data) {
        res.end(data);
    });
})

.post('/j/article_v2/need_update', function (req, res) {
    res.end('{"r":1}');
})

.post('/j/article_v2/update_progress', function (req, res) {
    res.end('{"r":0}');
})

.get('/j/article_v2/522219/get_annotations', function (req, res) {
    res.end('[]');
})

.post('/j/currtime', function (req, res) {
    res.end(+new Date + '');
})
;


// development only
if ('development' === app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/');
app.get('/users', user.list);
// app.get('*', function (req, res) {
//     fs.readFile(__dirname + '/www/index.html', {encoding : 'utf-8'}, function(err, data) {
//         var ret = data.toString();
//         console.log(ret);
//         res.end(ret);
//     });
// });

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
    // exec('chrome http://127.0.0.1:' + app.get('port'));
});

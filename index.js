var http = require('http');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var server = http.createServer(app);
var io = require('socket.io')(server);
var compress = require('compression');

var App_version = '1.1.2';

app.use(compress());

var config = require('./config');

if (config.islocal) {
    app.get('/minify', function (req, res) {
        try {
            require('./requires/minify')(req, res);
        } catch (ex) {
            // res.json(ex);
            res.json({ err: 'not found', e: ex });
        }
    });
    var fn_api = require('./backend/functions/');

    app.get('/send-email', function (req, res) {
        fn_api.sendOneEmail({
            to: 'shnura94@mail.ru',
            subject: 'test ' + Date.now(),
            html: 'just testing purpose'
        }, fail => {
            res.json({ reason: fail })
        }, ok => {
            res.json(ok)
        });
    });
}

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
// app.use(express.static(__dirname + '/public',{ maxAge: 31536000000 })); //cache for one year in ms
app.use(express.static(__dirname + '/public')); //cache for one year in ms

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/verify/:email/:key', function (req, res) {
    try {
        require('./backend/database/').api.userActivate({
            email: req.params.email,
            key: req.params.key
        }, fail => {
            res.json({ error: 'cannot verify user', reason: fail });
        }, ok => {
            res.redirect('/');
        });
    } catch (err) {
        console.log(err)
        res.json({ err: 'not found' });
    }
});

app.get('/restore/:email/:key', function (req, res) {
    if(!req.params.key) return res.json({ error: 'you should provide temporal key' });
    try {
        require('./backend/database/').api.restoreemailFindRecent({
            email: req.params.email,
            key: req.params.key
        }, fail => {
            res.json({ error: 'cannot restore access. Wrong data provided' });
        }, ok => {
            res.render('index', { local: config.islocal, version: App_version, restore_data: {
                email: req.params.email,
                key: req.params.key,
            } });
        });
    } catch (err) {
        console.log(err)
        res.json({ err: 'not found' });
    }
});

if (!module.parent) init_app();
function init_app() {
    //////////

    app.use('/d:d', function (req, res) {
        var script = req.params.d;
        script = script.substr(1);
        if (!script.length) {
            res.json({ err: 'not found' });
        }
        try {
            require('./d/' + script)(req, res);
        } catch (ex) {
            // res.json(ex);
            res.json({ err: 'not found' });
        }
    });

    app.get('/signup2', function (req, res) {
        try {
            require('./requires/signup')(req, res);
        } catch (ex) {
            // res.json(ex);
            res.json({ err: 'not found' });
        }
    });

    app.get('*', function (req, res) {
        // res.set("Expires", new Date(Date.now() + 31536000000).toUTCString());// plus 1 year
        res.render('index', { local: config.islocal, version: App_version });
    });

    require('./backend/database')(function (db_api) {
        console.log('db_api ready');
        // initialize socket.io
        require('./backend/socket/index')(io, db_api);
        var port = config.port;
        var host = config.host;

        server.listen(port, host, function () {
            console.log('Server running at http://' + host + ':' + port);
        });

        if (config.islocal) {
            // list of IPs like 192.168.0.102
            require('dns').lookup(require('os').hostname(), function (err, ip, fam) {
                var anotherserver = http.createServer(app);
                var io = require('socket.io')(anotherserver);
                require('./backend/socket/index')(io, db_api);
                var port = 80;
                var host = ip;

                anotherserver.listen(port, host, function () {
                    console.log('Server also running at http://' + host + ':' + port);
                });
            });
        }
    });

    //////////
}


module.exports = function () {
    //////////////

    console.log('start app in worker mode');

    app.get('/restart-17-server-halt', function (req, res) {
        console.log('kill worker process');
        res.writeHead(200);
        res.end('OK');
        process.disconnect();
    });
    app.get('/restart-17-server-redi', function (req, res) {
        console.log('kill worker process');
        res.writeHead(200);
        res.end('<script>setTimeout(function(){location.href = "/";},1500);</script>OK, redirecting...');
        process.disconnect();
    });

    init_app();

    //////////////
}
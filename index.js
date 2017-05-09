import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import compress from 'compression';
import config from './config';

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

// for frontend part
const App_version = '1.1.2';

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(compress());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/verify/:email/:key', function (req, res) {
  try {
    require('./backend/database/').api.userActivate({
      email: req.params.email,
      key: req.params.key
    }, fail => {
      res.json({error: 'cannot verify user', reason: fail});
    }, ok => {
      res.redirect('/');
    });
  } catch (err) {
    console.log(err);
    res.json({err: 'not found'});
  }
});

app.get('/restore/:email/:key', function (req, res) {
  if (!req.params.key) return res.json({error: 'you should provide temporal key'});
  try {
    require('./backend/database/').api.restoreemailFindRecent({
      email: req.params.email,
      key: req.params.key
    }, fail => {
      res.json({error: 'cannot restore access. Wrong data provided'});
    }, ok => {
      res.render('index', {
        local: config.islocal, version: App_version, restore_data: {
          email: req.params.email,
          key: req.params.key,
        }
      });
    });
  } catch (err) {
    console.log(err);
    res.json({err: 'not found'});
  }
});

if (!module.parent) init_app();

function init_app() {
  app.get('*', function (req, res) {
    res.render('index', {local: config.islocal, version: App_version});
  });

  require('./backend/database')(function (db_api) {
    console.log('db_api ready');
    // initialize socket.io
    require('./backend/socket/index')(io, db_api);
    const port = config.port;
    const host = config.host;

    server.listen(port, host, function () {
      console.log('Server running at http://' + host + ':' + port);
    });

    if (config.islocal) {
      // listen on IPs like 192.168.0.102
      const externalIp = require('os').networkInterfaces()['en0'][0].address;
      const externalServer = http.createServer(app);
      const io = require('socket.io')(externalServer);
      require('./backend/socket/index')(io, db_api);

      externalServer.listen(port, externalIp, function () {
        console.log('Server running at http://' + externalIp + ':' + port);
      });
    }
  });
}


module.exports = function () {
  console.log('start app in worker mode');
  init_app();
};
import http from 'http';
import config from './config';

const server = http.createServer();
const io = require('socket.io')(server);
const port = config.port;
const host = config.host;

if (!module.parent) init_server();

function init_server() {
  require('./database')(function (db_api) {
    console.log('Database API ready');
    // initialize socket.io
    require('./socket/index')(io, db_api);

    server.listen(port, host, function () {
      console.log('Server running at http://' + host + ':' + port);
    });

    if (config.isLocal) {
      // listen on IPs like 192.168.0.102
      const externalIp = require('os').networkInterfaces()['en0'][0].address;
      const externalServer = http.createServer();
      const io = require('socket.io')(externalServer);
      require('./socket/index')(io, db_api);

      externalServer.listen(port, externalIp, function () {
        console.log('Server running at http://' + externalIp + ':' + port);
      });
    }
  });
}

module.exports = function () {
  console.log('starting server as a cluster');
  init_server();
};

// TODO because of separation Mexy into backend and frontend parts we need to
// TODO finish registration, verification process
// TODO finish process for resetting password
// TODO again

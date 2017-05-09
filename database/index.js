import mongoose from 'mongoose';
import config from '../config';

const api = {
  models: {}
};

const fn = function (cb) {
  mongoose.connect('mongodb://' + config.db.url + config.db.name);
  const db = mongoose.connection;

  api.mongoose = mongoose;

  const models = [
    'user',
    'registration_email',
    'restore_email',
    'settings',
    'user_data',
    'contact',
    'conversation',
    'message',
  ];

  db.on('error', console.error.bind(console, 'connection error:'));

  db.once('open', function () {
    const total = models.length;
    let ready = 0;
    models.forEach(name => {
      require('./models/' + name)(mongoose, fail => {
        console.log('cannot require DB model', name);
      }, ok => {
        api.models[name] = ok;
        require('./api_for_' + name)(api, fail => {
          //
        }, ok => {
          ready++;
          if (ready == total) {
            cb(api);
          }
        });
      });
    })
  });
};

fn.api = api;

module.exports = fn;
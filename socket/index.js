import jwt from 'jsonwebtoken';
import config from '../config';
import fn_api from '../functions/';
import cryptoHash from '../helpers/crypto-hash';

module.exports = function (io, db_api) {
  io.on('connection', function (socket) {
    if (config.isLocal) socket.emit('app_local_mode');
    socket.on('auth', function (data, fn) {
      if (!fn || !data || !data.token) return;
      const token = data.token;
      jwt.verify(token, config.token_secret, function (err, decoded) {
        if (err) {
          fn({err: 'invalid token'});
        } else {
          const uid = decoded.uid;
          if (!uid) return fn({err: 'invalid token'});

          db_api.userGet(uid, fail => {
            fn({reason: 'user not found in database'});
          }, user => {
            db_api.userUpdateLastv(uid);
            fn_api.onlineUsersAdd({uid: uid}, () => {
            }, () => {
            });
            // set listeners for authorized users
            socket.uid = uid;
            require('./authorized')(socket);
            db_api.getSettings({
              uid: uid
            }, fail => {
              fn({reason: 'cannot get your settings'});
            }, ok => {
              fn({
                0: 1,
                name: user.name,
                id: uid,
                settings: ok
              });
            });
            // notify friends you are online now
            db_api.getMyContactsIds({
              uid: uid
            }, fail => {
            }, arr => {
              arr.forEach(id => {
                socket.to(id).emit('contact_online', {uid: uid});
              });
            });
          });
        }
      });
    })
      .on('signin', function (v, fn) {
        if (!fn || !v || !v.login || !v.pass) return;
        const login = v.login;
        const hashpas = cryptoHash(v.pass + config.server_salt);
        db_api.userSignin({
          login: login,
          password: hashpas
        }, fail => {
          fn({reason: fail});
        }, ok => {
          fn({token: jwt.sign({uid: ok._id}, config.token_secret, {expiresIn: '10d'})});
        });
      })
      .on('restore', function (v, fn) {
        if (!fn || !v || !v.email) return;
        const email = v.email;
        db_api.userFindByEmail(email, fail => {
          fn({reason: fail});
        }, user => {
          const key = f_gen_sid(30);
          db_api.restoreemailSave({
            email: email,
            key: key
          }, fail => {
            fn({reason: fail});
          }, ok => {
            fn_api.sendOneEmail({
              to: email,
              subject: 'restore access',
              data: {
                host: config.host_url,
                key: key,
                email: email,
              },
              template: 'restore_access'
            }, fail => {
              fn({reason: fail});
            }, ok => {
              fn({ok: 1});
            });
          });
        });
      })
      .on('change_pass', function (v, fn) {
        if (!fn || !v || !v.email) return;
        if (!v.key || !v.newpass) return fn({reason: 'wrong data'});
        const email = v.email;
        db_api.userFindByEmail(email, fail => {
          fn({reason: fail});
        }, user => {
          db_api.restoreemailFindRecent({
            email: email,
            key: v.key
          }, empty => {
            fn({reason: 'access denied'});
          }, found => {
            user.password = cryptoHash(v.newpass + config.server_salt);
            user.save(
              (err, ok) => {
                if (err) return cbfail('db error');
                fn({ok: 1});
              }
            );
          });
        });
      })
      .on('signup', function (v, fn) {
        if (!fn || !v) return;
        if (!v.name || !v.email || !v.pass || !v.login) return fn({reason: 'wrong data'});
        const hashpas = cryptoHash(v.pass + config.server_salt);
        db_api.userCreate({
          name: v.name,
          email: v.email,
          login: v.login,
          password: hashpas,
        }, fail => {
          fn({reason: fail})
        }, ok => {
          const key = f_gen_sid(30);
          fn_api.sendOneEmail({
            to: v.email,
            subject: 'registration',
            data: {
              host: config.host_url,
              key: key,
              email: v.email,
            },
            template: 'email_verification'
          }, fail => {
            fn({reason: fail})
          }, ok => {
            db_api.regemailSave({
              email: v.email,
              key: key
            }, fail => {
              fn({reason: fail});
            }, ok => {
              fn({ok: 1});
            });
          });
        });
      })
      .on('disconnect', function () {
        // 'socket disconnected';
        if (socket.uid) {
          db_api.userUpdateLastv(socket.uid);
          fn_api.onlineUsersRemove({
            uid: socket.uid
          }, () => {
          }, (no_sockets_more) => {
            if (!no_sockets_more) return; // there are other connections from my account
            // otherwise, notify friends you are offline now
            db_api.getMyContactsIds({
              uid: socket.uid
            }, fail => {
            }, arr => {
              arr.forEach(id => {
                socket.to(id).emit('contact_offline', {uid: socket.uid});
              });
            });
          });
        }
      });
  });
};

function f_gen_sid(l) {
  if (!l) l = 5;
  const v = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let v2 = '';
  for (let i = 0; i < l; i++) {
    v2 += v[Math.floor(Math.random() * 62)]
  }
  return v2;
}

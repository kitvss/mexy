import config from '../config';

const online = {};

function log(v) {
  if (config.isLocal) console.log(v, online);
}

module.exports = function (mctx, cbfail, cbok) {
  ///////////
  const api = mctx.api;

  api.onlineUsersGet = function (obj, cbfail, cbok) {
    if (!obj || !obj.uid) return cbfail('wrong data');
    online[obj.uid] ?
      cbok(online[obj.uid]) :
      cbfail(false);
  };

  api.onlineUsersGetIntersection = function (obj, cbfail, cbok) {
    // ! no validation for access this data
    if (!obj) return cbfail('wrong data');
    if (!obj.arr) return cbok([]);
    const res = obj.arr.filter(i => {
      return !!online[i]
    });
    cbok(res);
  };

  api.onlineUsersAdd = function (obj, cbfail, cbok) {
    if (!obj || !obj.uid) return cbfail('wrong data');
    let data = online[obj.uid];
    if (!data) {
      data = {
        count: 1
      };
      online[obj.uid] = data;
    } else {
      data.count++;
    }
    log('add');
  };

  api.onlineUsersRemove = function (obj, cbfail, cbok) {
    if (!obj || !obj.uid) return cbfail('wrong data');
    const data = online[obj.uid];
    if (!data) {
      return console.log('strange online users deletion');
    }
    if (data.count == 1) {
      delete online[obj.uid];
      log('delete');
      return cbok(true);
    }
    data.count--;
  };

  cbok();
};
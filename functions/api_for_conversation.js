import {api as db_api} from '../database/index';

const convers = {};

module.exports = function (mctx, cbfail, cbok) {
  const api = mctx.api;

  api.conversIsForMe = function (obj, cbfail, cbok) {
    if (!obj || !obj.uid) return cbfail('wrong data');
    if (!obj.cid) return cbfail('undefined conversation');
    get_converse(obj.cid, fail => {
      cbfail('not found');
    }, users => {
      check_participation(obj.uid, users) ?
        cbok() : // user has access for conversation
        cbfail();
    });
  };

  api.conversGetMyIntl = function (obj, cbfail, cbok) {
    if (!obj || !obj.uid) return cbfail('wrong data');
    if (!obj.cid) return cbfail('undefined conversation');
    get_converse(obj.cid, fail => {
      cbfail('not found');
    }, users => {
      cbok(extractFriend(obj.uid, users));
    });
  };

  cbok();
};

function get_converse(cid, cbfail, cbok) {
  const users = convers[cid];
  if (!users) {
    db_api.conversationSystemGet(cid, fail => {
      cbfail('db error');
    }, doc => {
      convers[doc._id] = doc.users;
      cbok(convers[doc._id]);
    });
  } else {
    cbok(users);
  }
}

function check_participation(uid, pair) {
  return pair.split('_').indexOf(uid) > 0;
}

function extractFriend(my_id, pair) {
  const arr = pair.split('_');
  return my_id == arr[1] ? arr[2] : arr[1];
}


var root_folder = process.cwd(),
    config = require('../../config');
var db_api = require('../database/').api;

var convers = {};

module.exports = function(mctx, cbfail, cbok) {
    ///////////
    var api = mctx.api;

    api.conversIsForMe = function(obj, cbfail, cbok) {
        if (!obj || !obj.uid) return cbfail('wrong data');
        if (!obj.cid) return cbfail('undefined conversation');
        get_converse(obj.cid, fail => {
            cbfail('not found');
        }, users => {
            check_participation(obj.uid, users) ?
                cbok() : // user has access for conversation
                cbfail();
        });
    }

    api.conversGetMyIntl = function(obj, cbfail, cbok) {
        if (!obj || !obj.uid) return cbfail('wrong data');
        if (!obj.cid) return cbfail('undefined conversation');
        get_converse(obj.cid, fail => {
            cbfail('not found');
        }, users => {
            cbok(extractFriend(obj.uid, users));
        });
    }

    cbok();
    ///////////
}

function get_converse(cid, cbfail, cbok) {
    var users = convers[cid];
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
    var arr = pair.split('_');
    return arr.indexOf(uid) > 0;
}

function extractFriend(my_id, pair) {
    var arr = pair.split('_');
    return my_id == arr[1] ? arr[2] : arr[1];
}


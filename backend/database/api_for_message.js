module.exports = function (api, cbfail, cbok) {
    var Message = api.models.message;
    if (!Message) return cbfail();
    var fn_api = require('../functions/');

    function saveMessageStep2(o, cbfail, cbok) {
        if (!o || !o.uid || !o.socket) return cbfail('undefined user');
        if (!o.data || !o.data.length) return cbfail('empty message data');
        if (!o.cid) return cbfail('undefined receiver');
        var data = o.data.substr(0, 500);
        new Message(
            {
                cid: o.cid,
                data: data,
                sender: o.uid,
                viewed: false,
                time: Date.now(),
                deleted_by: []
            }
        )
            .save(
            (err, doc) => {
                if (err) return cbfail('db error');
                var res = { id: doc._id };
                if (o.newms) res.ms = o.newms;
                cbok(res);
                fn_api.conversGetMyIntl({
                    uid: o.uid,
                    cid: o.cid,
                }, fail => { }, intl => {
                    o.socket.to(intl).emit('newm', { cid: o.cid });
                });
            }
            )
    }

    api.messageCreate = function (o, cbfail, cbok) {
        if (!o || !o.uid || !o.socket) return cbfail('undefined user');
        if (!o.data || !o.data.length) return cbfail('empty message data');
        if (!o.cid) return cbfail('undefined receiver');
        fn_api.conversIsForMe({
            uid: o.uid,
            cid: o.cid,
        }, fail => {
            cbfail('you have no permissions');
        }, ok => {
            if (o.after) {
                // search for messages that was potentially inserted between time of loading previous and saving new message
                api.messageSystemLoadAfter({
                    uid: o.uid,
                    cid: o.cid,
                    after: o.after
                }, fail => {
                    cbfail(fail)
                }, docs => {
                    // we have new messages
                    o.newms = docs.map(e => e.toObject());
                    saveMessageStep2(o, cbfail, cbok);
                });
            } else {
                saveMessageStep2(o, cbfail, cbok);
            }
        })
    }

    api.messageSystemLoadAfter = function (o, cbfail, cbok) {
        if (!o || !o.uid || !o.after) return cbfail('wrong data');
        if (!o.cid) return cbfail('undefined conversation');
        var query = { cid: o.cid, _id: { $gt: o.after } };
        Message.find(query, '-deleted_by -__v', { limit: 40, sort: { _id: -1 } }, function (err, docs) {
            if (err) return cbfail(err);
            cbok(docs);
        });
    }

    api.messageLoadLast = function (o, cbfail, cbok) {
        if (!o || !o.uid) return cbfail('wrong data');
        if (!o.cid) return cbfail('undefined conversation');
        fn_api.conversIsForMe({
            uid: o.uid,
            cid: o.cid,
        }, fail => {
            cbfail('you have no permissions');
        }, ok => {
            var query = { cid: o.cid };
            if (o.after) query._id = { $gt: o.after };
            Message.find(query, '-deleted_by -__v', { limit: 40, sort: { _id: -1 } }, function (err, docs) {
                if (err) return cbfail(err);
                cbok(docs);
            });
        });
    }

    api.messageMarkViewed = function (o, cbfail, cbok) {
        if (!o || !o.uid || !o.socket || !o.before) return cbfail('wrong data');
        if (!o.cid) return cbfail('undefined conversation');
        fn_api.conversIsForMe({
            uid: o.uid,
            cid: o.cid,
        }, fail => {
            cbfail('you have no permissions');
        }, ok => {
            var query = { cid: o.cid, viewed: false, sender: { $ne: o.uid }, _id: { $lte: o.before } };
            Message.update(query, { viewed: true }, { multi: true }, function (err, info) {
                if (err) return cbfail(err);
                fn_api.conversGetMyIntl({
                    uid: o.uid,
                    cid: o.cid,
                }, fail => { }, intl => {
                    o.socket.to(intl).emit('viewedm', { cid: o.cid, before: o.before });
                    cbok(info);
                });
            });
        });
    }

    api.messageSystemGetLastOnes = function (o, cbfail, cbok) {
        if (!o || !o.arr) return cbfail('wrong data');
        Message.aggregate([
            { $match: { cid: { $in: o.arr } } },
            { $sort: { time: -1 } },
            {
                $group: {
                    "_id": "$cid",
                    'data': { $first: '$data' },
                    'time': { $first: '$time' },
                    'viewed': { $first: '$viewed' },
                    'sender': { $first: '$sender' },
                }
            },
        ], (err, docs) => {
            if (err) return cbfail('db error');
            cbok(docs);
        })
    }

    cbok();
}
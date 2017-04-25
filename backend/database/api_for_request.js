module.exports = function (api, cbfail, cbok) {
    var Request = api.models.request;
    if (!Request) return cbfail();

    api.createRequest = function (o, cbfail, cbok) {
        if (!o || !o.uid) return cbfail('undefined user');
    }

    api.approveRequest = function (o, cbfail, cbok) {
        if (!o || !o.id) return cbfail('wrong data');
        var query = {
            prop: o.prop,
            uid: o.uid
        };
        var newData = {
            uid: o.uid,
            prop: o.prop,
            val: o.val,
        }
        Request.findOne({ _id: o.id, target: o.uid }, function (err, doc) {
            if (err) return cbfail(err);
            cbok();
        });
    }

    cbok();
}
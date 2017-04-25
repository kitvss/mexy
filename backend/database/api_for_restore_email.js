module.exports = function (api, cbfail, cbok) {
    var Restore_email = api.models.restore_email;
    if (!Restore_email) return cbfail();

    api.restoreemailSave = function (o, cbfail, cbok) {
        if (!o || !o.email || !o.key) return cbfail('wrong data');
        api.restoreemailFindRecent({
            email: o.email
        }, empty => {
            new Restore_email({
                email: o.email,
                key: o.key,
                time: Date.now()
            })
                .save(
                (err, ok) => {
                    if (err) return cbfail('error');
                    cbok(ok._id);
                }
                );
        }, found => {
            cbfail('email sent. Check inbox');
        });
    }

    api.restoreemailFindRecent = function (o, cbfail, cbok) {
        if (!o || !o.email) return cbfail('wrong data');
        var params = {
            time: {
                $gt: Date.now() - 3600000,// 1 hour
            },
            email: o.email
        };
        if (o.key) params.key = o.key;
        Restore_email.findOne(params, (err, ok) => {
            if (err) { console.log(err); return cbfail('error'); }
            if (!ok) return cbfail('not found');
            cbok(ok);
        })
    }

    cbok();
}
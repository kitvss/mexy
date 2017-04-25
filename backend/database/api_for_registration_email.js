module.exports = function (api, cbfail, cbok) {
    var Registration_email = api.models.registration_email;
    if (!Registration_email) return cbfail();

    api.regemailSave = function (o, cbfail, cbok) {
        if (!o || !o.email || !o.key) return cbfail('wrong data');
        new Registration_email({
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
    }

    api.regemailFindRecent = function (o, cbfail, cbok) {
        if (!o || !o.email) return cbfail('wrong data');
        var params = {
            time: {
                $gt: Date.now() - 432000000,// 5 days
            },
            email: o.email
        };
        if (o.key) params.key = o.key;
        Registration_email.findOne(params, (err, ok) => {
            if (err) { console.log(err); return cbfail('error'); }
            if (!ok) return cbfail('not found');
            cbok(ok);
        })
    }

    cbok();
}
module.exports = function (api, cbfail, cbok) {
    var User = api.models.user;
    if (!User) return cbfail();

    api.userUpdateLastv = function (uid) {
        if (!uid) return cbfail('wrong data');
        User.findOneAndUpdate({
            _id: uid,
        }, { last_v: Date.now() }, (err, ok) => {
            if (err) console.log(err);
        });
    }

    api.userSignin = function (o, cbfail, cbok) {
        if (!o || !o.login || !o.password) return cbfail('wrong data');
        User.findOne({
            login_lower: o.login.toLowerCase(),
        }, (err, ok) => {
            // if (err) console.log(err);
            if (err) return cbfail('db error');
            if (!ok) return cbfail('user not found');
            if (!ok.active) return cbfail('user not activated yet');
            if (ok.password != o.password) return cbfail('wrong password');
            cbok(ok);
        });
    }

    api.userActivate = function (o, cbfail, cbok) {
        if (!o || !o.email || !o.key) return cbfail('wrong data');
        api.regemailFindRecent({
            email: o.email,
            key: o.key
        }, fail => {
            console.log(fail)
            cbfail('email not found or expired');
        }, ok => {
            User.findOne({
                email: o.email,
            }, (err, user) => {
                if (err) return cbfail('db error');
                if (!user) return cbfail('user not found');
                if (user.active) return cbfail('user already activated');
                user.active = true;
                user.save(
                    (err, ok) => {
                        if (err) return cbfail('failed to activated, try later');
                        cbok('user activated');
                    }
                )
            });
        });
    }

    api.userCreate = function (o, cbfail, cbok) {
        if (!o || !o.email || !o.login || !o.password || !o.name) return cbfail('wrong data');
        if (o.name.length < 9) return cbfail('wrong name');
        if (!f_email_valid(o.email)) return cbfail('invalid email');
        User.findOne({
            $or: [
                {
                    login_lower: o.login.toLowerCase(),
                },
                {
                    email: o.email
                }
            ]
        }, (err, ok) => {
            if (err) return cbfail('db error');
            if (ok) {
                if (ok.active) return cbfail('user already exist');
                api.regemailFindRecent({
                    email: o.email
                }, empty => {
                    cbfail('you should restore your access');
                }, found => {
                    cbfail('email was sent recently');
                });
                return;
            }
            new User({
                name: o.name,
                email: o.email,
                login: o.login,
                login_lower: o.login.toLowerCase(),
                password: o.password,
                active: false,
                last_v: null,
            })
                .save(
                (err, ok) => {
                    if (err) return cbfail('error');
                    cbok(ok._id);
                }
                );
        });
    }

    api.userGet = function (id, cbfail, cbok) {
        if (!id) return cbfail('wrong data');
        User.findById(
            id
            , (err, ok) => {
                if (err) return cbfail('db error');
                if (!ok) return cbfail('user not found');
                if (!ok.active) return cbfail('user not active');
                cbok(ok);
            });
    }

    api.userFindByEmail = function (email, cbfail, cbok) {
        if (!f_email_valid(email)) return cbfail('wrong data');
        User.findOne(
            {
                email: email
            }
            , (err, ok) => {
                if (err) return cbfail('db error');
                if (!ok) return cbfail('user not found');
                if (!ok.active) return cbfail('user not active');
                cbok(ok);
            });
    }

    api.userGetInfo = function (obj, cbfail, cbok) {
        if (!obj || !obj.uid) return cbfail('wrong data');
        User.findOne(
            {
                _id: obj.uid,
                active: true
            }
            , obj.scope, (err, ok) => {
                if (err) return cbfail('db error');
                if (!ok) return cbfail('user not found');
                cbok(ok);
            });
    }

    api.userGetLots = function (o, cbfail, cbok) {
        if (!o || !o.arr) return cbfail('wrong data');
        User.find(
            {
                _id: { $in: o.arr },
                active: true,
            },
            o.scope || ''
            , (err, ok) => {
                if (err) return cbfail('db error');
                if (!ok) return cbfail('user not found');
                cbok(ok);
            });
    }

    api.userFindByName = function (o, cbfail, cbok) {
        if (!o || !o.name || !o.uid) return cbfail('wrong data');
        if (o.name.length < 3) return cbfail('too short name');
        User.find({ name: new RegExp(o.name, "i"), active: true }, 'name', { limit: 20 }, (err, ok) => {
            if (err) return cbfail('db error');
            if (!ok) return cbfail('users not found');
            var list = {}, arr = [];
            ok = ok.map(u => u.toObject());
            ok.forEach(u => {
                var uid = u._id;
                var pair = api.contactNormalize(o.uid, uid);
                if (!pair) return;
                // create a pair of contacts for next search
                list[pair] = u;
                arr.push(pair)
            });
            if (arr.length) {
                api.contactGetStatuses({
                    uid: o.uid,
                    arr: arr
                }, fail => {
                    cbfail(fail);
                }, contacts => {
                    contacts.forEach(c => {
                        var u = list[c.users];
                        if (!u) return console.log(c.users, 'not found when get statuses');
                        u.status = c.status;
                        u.initiator_me = c.initiator == o.uid;
                    })
                    cbok(ok)
                });
            } else {
                cbok(ok);
            }
        });
    }

    cbok();
}

function f_email_valid(v) {
    var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    var a = false;
    if (re.test(v)) {
        a = true;
    }
    return a;
}

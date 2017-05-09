import fn_api from '../functions';

module.exports = function (api, cbfail, cbok) {
  const Contact = api.models.contact;
  if (!Contact) return cbfail();

  const normalize = api.contactNormalize = function (a, b) {
    if (a == b) return false;
    return a > b ? '_' + b + '_' + a : '_' + a + '_' + b;
  };

  const extractFriend = function (pair, my_id) {
    const arr = pair.split('_');
    return my_id == arr[1] ? arr[2] : arr[1];
  };

  api.contactRequest = function (o, cbfail, cbok) {
    if (!o || !o.uid || !o.target) return cbfail('undefined user');
    const pair = normalize(o.uid, o.target);
    if (!pair) return cbfail('you shall not pass!');
    api.userGet(o.target, fail => {
      cbfail(fail);
    }, target => {
      Contact.findOne({users: pair}, function (err, ok) {
        if (err) return cbfail(err);
        if (ok) return cbfail('user already requested');
        new Contact({
          users: pair,
          initiator: o.uid,
          status: 0
        })
          .save(
            (err, ok) => {
              if (err) return cbfail('error');
              cbok(ok._id);
            }
          );
      });
    });
  };

  api.contactAccept = function (o, cbfail, cbok) {
    if (!o || !o.uid || !o.target) return cbfail('undefined user');
    const pair = normalize(o.uid, o.target);
    if (!pair) return cbfail('you shall not pass!');
    Contact.findOne({users: pair, initiator: o.target, status: 0}, function (err, doc) {
      if (err) return cbfail(err);
      if (!doc) return cbfail('you cannot do this');
      doc.status = 1;
      doc.save(
        (err, ok) => {
          if (err) return cbfail('db error');
          cbok();
        }
      )
    });
  };

  api.getMyContacts = function (o, cbfail, cbok) {
    if (!o || !o.uid) return cbfail('wrong data');
    Contact.find({users: new RegExp('_' + o.uid, "i"), status: 1}, function (err, ok) {
      if (err) return cbfail('error');
      const arr = [];// array of ids of contacts
      if (!ok) return cbok(ok);
      const friends = {};
      ok = ok.map(c => arr.push(extractFriend(c.users, o.uid)));
      api.userGetLots({
        arr: arr,
        scope: 'name last_v'
      }, fail => {
        cbfail(fail);
      }, ok => {
        fn_api.onlineUsersGetIntersection({
          arr: arr
        }, cbfail, online => {
          ok = ok.map(f => {
            f = f.toObject();
            if (online.indexOf(f._id.toString()) > -1) f.online = 1;
            return f;
          });
          cbok(ok);
        });
      })
    });
  };

  api.getMyContactsIds = function (o, cbfail, cbok) {
    if (!o || !o.uid) return cbfail('wrong data');
    Contact.find({users: new RegExp('_' + o.uid, "i"), status: 1}, function (err, ok) {
      if (err) return cbfail('error');
      const arr = [];// array of ids of contacts
      if (!ok) return cbok(ok);
      ok.forEach(c => arr.push(extractFriend(c.users, o.uid)));
      cbok(arr);
    });
  };

  api.contactGetStatuses = function (o, cbfail, cbok) {
    if (!o || !o.uid || !o.arr) return cbfail('wrong data');
    Contact.find({users: {$in: o.arr}}, '-_id', function (err, ok) {
      if (err) return cbfail('error');
      cbok(ok);
    });
  };

  api.contactIsMyFriend = function (o, cbfail, cbok) {
    if (!o || !o.uid || !o.target) return cbfail('wrong data');
    const pair = normalize(o.uid, o.target);
    if (!pair) return cbfail('wrong users');
    Contact.findOne({users: pair}, '-_id', function (err, ok) {
      if (err) return cbfail('error');
      if (!ok) return cbfail('not found');
      if (ok.status == 1) return cbok();
      return cbfail('no permissions');
    });
  };

  cbok();
};
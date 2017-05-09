module.exports = function (api, cbfail, cbok) {
  const UserData = api.models.user_data;
  if (!UserData) return cbfail();

  api.getUserData = function (o, cbfail, cbok) {
    if (!o || !o.uid) return cbfail('undefined user');
    UserData.find({
      uid: o.uid
    }, 'prop val -_id', (err, ok) => {
      if (err) return cbfail('error');
      if (ok) {
        const res = {};
        ok.forEach(s => {
          res[s.prop] = s.val
        });
        cbok(res);
      } else {
        cbok(ok);
      }
    });
  };

  api.getUserDataLots = function (o, cbfail, cbok) {
    if (!o || !o.idarr || !o.propsarr) return cbfail('undefined user');
    UserData.find({
      uid: {$in: o.idarr},
      prop: {$in: o.propsarr}
    }, 'uid prop val -_id', (err, ok) => {
      if (err) return cbfail('error');
      if (ok) {
        const res = {};
        ok.forEach(s => {
          let cur = res[s.uid];
          if (!cur) cur = res[s.uid] = [];
          cur.push({[s.prop]: s.val});
        });
        cbok(res);
      } else {
        cbok(ok);
      }
    });
  };

  api.setUserData = function (o, cbfail, cbok) {
    if (!o || !o.uid || !o.prop || !o.val) return cbfail('wrong data');
    const query = {
      prop: o.prop,
      uid: o.uid
    };
    const newData = {
      uid: o.uid,
      prop: o.prop,
      val: o.val,
    };
    UserData.findOneAndUpdate(query, newData, {upsert: true}, function (err, doc) {
      if (err) return cbfail('db error');
      cbok();
    });
  };

  cbok();
};
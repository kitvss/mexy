module.exports = function (api, cbfail, cbok) {
  const Settings = api.models.settings;
  if (!Settings) return cbfail();

  api.getSettings = function (o, cbfail, cbok) {
    if (!o || !o.uid) return cbfail('undefined user');
    Settings.find({
      uid: o.uid
    }, 'prop val -_id', (err, ok) => {
      if (err) return cbfail('error');
      cbok(ok);
    });
  };

  api.setSettings = function (o, cbfail, cbok) {
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
    Settings.findOneAndUpdate(query, newData, {upsert: true}, function (err, doc) {
      if (err) return cbfail('db error');
      cbok();
    });
  };

  cbok();
};
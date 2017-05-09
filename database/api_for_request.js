module.exports = function (api, cbfail, cbok) {
  const Request = api.models.request;
  if (!Request) return cbfail();

  api.createRequest = function (o, cbfail, cbok) {
    if (!o || !o.uid) return cbfail('undefined user');
  };

  api.approveRequest = function (o, cbfail, cbok) {
    if (!o || !o.id) return cbfail('wrong data');
    Request.findOne({_id: o.id, target: o.uid}, function (err, doc) {
      if (err) return cbfail(err);
      cbok();
    });
  };

  cbok();
};
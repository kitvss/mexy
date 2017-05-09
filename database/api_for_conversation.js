module.exports = function (api, cbfail, cbok) {
  const Conversation = api.models.conversation;
  if (!Conversation) return cbfail();

  api.conversationStart = function (o, cbfail, cbok) {
    if (!o || !o.uid || !o.target) return cbfail('undefined user');
    const pair = api.contactNormalize(o.uid, o.target);
    if (!pair) return cbfail('wrong users');
    api.contactIsMyFriend({
      uid: o.uid,
      target: o.target
    }, fail => {
      cbfail('you are not allowed');
    }, ok => {
      Conversation.findOne({users: pair}, function (err, doc) {
        if (err) return cbfail('db error');
        if (!doc) {
          new Conversation({
            users: pair
          })
            .save(
              (err, doc) => {
                if (err) return cbfail('db error');
                cbok({
                  cid: doc._id,
                  target: o.target
                });
              }
            )
        } else {
          cbok({
            cid: doc._id,
            target: o.target
          });
        }
      });
    });
  };

  api.conversationGet = function (o, cbfail, cbok) {
    if (!o || !o.uid || !o.cid) return cbfail('undefined data');
    Conversation.findById(o.cid, (err, doc) => {
      if (err) return cbfail('db error');
      if (!doc) return cbfail('conversation not found');
      const arr = doc.users.split('_');
      const i = arr.indexOf(o.uid);
      if (i < 0) return cbfail('you have no permissions');
      cbok({
        target: i == 1 ? arr[2] : arr[1]
      })
    })
  };

  api.conversationGetList = function (o, cbfail, cbok) {
    if (!o || !o.uid) return cbfail('undefined data');
    Conversation.find({users: new RegExp(o.uid)}, 'users', (err, doc) => {
      if (err) return cbfail('db error');
      if (!doc) cbok(doc);
      const arr = doc.map(e => e.toObject());
      const res = {};
      const cids = arr.map(e => {
        const cid = e._id.toString();
        res[cid] = e;
        return cid;
      });
      api.messageSystemGetLastOnes({
        arr: cids
      }, fail => {
        cbfail('db error');
      }, ms => {
        const arr = [];
        ms.forEach(m => {
          const cid = m._id;
          const o = res[cid];
          arr.push({
            cid: o._id,
            users: o.users,
            data: m.data,
            time: m.time,
            viewed: m.viewed,
            sender: m.sender,
          })
        });
        cbok(arr);
      })
    })
  };

  api.conversationSystemGet = function (cid, cbfail, cbok) {
    if (!cid) return cbfail('undefined data');
    Conversation.findById(cid, (err, doc) => {
      if (err) return cbfail('db error');
      if (!doc) return cbfail('conversation not found');
      cbok(doc)
    })
  };

  cbok();
};
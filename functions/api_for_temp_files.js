import fs from 'fs';

module.exports = function (mctx, cbfail, cbok) {
  const api = mctx.api;

  api.tempFilesAdd = function (obj, cbfail, cbok) {
    if (!obj || !obj.socket || !obj.loid || !obj.bin) return cbfail('wrong data');
    const name = obj.socket.uid + obj.loid;
    fs.appendFile("tmp/" + name, obj.bin, 'Binary', function (err) {
      if (err) {
        console.log(err);
        return cbfail('err');
      }
      cbok();
    });
  };

  api.tempFilesDelete = function (obj, cbfail, cbok) {
    if (!obj || !obj.socket || !obj.loid) return cbfail('wrong data');
    const name = obj.socket.uid + obj.loid;
    fs.unlink("tmp/" + name);
  };

  cbok();
};
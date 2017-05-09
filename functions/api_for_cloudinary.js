import fs from 'fs';
import config from '../config';
import cloudinary from 'cloudinary';

cloudinary.config(config.cloudinary);

module.exports = function (mctx, cbfail, cbok) {
  const api = mctx.api;

  api.cloudinaryUpload = function (obj, cbfail, cbok) {
    if (!obj || !obj.socket || !obj.loid) return cbfail('wrong data');
    const name = obj.socket.uid + obj.loid;
    cloudinary.uploader.upload('tmp/' + name, function (result) {
      if (result.public_id) {
        cbok(result);
      } else {
        cbfail('error');
      }
      console.log(result);
    });
  };

  cbok();
};
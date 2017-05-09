import ejs from 'ejs';
import fs from 'fs';
import {mailing as config} from '../config';

const transporter = require('nodemailer').createTransport({
  service: config.service,
  auth: {
    user: config.user,
    pass: config.pass
  }
});

module.exports = function (mctx, cbfail, cbok) {
  const api = mctx.api;

  api.sendOneEmail = function (obj, cbfail, cbok) {
    if (!obj.to || !obj.subject) return cbfail('wrong data provided to send an email');
    let html;
    if (obj.data && obj.template) {
      const str = fs.readFileSync('backend/views/email_templates/' + obj.template + '.ejs', 'utf8');
      if (!str) return cbfail('wrong template for email');
      html = ejs.render(str, obj.data);
    } else if (!obj.html) {
      return cbfail('undefined html for email');
    }
    const message = {
      from: obj.from || config.from,
      to: obj.to, // comma separated list
      subject: obj.subject,
      html: html || obj.html
    };
    transporter.sendMail(message, function (error, info) {
      if (error) {
        cbfail(error);
      } else {
        cbok(info);
      }
    });
  };

  cbok();
};
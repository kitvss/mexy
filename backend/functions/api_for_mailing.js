var ejs = require('ejs')
	, fs = require('fs')
	, root_folder = process.cwd();

module.exports = function (mctx, cbfail, cbok) {
	///////////
	var api = mctx.api,
		config = require('../../config').mailing,
		transporter = require('nodemailer').createTransport({
			service: config.service,
			auth: {
				user: config.user,
				pass: config.pass
			}
		});

	api.sendOneEmail = function (obj, cbfail, cbok) {
		if (!obj.to || !obj.subject) return cbfail('wrong data provided to send an email');
		var html;
		if(obj.data && obj.template) {
			var str = fs.readFileSync(root_folder + '/views/email_templates/' + obj.template + '.ejs', 'utf8');
			if(!str) return cbfail('wrong template for email');
			html = ejs.render(str, obj.data);
		} else if (!obj.html) {
			return cbfail('undefined html for email');
		}
		var message;
		message = {
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
	}

	cbok();
	///////////
}
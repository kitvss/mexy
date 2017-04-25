var fs = require('fs')
	, root_folder = process.cwd(),
	config = require('../../config');

module.exports = function (mctx, cbfail, cbok) {
	///////////
	var api = mctx.api;

	api.tempFilesAdd = function (obj, cbfail, cbok) {
		if (!obj || !obj.socket || !obj.loid || !obj.bin) return cbfail('wrong data');
		var name = obj.socket.uid + obj.loid;
		fs.appendFile(root_folder + "/tmp/" + name, obj.bin, 'Binary', function (err) {
			if (err) {
				console.log(err);
				return cbfail('err');
			}
			cbok();
		});
	}

	api.tempFilesDelete = function (obj, cbfail, cbok) {
		if (!obj || !obj.socket || !obj.loid) return cbfail('wrong data');
		var name = obj.socket.uid + obj.loid;
		fs.unlink(root_folder + "/tmp/" + name);
	}

	cbok();
	///////////
}
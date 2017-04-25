var fs = require('fs')
	, root_folder = process.cwd(),
	config = require('../../config'),
	cloudinary = require('cloudinary');

cloudinary.config(config.cloudinary);

module.exports = function (mctx, cbfail, cbok) {
	///////////
	var api = mctx.api;

	api.cloudinaryUpload = function (obj, cbfail, cbok) {
		if (!obj || !obj.socket || !obj.loid) return cbfail('wrong data');
		var name = obj.socket.uid + obj.loid;
		cloudinary.uploader.upload(root_folder + '/tmp/' + name, function(result) {
			if(result.public_id){
				cbok(result);
			} else {
				cbfail('error');
			}
			console.log(result);
		});
	}

	cbok();
	///////////
}
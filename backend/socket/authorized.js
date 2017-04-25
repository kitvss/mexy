module.exports = function (socket) {
	/////////
	var db_api = require('../database/').api;
	var fn_api = require('../functions/');

	socket.join(socket.uid);


	socket
		.on('sq', function (v, fn) {
			if (v.act) switch (v.act) {
				case 'get_data':
					db_api.userGet(
						socket.uid,
						fail => {
							fn({ reason: fail });
						}, user => {
							fn({ user_info: user });
						});
					break;
			}
		})
		.on('get_my_userdata', function () {
			db_api.getUserData({
				uid: socket.uid
			}, fail => {
				socket.emit({reason: fail});
			}, ok => {
				socket.emit('userdata',ok);
			});
		})
		.on('typing', function (v, fn) {
			if (v.uid) socket.to(v.uid).emit('typing', { from: socket.uid });
		})
		.on('im', function (v, fn) {
			if (v.act) switch (v.act) {
				case 'load':
					db_api.messageLoadLast(
						{
							uid: socket.uid,
							cid: v.cid,
							after: v.after,
							scope: 'name -_id'
						},
						fail => {
							fn({ reason: fail });
						}, obj => {
							fn({ ok: obj });
						});
					break;
				case 'save':
					db_api.messageCreate(
						{
							cid: v.cid,
							uid: socket.uid,
							data: v.data,
							after: v.after,
							socket: socket
						},
						fail => {
							fn({ reason: fail });
						}, m => {
							fn({ gid: v.gid, mid: m.id, ms: m.ms });
						});
					break;
				case 'read': // mark messegas as viewed
					db_api.messageMarkViewed(
						{
							cid: v.cid,
							uid: socket.uid,
							before: v.before,
							socket: socket
						},
						fail => {
							fn({ reason: fail });
						}, ok => {
							fn({ ok: 1 });
						});
					break;
			}
		})
		.on('user', function (v, fn) {
			if (v.act) switch (v.act) {
				case 'get_info':
					db_api.userGetInfo(
						{
							uid: v.uid,
							scope: 'name last_v -_id'
						},
						fail => {
							fn({ reason: fail });
						}, obj => {
							fn({ ok: obj });
						});
					break;
				case 'is_online':
					fn_api.onlineUsersGet(
						{
							uid: v.uid,
						},
						fail => {
							fn(0);
						}, obj => {
							fn(1);
						});
					break;
			}
		})
		.on('conv', function (v, fn) {
			if (v.act) switch (v.act) {
				case 'get_list':
					db_api.conversationGetList(
						{
							uid: socket.uid,
						},
						fail => {
							fn({ reason: fail });
						}, obj => {
							fn({ ok: obj });
						});
					break;
				case 'start':
					db_api.conversationStart(
						{
							uid: socket.uid,
							target: v.target
						},
						fail => {
							fn({ reason: fail });
						}, obj => {
							fn({ ok: obj });
						});
					break;
				case 'get':
					db_api.conversationGet(
						{
							uid: socket.uid,
							cid: v.cid
						},
						fail => {
							fn({ reason: fail });
						}, obj => {
							fn({ ok: obj });
						});
					break;
			}
		})
		.on('settings', function (v, fn) {
			if (!v || !fn) return;
			db_api.setSettings({
				uid: socket.uid,
				prop: v.prop,
				val: v.val
			}, fail => {
				fn({ reason: fail })
			}, ok => {
				fn({ ok: 1 })
			});
		})
		.on('search', function (v, fn) {
			if (!v || !fn) return;
			if (v.type == 'people') {
				if (!v.data || !v.data.name) return fn({ reason: 'wrong data' });
				db_api.userFindByName({
					uid: socket.uid,
					name: v.data.name,
				}, fail => {
					fn({ reason: fail })
				}, ok => {
					fn({ ok: ok })
				});
			}
		})
		.on('contact', function (v, fn) {
			if (!v || !fn) return;
			if (v.act == 'show_all') {
				db_api.getMyContacts({
					uid: socket.uid,
				}, fail => {
					fn({ reason: fail })
				}, ok => {
					fn({ arr: ok })
				});
			} else 
			if (v.act == 'show_userdata_lots') {
				db_api.getUserDataLots({
					idarr: v.idarr,
					propsarr: ['crop_photo']
				}, fail => {
					fn({ reason: fail })
				}, ok => {
					fn({ arr: ok })
				});
			} else {
				var method;
				if (v.type == 'request') {
					method = db_api.contactRequest;
				} else if (v.type == 'accept') {
					method = db_api.contactAccept;
				}
				if (!method) return fn({ reason: 'wrong method' });
				if (!v.data || !v.data.target) return fn({ reason: 'wrong data' });
				method({
					uid: socket.uid,
					target: v.data.target,
				}, fail => {
					fn({ reason: fail })
				}, ok => {
					fn({ 0: 1 })
				});
			}
		})
		.on('upload', function (v, fn) {
			if (!v || !fn) return;
			if (!v.bin || !v.loid) return fn({ reason: 'wrong data' });
			fn_api.tempFilesAdd({
				socket: socket,
				loid: v.loid,
				bin: v.bin,
			}, fail => {
				fn({ reason: 'error' });
			}, ok => {
				fn();
			})
		})
		.on('save_photo', function (v, fn) {
			if (!v || !fn) return;
			if (!v.loid) return fn({ reason: 'wrong data' });
			fn_api.cloudinaryUpload({
				socket: socket,
				loid: v.loid,
			}, fail => {
				fn({ reason: 'error' });
				fn_api.tempFilesDelete({
					socket: socket,
					loid: v.loid,
				});
			}, ok => {
				fn_api.tempFilesDelete({
					socket: socket,
					loid: v.loid,
				});
				db_api.setUserData({
					uid: socket.uid,
					prop: 'orig_photo',
					val: 'v' + ok.version + '/' + ok.public_id + '.' + ok.format
				}, fail => {
				}, ok => {
				});
				fn({ ok: 1, url: ok.secure_url, public_id: ok.public_id });
			})
		})
		.on('save_crop_photo', function (v, fn) {
			if (!v || !fn) return;
			if (!v.loid) return fn({ reason: 'wrong data' });
			fn_api.cloudinaryUpload({
				socket: socket,
				loid: v.loid,
			}, fail => {
				fn({ reason: 'error' });
				fn_api.tempFilesDelete({
					socket: socket,
					loid: v.loid,
				});
			}, ok => {
				fn_api.tempFilesDelete({
					socket: socket,
					loid: v.loid,
				});
				db_api.setUserData({
					uid: socket.uid,
					prop: 'crop_photo',
					val: 'v' + ok.version + '/' + ok.public_id + '.' + ok.format
				}, fail => {
				}, ok => {
				});
				fn({ ok: 1, crop_photo: 'v' + ok.version + '/' + ok.public_id + '.' + ok.format });
			})
		})
	/////////
}
var list = f_dc_temp(function () {
	var dc;
	function extractFriend(pair) {
		var arr = pair.split('_');
		return f_my_uid() == arr[1] ? arr[2] : arr[1];
	}

	function draw_conversation(o) {
		var uid = extractFriend(o.users);
		var u = f_known_people(uid);
		if (!u) {
			u = { name: 'loading' };
			f_known_people.load(uid, () => { }, () => {
				u = f_known_people(uid);
				name.t = u.name;
			})
		}
		var name = f_dc_temp({
			eltype: 'span',
			state: {
				text: u.name,
				class: 'message_preview_name'
			}
		});
		var my = o.sender == f_my_uid();
		var data = f_dc_temp({
			eltype: 'span',
			state: {
				class: 'va_middle'
			}
		});
		data.sett = (text) => {
			var shorted = text.substr(0, 90);
			if (shorted.length != text.length) shorted += '...';
			data.t = shorted;
		}
		data.sett(o.data);
		var my_pic = f_dc_temp({
			state: {
				class: 'u_picture_micro va_middle'
			},
			attrs: {
				style: 'margin: 5px;'
			},
			events: {
				u_data() {
					my_picture.set();
				}
			}
		});
		my_pic.set = () => {
			var url = cloudinary(U.userdata.crop_photo);
			if(url) my_pic.el.css({ 'background-image': 'url(' + url + ')' });
		}
		my_pic.set();
		my_pic.visible = () => {
			my?
			my_pic.el.show('inline-block'):
			my_pic.el.hide();
		}
		var dc = f_dc_temp({
			events: {
				click() {
					f_start_conv(uid);
				}
			}
		});
		var photo = f_dc_temp({
			state: {
				class: 'u_picture_mid',
			}
		});
		dc.update = function (_o) {
			u = f_known_people(uid);
			if (u.userdata && u.userdata.crop_photo) photo.el.css({ 'background-image': 'url(' + cloudinary(u.userdata.crop_photo) + ')' })
			if (_o) {
				my = _o.sender == f_my_uid();
				if (!_o.viewed) {
					line.addClass('new_message_line');
				} else {
					line.removeClass('new_message_line');
				}
				data.sett(_o.data);
				my_pic.visible();
			}
		}
		user_data_eventer(uid, dc.update);
		var line = f_dc_temp()
			.parse(`<div class="back_line message_preview_line">{ph}<div class="inlb padl5 va_top">{a}<br />{mp}{b}</div></div>`, {
				ph: photo,
				a: name,
				b: data,
				mp: my_pic
			})
			.insertIn(dc);
		dc.update(o);
		return dc;
	}
	var created = {};
	return {
		initLater() {
			if (!dc) dc = this;
			f_semit('conv', { act: 'get_list' }, res => {
				// console.log(res);
				if (res.ok) {
					var arr = [];
					res.ok.forEach(o => {
						var dc;
						if (created[o.cid]) {
							dc = created[o.cid];
							arr.push(dc);
							return dc.update(o);
						}
						dc = draw_conversation(o);
						created[o.cid] = dc;
						arr.push(dc);
					});
					if (!res.ok.length) arr.push(f_dc_temp({
						state: {
							text: 'you have no conversations yet',
							class: 'center back_line'
						}
					}));
					f_dc_list(dc, arr);
				}
			})
			return dc;
		}
	}
});

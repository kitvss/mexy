var head_intl = f_dc_temp(function () {// render interlocutor in head
	var dcom;
	var ctx = {};
	var interlocutor_uid;
	var picture = ctx.pic = f_dc_temp({
		attrs: {
			class: 'u_picture_mini'
		},
		extend: {
			set: function (a) {
				if(a == 0) return this.el.style.backgroundImage = null;
				this.el.css({ 'background-image': 'url(' + a + ')' });
			}
		}
	});

	var name = ctx.nm = f_dc_temp({
		attrs: {
			class: 'interlocutor_name'
		}
	});
	function update_name(text) {
		name.t = text;
	}

	var online = ctx.on = f_dc_temp({
		attrs: {
			class: 'is_interlocutor_online'
		}
	});

	var timer;
	return {
		state: {
			opened: false
		},
		events: {
			contacts(){
				if(g_chat_active){
					dcom.online();
				}
			}
		},
		extend: {
			hide: function () {
				dcom.el.hide();
				if (timer) {
					clearTimeout(timer);
					timer = 0;
				}
			},
			show: function () {
				dcom.el.show();
			},
			online: function () {
				if (timer) {
					clearTimeout(timer);
					timer = 0;
				}
				var lastv, html, user;
				user = f_known_people(interlocutor_uid);
				if(user && user.online){
					lastv = 'on';
				} else {
					lastv = user.last_v || 0;
					if (lastv && lastv != 'on') lastv = new Date(lastv).getTime();
				}
				if (lastv == 'on') {
					html = 'online';
				} else if (!lastv) {
					html = 'offline';
				} else {
					var time = f_sert();
					lastv = Math.round((time - lastv) / 1000);
					if (lastv < 2) {
						html = 'online';
						timer = setTimeout(dcom.online, 1000);
					} else {
						var t = lastv;
						if (t >= 86400) {
							t = Math.round(t * 10 / 86400) / 10;
							if (t < 100) {
								t += ' d ago';
							} else {
								t = 'offline';
							}
						} else if (t >= 3600) {
							t = Math.round(t * 10 / 3600) / 10;
							t += ' h ago';
							timer = setTimeout(dcom.online, 360000);// every 6 min = 1/10 h
						} else if (t >= 60) {
							t = Math.round(t /= 60);
							t += ' min ago';
							timer = setTimeout(dcom.online, 60000);
						} else {
							t += ' sec ago';
							timer = setTimeout(dcom.online, 1000);
						}
						// html='<span>'+t+'</span>';
						html = t;
					}
				}
				online.t = html;
			},
			draw(uid) {
				if (g_chat_active) {
					if(!uid){
						if(!interlocutor_uid) return console.log('header interlocutor error');
						uid = interlocutor_uid;
					} else {
						interlocutor_uid = uid;
					}
					picture.set(0);
					var intl = f_known_people(uid);
					if (!intl) {
						f_known_people.load(uid, fail => {
							console.log('user not found', uid)
						}, ok => {
							dcom.draw(uid);
						});
						return update_name('loading . . .');
					}
					update_name(intl.name);
					if(intl.userdata && intl.userdata.crop_photo)picture.set(cloudinary(intl.userdata.crop_photo));
					dcom.show();
					dcom.online();
				} else {
					interlocutor_uid = false;
					dcom.hide();
				}
			}
		},
		init: function () {
			dcom = this;
			user_data_eventer.any(function(){
				dcom.draw()
			});
			this
				.parse(
				`<div class="is_online">
					{pic}
					<div class="inlb" style="position:relative;vertical-align: top;">
						{nm}{on}
					</div>
				</div>`, ctx)
				.insertIn(head);
		}
	}
});

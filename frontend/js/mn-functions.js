// DC methods as global functions, for minifiyng effect
function f_dc_forg() {
	return DC.forg.apply(null, arguments);
}
function f_dc_temp() {
	return DC.temp.apply(null, arguments);
}
function f_dc_list(dc, list) {
	dc.DClist(list);
}
function f_dc_emit() {
	return DC.emit.apply(null, arguments);
}
//////////////////
// Socket functions
function f_sq(data, time, fn) {
	var timeisfn = typeof time == 'function' ? 1 : 0;
	var timedelay = typeof time == 'number' ? 1 : 0;
	if (!timeisfn && timedelay) {
		setTimeout(function () {
			fn ? f_semit('sq', data, fn) : f_semit('sq', data);
		}, time);
	} else {
		timeisfn ? f_semit('sq', data, time) : f_semit('sq', data);
	}
}
function f_sc(data, time) {
	if (!data) return;
	if (!data.secret_v) {
		if (!M.secret_v) return;
		data.secret_v = M.secret_v;
	}
	if (time) {
		setTimeout(function () {
			f_semit('sc', data);
		}, time);
	} else {
		f_semit('sc', data);
	}
}
// call fn function if socket 'sq' request was successful, or log response.error
function f_sq_res(v, fn) {
	if (v.err || v.reason) {
		log.is(v.err || v.reason);
	} else
		if (v[0]) {
			fn(v);
		} else {
			log.is(v);
		}
}
function f_semit() {
	if (!connected) return;
	if (!semit_allowed()) return;
	semit_allowed.inc();
	socket.emit.apply(socket, arguments);
}
// for App
function f_App_signin(token) {
	Storage.token = token;
	location.href = '/contacts';
}
function f_App_authorize(token) {
	if (token) {
		f_loadingShow('authorizing...');
		setTimeout(() => {
			f_semit('auth', { token: token }, v => {
				if (v[0] && v.id) {
					Storage.token = token;
					U.authorized = 1;
					U.id = v.id;
					if (v.name) U.name = v.name;
					if (v.settings) {
						var settings = {};
						v.settings.forEach(s => {
							settings[s.prop] = s.val;
						})
						U.settings = settings;
						if (settings.theme) {
							U.css.theme = settings.theme;
							f_change_theme(settings.theme, 1);
						}
					}
					f_socket_authorized();
					f_semit('get_my_userdata');
				} else {
					// 'authorization failed';
					delete Storage.token;
				}
				route_init();
				f_loadingHide();
				DC.emit('u_login');
			});
		});
	} else {
		if (Storage.token) {
			f_App_authorize(Storage.token);
		} else {
			f_loadingShow('processing data...');
			setTimeout(() => {
				route_init();
				f_loadingHide();
				DC.emit('u_login');
			});
		}
	}
}
function f_user_authorized() {
	return U.authorized ? true : false;
}


////////
///////////////////
function f_logLong(v) {
	log.long(v);
}

function f_logIs(v, t) {
	log.is(v, t);
}

function f_change_theme(theme, saved) {
	if (theme) {
		U.css.theme = theme;
	} else if (!U.css.theme) U.css.theme = 'black_white_mn';
	settings_route.theme.set(U.css.theme, saved);
}

function f_email_valid(v) {
	var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
	var a = false;
	if (re.test(v)) {
		a = true;
	}
	return a;
}

//////////////// css functions
function f_pulse_once(dc) {
	dc.removeClass('pulse_once');
	if (dc.pulsetimeout) {
		clearTimeout(dc.pulsetimeout);
		dc.pulsetimeout = 0;
	}
	if (dc.pulsetimeout2) {
		clearTimeout(dc.pulsetimeout2);
		dc.pulsetimeout2 = 0;
	}
	dc.pulsetimeout = setTimeout(function () {
		dc.pulsetimeout = 0;
		dc.addClass('pulse_once');
		dc.pulsetimeout2 = setTimeout(function () {
			dc.removeClass('pulse_once');
		}, g_pulse_css);
	}, 15);
}

function f_appear_once(dc) {
	dc.addClass('appear_once');
}
////////////////////////////



function f_preventDefault(e) {
	if (!e) return;
	e.preventDefault();
}
//////////////////////
function f_loadingShow(a) {
	loading.show(a)
}

function f_loadingHide(a) {
	loading.hide()
}
////////////////////////
function f_window_resize() {
	if (g_chat_active) {
		space.el.css({ 'min-height': '' });
		space.el.css({ 'height': window.innerHeight - 38 });
	} else {
		space.el.css({ 'min-height': window.innerHeight - 38 });
		space.el.css({ 'height': 'auto' });
	}
	menu.position();
}

function f_var_defined(v) {
	return typeof v != 'undefined' ? true : false;
}

function f_clone(obj) {
	if (null == obj || "object" != typeof obj) return obj;
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = f_clone(obj[attr]);
	}
	return copy;
}

function f_sert(s, t) {// syncronize with server time
	if (U.sertd) {
		if (!t) { t = Date.now(); } else {
			if ((t + '').length == 10) t *= 1000;
		}
		var r = t - U.sertd;
		if (s) r = Math.round(r / 1000);// display to seconds, not ms
		return r;
	} else {
		if (t) return t;
		return Date.now();
	}
}

function f_getTime(v) {
	var v2 = new Date(f_sert(0, v));
	var H = '' + v2.getHours();
	if (H.length == 1) H = '0' + H;
	var M = '' + v2.getMinutes();
	if (M.length == 1) M = '0' + M;
	return H + ':' + M;
};

function f_getDate(v) {
	var v2 = new Date(f_sert(0, v));
	var Y = '' + v2.getFullYear();
	Y = Y.substr(2, 3);
	var D = '' + v2.getDate();
	return D + ' ' + f_getMonth(v);
};

function f_getMonth(v) {
	var v = new Date(f_sert(0, v));
	var M = '' + (v.getMonth() + 1);
	switch (M) {
		case "1": M = 'Jan'; break;
		case "2": M = 'Feb'; break;
		case "3": M = 'Mar'; break;
		case "4": M = 'Apr'; break;
		case "5": M = 'May'; break;
		case "6": M = 'Jun'; break;
		case "7": M = 'Jul'; break;
		case "8": M = 'Aug'; break;
		case "9": M = 'Sep'; break;
		case "10": M = 'Oct'; break;
		case "11": M = 'Nov'; break;
		case "12": M = 'Dec'; break;
		default: M = M;
	}
	return M;
};

function f_my_uid(v) {
	var id = U.id;
	if (v) {
		return id == v ? true : false;
	} else {
		return id;
	}
}

var f_ticker_last = function (uid) {
	var timer, user, state;
	function tick() {
		user = f_known_people(uid);
		if (timer) clearTimeout(timer);
		var lastv, html;
		if (user && user.online) {
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
				timer = setTimeout(tick, 1000);
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
					timer = setTimeout(tick, 360000);// every 6 min = 1/10 h
				} else if (t >= 60) {
					t = Math.round(t /= 60);
					t += ' min ago';
					timer = setTimeout(tick, 60000);
				} else {
					t += ' sec ago';
					timer = setTimeout(tick, 1000);
				}
				// html='<span>'+t+'</span>';
				html = t;
			}
		}
		if (html != state) {
			state = html;
			if(state == 'online') {
				dc.addClass('last_v_on');
			} else {
				dc.removeClass('last_v_on');
			}
		}
		dc.t = html;
	}
	var dc = f_dc_temp({
		eltype: 'span',
		state: {class: 'last_v'},
		events: {
			contacts(){
				tick();
			}
		}
	});
	dc.stop = function () {
		if (timer) clearTimeout(timer);
	}
	dc.tick = tick;
	dc.render();
	tick();
	return dc;
};

function f_draw_friend_item(user) {// appears in contacts list and in menu when star friend
	var dc = f_dc_temp();
	var uid = user._id;
	var ctx = {};
	var pic = ctx.pic = f_dc_temp({
		state: {
			class: 'u_picture_mid'
		}
	});
	var html = '<div class="back_line">{pic}</div>';
	if(user.userdata && user.userdata.crop_photo) pic.el.css({"background-image":'url('+cloudinary(user.userdata.crop_photo) + ')'});
	if (user.star) html += '<div class="star_friend"></div>';
	var timer = f_ticker_last(uid);
	dc.timer = ctx.t = timer;
	dc.update = function () {
		user = f_known_people(uid);
		if(user.userdata.crop_photo) pic.el.css({"background-image":'url(' + cloudinary(user.userdata.crop_photo) + ')'});
		timer.tick();
	}
	user_data_eventer(uid, dc.update);
	html += '<div class="inlb" style="vertical-align:top;padding-right: 5px;"><div class="inlb">' + user.name + '</div><div class="inlb padl5">{t}</div><br />';
	var imbt = ctx.bt = f_dc_temp({
		eltype: 'button',
		state: {
			class: 'b',
			text: 'talk'
		},
		events: {
			click: function () {
				f_start_conv(uid);
			}
		}
	});
	html += '{bt}';
	html += '</div></div>';
	return dc.parse(html, ctx);
}

function f_start_conv(uid, history) {
	f_semit('conv', {
		act: 'start',
		target: uid
	}, res => {
		if (res.ok) {
			if (typeof history == 'undefined') route_set_url('/im?cid=' + res.ok.cid);
			chat.start({
				target: uid,
				cid: res.ok.cid
			}, 1);
		}
	});
}

function f_get_conversation_info(cid, cb) {
	if (!cid) return console.log('cid undefined');
	f_semit('conv', {
		act: 'get',
		cid: cid
	}, res => {
		if (res.ok) {
			cb(0, res.ok.target);
		} else {
			cb('error');
		}
	});
}

function f_close_chat_error() {
	f_logLong("You don't have access");
	route_go_pathname();
}

//////////////////// below is previous working

function f_draw_user_opt(obj) {
	var html = '';
	html += '<div class="back_line"><div class="u_picture" style="background-image:url(' + obj.photo + ');"></div>';
	html += '<div class="inlb" style="vertical-align:top;"><div class="inlb">' + obj.name + '</div><br>';
	if (obj.star == null) {
		html += '<button class="b make_star_user_b" uid="' + obj.uid + '">make star</button>';
	} else if (obj.star) {
		html += '<div class="star_friend"></div>';
		html += '<div><button class="b remove_star_user_b" uid="' + obj.uid + '">unstar</button></div>';
	}
	html += '</div></div>';
	return html;
}
function f_draw_picture(obj) {
	var html = '';
	for (var i = 0; i < obj.length; i++) {
		var cur = clone(obj[i]);
		html += '<img class="block_img" file_name="' + cur.fcode + '.' + cur.ftype + '" src="/files/m/' + cur.fcode + '.' + cur.ftype + '">';
	}
	return html;
}
function sc_rec() {// last recieved data from user
	M.last_sc_rec = sert();
}
function f_getCoord(e, c) {
	return /touch/.test(e.type) ? (e.originalEvent || e).changedTouches[0]['client' + c] : e['client' + c];
}
function f_gen_loid(l){
	if(!l)l=3;
	var v='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',v2='';
	for(var i=0;i<3;i++){
		v2+=v[Math.floor(Math.random()*62)]
	}
	return v2;
}
function read_page_url() {
	var reserved_pages = ['contacts', 'settings', 'about', 'sc', 'id'];
	var page = location.pathname.substring(1);
	if (reserved_pages.indexOf(page) > -1) {
		var type = 'page';
		return { page: page, type: type };
	} else if (page.length > 1 && page[0] + page[1] == 'id') {
		var type = 'profile';
		return { page: page, type: type };
	} else {
		return false;
	}
}
function init_page_url() {
	var a = read_page_url();
	if (typeof a == 'object') {
		W.page = a.page;
		W.pagetype = a.type;
	}
}
function arraysEqual(a, b) {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (a.length != b.length) return false;
	for (var i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
function f_youtube_parser(url) {
	var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
	var match = url.match(regExp);
	var embed = (match && match[2].length == 11) ? match[2] : false;
	if (embed) embed = '<div style="text-indent:0;"><iframe class="youtube_v" width="560" height="349" src="https://www.youtube.com/embed/' + embed + '" frameborder="0" allowfullscreen></iframe></div>';
	return embed;
}
function f_process_text(str) {
	str = String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	var youtube = f_youtube_parser(str);
	if (youtube) return youtube;
	str = str.replace(/(https?:\/\/)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig, function (v) {
		var v2 = v;
		if (!/^http/i.test(v)) v = 'http://' + v;
		if (v2.length > 40) v2 = v2.substring(0, 40) + '...';
		return '<a href="' + v + '" target="_blank">' + v2 + '</a>';
	});
	return str;
}
var f_tab_is_active = function () { // return true or false depending on active browser tab now
	var stateKey, eventKey, keys = {
		hidden: "visibilitychange",
		webkitHidden: "webkitvisibilitychange",
		mozHidden: "mozvisibilitychange",
		msHidden: "msvisibilitychange"
	};
	for (stateKey in keys) {
		if (stateKey in document) {
			eventKey = keys[stateKey];
			break;
		}
	}
	return function (c) {
		if (c) document.addEventListener(eventKey, c);
		return !document[stateKey];
	}
} ();
var f_tab_event = function () { // invoked each time when tab state "active" is changing
	var default_title = 'MEXY.PRO',
		timer, icon_number_one,
		title, a;
	var icon = $('#favicon');
	return function () {
		DC.emit('tab_active');
		if (f_tab_is_active()) {
			document.title = default_title;
			if (timer) clearTimeout(timer);
			icon.attr({ 'href': '/img/favicon.png?' });
		} else {
			// if(timer)clearTimeout(timer);
			// setTimeout(f_tab_event,1000);
			if (icon_number_one) {
				a = '2';
				title = 'hey, listen'
			} else {
				a = '';
				title = 'you are not here';
			}
			icon_number_one = !icon_number_one;
			document.title = title;
			icon.attr({ 'href': '/img/favicon_message' + a + '.png?' });
		}
	}
} ();

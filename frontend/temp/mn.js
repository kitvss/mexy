'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

// var global_time = performance.now();
DC.ready(function () {
	'use strict';

	DC.setPseudo(['u_login', 'tab_active', 'contacts', // when contacts changed online status
	'u_data']);

	var U = {}; // for App and user profile settings
	U.authorized = 0;
	U.css = {};
	U.userdata = {};
	var app_local_mode;
	// end part

	var f_known_people = function () {
		var list = {};
		var online = {};
		var friends = {};

		// function update(uid, data){
		//     var u = list[uid];
		//     if(!u) return;
		//     for(var prop in data) {
		//         if(u[prop] != data[prop]) u[prop] = data[prop];
		//     }
		// }

		var fn = function fn(uid, cbfail, cbok) {
			var u = list[uid];
			if (!u) {
				if (!cbfail && !cbok) return false;
				return fn.load(uid, cbfail, cbok);
			}
			u = f_clone(u);
			if (cbfail && cbok) {
				cbok(u);
			} else {
				return u;
			}
		};

		fn.updateData = function (uid, data) {
			var u = list[uid];
			if (!u) return;
			for (var s in data) {
				u.userdata[s] = data[s];
			}user_data_eventer.emit(uid);
		};

		fn.add = function (uid, data) {
			data.online = data.online || online[uid] == 1;
			data.wasOnline = data.online;
			var u = list[uid];
			if (!u) {
				u = list[uid] = data;
			} else {
				for (var v in data) {
					u[v] = data[v];
				}
			}
			if (!u.userdata) u.userdata = {};
			if (data.status == 1) friends[uid] = data;
		};

		fn.load = function (uid, cbfail, cbok) {
			f_semit('user', { act: 'get_info', uid: uid }, function (res) {
				if (res.ok) {
					fn.add(uid, res.ok);
					cbok();
				} else {
					cbfail();
				}
			});
		};

		fn.online = function (uid, _true) {
			online[uid] = _true ? 1 : 0;
			var u = list[uid];
			if (u) {
				u.online = _true == 1;
				if (!u.online && u.online != u.wasOnline) u.last_v = new Date().toISOString();
				u.wasOnline = u.online;
			}
		};

		fn.getFriends = function () {
			return friends;
		};

		fn.isOnline = function (uid) {
			return online[uid] == 1;
		};

		return fn;
	}();

	var Storage = localStorage;
	// route vars
	var g_route_initial = 'contacts';
	var g_route_current;
	// end part

	var LQ = []; // loading queue array
	var mm = {}; // for move objects data
	var curFile = {};

	// socket part
	var authenticated = 0;
	var socket;
	var connected = 0; // socket connected
	var intersen = 0;
	var semit_allowed = function () {
		var i = 0,
		    limit = 170; // allow x requests per 10 second

		function down() {
			i -= limit;
			if (i < 0) i = 0;
		}
		setInterval(down, 10000);
		var fn = function fn() {
			var allow = i < limit;
			if (!allow) console.log('request limit exceeded');
			return allow;
		};
		fn.inc = function () {
			i++;
		};
		return fn;
	}();
	// end part

	// delay part i.e. for socket
	var g_fast_delay = 90;
	var g_500_delay = 500;
	// end part

	// css dependent vars
	var g_pulse_css = 150; // in ms
	// end part

	// chat and secret talks vars
	var g_chat_active;
	var g_secret_active;
	// end part

	// other global vars
	var g_context_opened;
	var g_context_start_point;
	var g_drag_event;
	// end part


	var css_link = f_dc_temp({
		eltype: 'link',
		attrs: {
			rel: 'stylesheet'
		},
		init: function init() {
			this.insertIn('head');
		}
	});

	var space = f_dc_temp({ init: function init() {
			this.insertAs('.body');
		} });
	var bodytag = document.body;

	function clog(v) {
		setTimeout(function () {
			console.log(v);
		}, 10);
	}

	function logr() {
		console.log.apply(console, arguments);
	}

	var cloudinary = function () {
		var prefix = 'https://res.cloudinary.com/mexy-pro/image/upload/';
		var fn = function fn(id) {
			var url = prefix + id;
			return url;
		};
		return fn;
	}();

	var user_data_eventer = function () {
		var users = {},
		    anyuser = [];
		var fn = function fn(uid, f) {
			var a = users[uid];
			if (!a) a = users[uid] = [];
			a.push(f);
		};
		fn.any = function (f) {
			anyuser.push(f);
		};
		fn.emit = function (uid) {
			anyuser.forEach(function (f) {
				return f();
			});
			var a = users[uid];
			if (!a) return;
			a.forEach(function (f) {
				return f();
			});
		};
		return fn;
	}();
	var page_title = f_dc_temp({
		state: {
			class: 'route_title'
		}
	});

	var routes_config;

	function route_read_url_search() {
		var search = location.search.substr(1);
		search = search.split('&');
		var res = {},
		    a;
		search.map(function (v) {
			a = v.split('=');
			if (a.length == 2) res[a[0]] = a[1];
		});
		return res;
	}

	function route_set_url(v) {
		window.history.pushState(null, null, v);
	}

	function route_get() {
		return location.pathname.substr(1);
	}

	function route_go_pathname() {
		route_change(route_get());
	}

	function route_change(v, history) {
		var page;
		if (!g_route_current) g_route_current = v;
		if (typeof history == 'undefined') route_set_url(v);
		logo_canvas.stop();
		if (routes_config.notlast()) {
			page = routes_config(g_route_current);
			if (page && page.onleave) page.onleave();
			g_route_current = v;
			chat.close();
		}
		if (v == '') v = '/';
		if (connected) {
			if (!f_user_authorized()) {
				var route = v;
				space.t = '';
				switch (route) {
					case '/':
						menu.activate(route);
						space.DClist([login_route.init()]);
						break;
					case 'about':
						menu.activate(route);
						space.DClist([about_route.init()]);
						break;
					default:
						route_change('/');
						return;
				}
			} else {
				var route = v;
				if (route == '/') {
					route_change(g_route_initial);return;
				}
				page = routes_config(route);
				if (page) {
					menu.activate(route);
					var content = [];
					var title;
					if (route == 'im') {
						title = page.title();
						if (!g_chat_active) chat.check();
					} else {
						title = page.title;
					}
					if (title) {
						page_title.h = title;
						page_title.el.show();
						content.push(page_title);
					} else {
						page_title.el.hide();
					}
					content.push(page);
					f_dc_list(space, content);
					if (g_chat_active) {
						chat.adapt();
					}
				} else {
					space.t = '';
					log.until('undefined...');
				}
			}
		} else {
			loading.show();
		}
	}

	function route_init() {
		if (!routes_config) {
			routes_config = function () {
				var list = {
					'contacts': contacts_route,
					'im': im_route,
					'sc': sc_route,
					'settings': settings_route,
					'about': about_route
				};
				var fn = function fn(name) {
					var route = list[name];
					if (!route) return false;
					return route.init();
				};
				var last;
				fn.notlast = function () {
					var url = location.href;
					var different = last != url;
					last = url;
					return different;
				};
				fn.notlast();
				return fn;
			}();
		}
		route_change(route_get(), 0);
		menu.init();
		f_change_theme();
	}

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
		} else if (v[0]) {
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
			setTimeout(function () {
				f_semit('auth', { token: token }, function (v) {
					if (v[0] && v.id) {
						Storage.token = token;
						U.authorized = 1;
						U.id = v.id;
						if (v.name) U.name = v.name;
						if (v.settings) {
							var settings = {};
							v.settings.forEach(function (s) {
								settings[s.prop] = s.val;
							});
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
				setTimeout(function () {
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
		loading.show(a);
	}

	function f_loadingHide(a) {
		loading.hide();
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
		if (null == obj || "object" != (typeof obj === 'undefined' ? 'undefined' : _typeof(obj))) return obj;
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = f_clone(obj[attr]);
		}
		return copy;
	}

	function f_sert(s, t) {
		// syncronize with server time
		if (U.sertd) {
			if (!t) {
				t = Date.now();
			} else {
				if ((t + '').length == 10) t *= 1000;
			}
			var r = t - U.sertd;
			if (s) r = Math.round(r / 1000); // display to seconds, not ms
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
			case "1":
				M = 'Jan';break;
			case "2":
				M = 'Feb';break;
			case "3":
				M = 'Mar';break;
			case "4":
				M = 'Apr';break;
			case "5":
				M = 'May';break;
			case "6":
				M = 'Jun';break;
			case "7":
				M = 'Jul';break;
			case "8":
				M = 'Aug';break;
			case "9":
				M = 'Sep';break;
			case "10":
				M = 'Oct';break;
			case "11":
				M = 'Nov';break;
			case "12":
				M = 'Dec';break;
			default:
				M = M;
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

	var f_ticker_last = function f_ticker_last(uid) {
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
						timer = setTimeout(tick, 360000); // every 6 min = 1/10 h
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
				if (state == 'online') {
					dc.addClass('last_v_on');
				} else {
					dc.removeClass('last_v_on');
				}
			}
			dc.t = html;
		}
		var dc = f_dc_temp({
			eltype: 'span',
			state: { class: 'last_v' },
			events: {
				contacts: function contacts() {
					tick();
				}
			}
		});
		dc.stop = function () {
			if (timer) clearTimeout(timer);
		};
		dc.tick = tick;
		dc.render();
		tick();
		return dc;
	};

	function f_draw_friend_item(user) {
		// appears in contacts list and in menu when star friend
		var dc = f_dc_temp();
		var uid = user._id;
		var ctx = {};
		var pic = ctx.pic = f_dc_temp({
			state: {
				class: 'u_picture_mid'
			}
		});
		var html = '<div class="back_line">{pic}</div>';
		if (user.userdata && user.userdata.crop_photo) pic.el.css({ "background-image": 'url(' + cloudinary(user.userdata.crop_photo) + ')' });
		if (user.star) html += '<div class="star_friend"></div>';
		var timer = f_ticker_last(uid);
		dc.timer = ctx.t = timer;
		dc.update = function () {
			user = f_known_people(uid);
			if (user.userdata.crop_photo) pic.el.css({ "background-image": 'url(' + cloudinary(user.userdata.crop_photo) + ')' });
			timer.tick();
		};
		user_data_eventer(uid, dc.update);
		html += '<div class="inlb" style="vertical-align:top;padding-right: 5px;"><div class="inlb">' + user.name + '</div><div class="inlb padl5">{t}</div><br />';
		var imbt = ctx.bt = f_dc_temp({
			eltype: 'button',
			state: {
				class: 'b',
				text: 'talk'
			},
			events: {
				click: function click() {
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
		}, function (res) {
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
		}, function (res) {
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
	function sc_rec() {
		// last recieved data from user
		M.last_sc_rec = sert();
	}
	function f_getCoord(e, c) {
		return (/touch/.test(e.type) ? (e.originalEvent || e).changedTouches[0]['client' + c] : e['client' + c]
		);
	}
	function f_gen_loid(l) {
		if (!l) l = 3;
		var v = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
		    v2 = '';
		for (var i = 0; i < 3; i++) {
			v2 += v[Math.floor(Math.random() * 62)];
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
		if ((typeof a === 'undefined' ? 'undefined' : _typeof(a)) == 'object') {
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
		var embed = match && match[2].length == 11 ? match[2] : false;
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
	var f_tab_is_active = function () {
		// return true or false depending on active browser tab now
		var stateKey,
		    eventKey,
		    keys = {
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
		};
	}();
	var f_tab_event = function () {
		// invoked each time when tab state "active" is changing
		var default_title = 'MEXY.PRO',
		    timer,
		    icon_number_one,
		    title,
		    a;
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
					title = 'hey, listen';
				} else {
					a = '';
					title = 'you are not here';
				}
				icon_number_one = !icon_number_one;
				document.title = title;
				icon.attr({ 'href': '/img/favicon_message' + a + '.png?' });
			}
		};
	}();

	var loading = f_dc_temp(function () {
		var loading_back = f_dc_temp({
			init: function init() {
				this.insertAs('#loading_back');
			}
		});
		var dc;
		var loading_animation = f_dc_temp({
			attrs: {
				style: 'background: none;',
				class: 'loading_div'
			}
		});
		var span1 = f_dc_temp({
			eltype: 'span',
			state: {
				class: 'loading_ball'
			}
		});
		var span2 = f_dc_temp({
			eltype: 'span'
		});
		var loading_text = f_dc_temp({
			attrs: {
				class: 'loading_text'
			}
		});
		return {
			extend: {
				hide: function hide() {
					this.el.hide();
					loading_back.el.hide();
					this.busy = false;
					loading_animation.clearIntervals();
				},
				show: function show(text) {
					if (text) {
						loading_text.el.show();
						loading_text.t = text;
					} else {
						loading_text.el.hide();
					}
					this.el.show();
					loading_back.el.show();
					if (this.busy) return;
					this.busy = true;
				},
				busy: true
			},
			init: function init() {
				dc = this;
				this.insertAs('#loading').t = '';
				loading_animation.DClist([span1, span2]);
				loading_animation.insertIn(dc);
				loading_text.insertIn(dc);
			}
		};
	});

	var logo_canvas = f_dc_temp(function () {
		var running = 1;
		var canvas_parent = f_dc_temp();
		var algorithm = function () {
			'use strict';

			var canvas_dc = f_dc_temp({
				eltype: 'canvas',
				attrs: {
					style: 'top:0;left:0;'
				}
			});
			var image_size = 200;
			var image = new Image(image_size, image_size);
			image.src = '/img/logo.png';
			var image_ready = 0;
			image.onload = function () {
				image_ready = 1;
			};
			canvas_dc.insertIn(canvas_parent);
			canvas_parent.el.css({ margin: '0 auto', overflow: 'hidden', position: 'relative' });
			var canvas = canvas_dc.el;
			var ctx = canvas.getContext("2d");
			var cs = [],
			    c,
			    m = { ci: 0, all: [], length: 21, size: 4 },
			    gi = 0;
			var pulses = { all: [], now: 0, max: m.size * 3 };
			var timeout = 0;
			function new_pulse(a) {
				var c = {
					cx: a.cx,
					cy: a.cy,
					r: a.r,
					min: 1,
					max: a.max || 1.2,
					s: 1,
					sk: a.sk || .01
				};
				pulses.all[pulses.now] = c;
				pulses.now++;
				if (pulses.now >= pulses.max) pulses.now = 0;
			}
			function draw_pulses() {
				var c, a;
				ctx.save();
				ctx.lineWidth = 1;
				for (var i = 0; i < pulses.all.length; i++) {
					c = pulses.all[i];
					if (!c) continue;
					ctx.beginPath();
					ctx.arc(c.cx, c.cy, c.r * c.s, 0, PI2);
					a = 1 - (c.s - c.min) / (c.max - c.min);
					ctx.strokeStyle = 'rgba(70,70,70,' + a + ')';
					ctx.stroke();
					c.s += c.sk;
					if (c.s > c.max) pulses.all[i] = false;
				}
				ctx.restore();
			}
			var degk = 180 / Math.PI;
			var angle180 = 180 / degk;
			var PI2 = Math.PI * 2;
			function genSegmentPath(x, y, x2, y2, r1, r2) {
				var dx = x2 - x;
				var dy = y2 - y;

				var angle = Math.atan2(dx, dy);

				ctx.beginPath();

				var rotation = angle180 - angle;

				ctx.arc(x, y, r1, rotation, Math.PI + rotation);

				ctx.arc(x2, y2, r2, -angle, Math.PI - angle);

				ctx.closePath();
			}
			var clockspeed = 17;
			var prev_size_width;
			function move2() {
				if (!running) return;
				var size = canvas_parent.el.crec(),
				    ww = size.width,
				    wh = ww; //size.height;
				if (window.innerHeight < ww) ww = wh = window.innerHeight;
				if (!wh) {
					move2_again();
					return;
				}
				var x,
				    y,
				    a,
				    a2,
				    a3,
				    b,
				    last,
				    curli,
				    w,
				    h,
				    s,
				    s2,
				    shift,
				    deg,
				    x1,
				    x2,
				    y1,
				    y2,
				    left,
				    top,
				    mar,
				    tar,
				    r = ww > wh ? wh / 2.75 : ww / 2.75,
				    k = r * .0015,
				    maxm = r / 5,
				    // max coordinate translation
				ci = m.ci,
				    length = m.length;
				// if(ww>wh){
				// 	ww=wh;
				// }else if(wh>ww){
				// 	wh=ww;
				// }
				var cx = ww / 2,
				    cy = wh / 2;
				// fit canvas to window size with autoscaling for HDPI
				var devicePixelRatio = window.devicePixelRatio || 1,
				    backingStoreRatio = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1,
				    ratio = devicePixelRatio / backingStoreRatio;
				if (devicePixelRatio !== backingStoreRatio) {

					var oldWidth = ww;
					var oldHeight = wh;

					canvas.width = oldWidth * ratio;
					canvas.height = oldHeight * ratio;

					canvas.style.width = oldWidth + 'px';
					canvas.style.height = oldHeight + 'px';

					ctx.scale(ratio, ratio);
				} else {
					canvas.width = ww;
					canvas.height = wh;
				}
				if (prev_size_width != canvas.width) {
					prev_size_width = canvas.width;
				}
				ctx.beginPath();
				ctx.arc(cx, cy, r, 0, PI2);
				ctx.fillStyle = 'rgba(255, 255, 255,.75)';
				ctx.fill();
				if (image_ready) {
					a = image_size;
					if (a > ww / 2) a = ww / 2;
					ctx.drawImage(image, cx - a / 2, cy - a / 2, a, a);
				}
				draw_pulses();
				for (var li = 0; li < m.size; li++) {
					if (!m.all[li]) {
						m.all[li] = { arr: [], last: false };
					}
					curli = m.all[li];
					mar = curli.arr;
					last = curli.last;
					if (!last) {
						curli.last = last = {
							vr: 100,
							imin: 5,
							imax: 15
						};
						last.vx = randix(-last.vr, last.vr) / last.vr + .1;
						last.vy = randix(-last.vr, last.vr) / last.vr + .1;
						last.x = randi(0, ww);
						last.y = randi(0, wh);
						// last.x=cx;
						// last.y=cy;
						last.i = randi(last.imin, last.imax);
					}
					last.sx = randi(maxm / 10, maxm);
					last.sy = randi(maxm / 10, maxm);
					a = {
						x: last.vx * last.sx,
						y: last.vy * last.sy
					};
					x = last.x + a.x;
					y = last.y + a.y;
					// in boundaries of circle
					if (Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) > r) {
						a = { x: x - cx, y: cy - y };
						a.a2 = Math.atan2(a.x, a.y);
						x = cx + r * Math.cos(a.a2 - Math.PI / 2);
						y = cy + r * Math.sin(a.a2 - Math.PI / 2);
						last.vx = -last.vx;
						last.vy = -last.vy;
						a = r / 50;
						new_pulse({ r: a, cx: x, cy: y, max: a * 3, sk: a / 10 });
						// new_pulse({r:r,cx:cx,cy:cy});
					}
					last.x = x;
					last.y = y;
					last.i--;
					if (last.i < last.imin) {
						last.vx = randix(-last.vr, last.vr) / last.vr + .1;
						last.vy = randix(-last.vr, last.vr) / last.vr + .1;
						last.i = randi(last.imin, last.imax);
					}
					mar[m.ci] = {
						x: x,
						y: y
					};
					a3 = [];
					if (mar.length > 1) {
						tar = [];
						for (var i = ci; i >= 0; i--) {
							tar.push(mar[i]);
							a3.push([i, mar[i].x]);
							if (i == 0) {
								i = mar.length;
							} else {
								if (i == mar.length) i = -1;
							}
							if (tar.length >= mar.length) i = -1;
						}
					} else {
						tar = mar;
					}
					ctx.lineCap = 'round';
					ctx.lineWidth = 5;
					for (var _i = 0; _i < length; _i++) {
						c = cs[_i];
						s = tar[_i];
						s2 = tar[_i + 1];
						if (s2) {
							if (li == 0) {
								ctx.fillStyle = 'rgba(0, 0, 0, ' + (1 - _i / length) + ')';
							} else if (li == 1) {
								ctx.fillStyle = 'rgba(235, 0, 0, ' + (1 - _i / length) + ')';
							} else if (li == 2) {
								ctx.fillStyle = 'rgba(15, 135, 235, ' + (1 - _i / length) + ')';
							} else if (li == 3) {
								ctx.fillStyle = 'rgba(100, 100, 250, ' + (1 - _i / length) + ')';
							}
							var _r = _i * k;
							if (_r < 1) _r = 1;
							genSegmentPath(s.x, s.y, s2.x, s2.y, _r, _r);
							ctx.fill();
						}
					}
				}
				m.ci++;
				if (m.ci == length) m.ci = 0;
				move2_again();
			}
			function move2_again() {
				if (timeout) clearTimeout(timeout);
				timeout = setTimeout(move2, clockspeed);
			}
			function randi(min, max) {
				return Math.floor(Math.random() * (max + 1 - min)) + min;
			}
			function randix(min, max) {
				var type = randi(0, 1);
				if (type) {
					var r = randi(1, max);
				} else {
					var r = randi(min, -1);
				}
				return r;
			}
			return {
				run: function run() {
					running = 1;
					move2();
				},
				stop: function stop() {
					running = 0;
				}
			};
		}();
		return {
			extend: {
				run: function run(dc, opts) {
					if (dc) canvas_parent.insertIn(dc);
					algorithm.run();
					if (!opts) opts = {};
					var sz = opts.sz;
					if (!sz) sz = 500;
					canvas_parent.el.css({ 'max-width': sz });
				},
				stop: function stop() {
					if (!running) return;
					algorithm.stop();
				}
			},
			init: function init() {
				this.el = canvas_parent.el;
			}
		};
	});

	var head = f_dc_temp({
		init: function init() {
			this.insertIn('.head');
		}
	});

	var head_intl = f_dc_temp(function () {
		// render interlocutor in head
		var dcom;
		var ctx = {};
		var interlocutor_uid;
		var picture = ctx.pic = f_dc_temp({
			attrs: {
				class: 'u_picture_mini'
			},
			extend: {
				set: function set(a) {
					if (a == 0) return this.el.style.backgroundImage = null;
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

		var _online = ctx.on = f_dc_temp({
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
				contacts: function contacts() {
					if (g_chat_active) {
						dcom.online();
					}
				}
			},
			extend: {
				hide: function hide() {
					dcom.el.hide();
					if (timer) {
						clearTimeout(timer);
						timer = 0;
					}
				},
				show: function show() {
					dcom.el.show();
				},
				online: function online() {
					if (timer) {
						clearTimeout(timer);
						timer = 0;
					}
					var lastv, html, user;
					user = f_known_people(interlocutor_uid);
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
								timer = setTimeout(dcom.online, 360000); // every 6 min = 1/10 h
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
					_online.t = html;
				},
				draw: function draw(uid) {
					if (g_chat_active) {
						if (!uid) {
							if (!interlocutor_uid) return console.log('header interlocutor error');
							uid = interlocutor_uid;
						} else {
							interlocutor_uid = uid;
						}
						picture.set(0);
						var intl = f_known_people(uid);
						if (!intl) {
							f_known_people.load(uid, function (fail) {
								console.log('user not found', uid);
							}, function (ok) {
								dcom.draw(uid);
							});
							return update_name('loading . . .');
						}
						update_name(intl.name);
						if (intl.userdata && intl.userdata.crop_photo) picture.set(cloudinary(intl.userdata.crop_photo));
						dcom.show();
						dcom.online();
					} else {
						interlocutor_uid = false;
						dcom.hide();
					}
				}
			},
			init: function init() {
				dcom = this;
				user_data_eventer.any(function () {
					dcom.draw();
				});
				this.parse('<div class="is_online">\n\t\t\t\t\t{pic}\n\t\t\t\t\t<div class="inlb" style="position:relative;vertical-align: top;">\n\t\t\t\t\t\t{nm}{on}\n\t\t\t\t\t</div>\n\t\t\t\t</div>', ctx).insertIn(head);
			}
		};
	});

	var logout = f_dc_temp(function () {
		var self;
		return {
			getSelf: function getSelf(a) {
				self = a;
			},
			eltype: 'a',
			state: {
				class: 'b',
				text: 'logout'
			},
			attrs: {
				href: '/logout',
				id: 'logout'
			},
			events: {
				click: function click(e) {

					socket.disconnect();
					delete Storage.token;
					Storage.clear();
					location.href = '/';
				}
			}
		};
	});

	var menu = f_dc_temp(function () {
		var dcom;
		var ctx = {};
		var m_back,
		    content,
		    friends,
		    active_page,
		    pages = [],
		    my_picture,
		    my_name;
		m_back = f_dc_temp({
			events: {
				click: function click() {
					menu.close();
				}
			},
			init: function init() {
				this.insertIn(bodytag).el.attr({ id: 'm_back' });
			}
		});
		friends = ctx.friends = f_dc_temp();
		function menu_item(a) {
			return f_dc_temp(function () {
				var self;
				return {
					getSelf: function getSelf(a) {
						self = a;
					},

					eltype: 'a',
					state: {
						class: 'back_line menu_a',
						page: a.p,
						text: a.t ? a.t : a.p
					},
					attrs: {
						href: '/' + a.p
					},
					extend: {
						here: function here() {
							if (active_page) active_page.removeClass('here');
							self.addClass('here');
							active_page = self;
							dcom.close();
						}
					},
					events: {
						click: function click(e) {
							f_preventDefault(e);
							route_change(self.state.page);
							self.here();
						}
					}
				};
			});
		}
		pages.push(ctx.ac = menu_item({ p: 'contacts', t: 'all contacts' }));
		pages.push(ctx.im = menu_item({ p: 'im' }));
		pages.push(ctx.sc = menu_item({ p: 'sc', t: 'secret talks' }));
		pages.push(ctx.st = menu_item({ p: 'settings' }));
		pages.push(ctx.ab = menu_item({ p: 'about' }));
		pages.push(ctx.lg = menu_item({ p: '/', t: 'login' }));
		pages.push(ctx.la = logout);
		my_picture = ctx.mp = f_dc_temp({
			attrs: {
				class: 'u_picture'
			},
			extend: {
				set: function set(a) {
					this.el.css({ 'background-image': 'url(' + a + ')' });
				}
			},
			events: {
				u_data: function u_data() {
					if (U.userdata.crop_photo) {
						var url = cloudinary(U.userdata.crop_photo);
						my_picture.set(url);
					}
				}
			}
		});
		my_name = ctx.mnm = f_dc_temp({
			attrs: {
				class: 'inlb'
			},
			extend: {
				set: function set(a) {
					this.t = a;
				}
			}
		});
		var last_user_state;
		var menu_items = f_dc_temp(function () {
			var position;
			return {
				extend: {
					set: function set(where) {
						if (position != where) {
							if (where == 'bottom') {
								menu_items.el.css({ bottom: 0, top: 'auto' });
							} else {
								menu_items.el.css({ bottom: 'auto', top: 0 });
							}
							position = where;
						}
					}
				},
				initLater: function initLater() {
					if (last_user_state == f_user_authorized()) return;
					last_user_state = f_user_authorized();
					f_dc_list(content, []);
					if (last_user_state) {
						this.parse('\n\t\t\t\t\t\t<div class="menu-items">\n\t\t\t\t\t\t\t<div class="center" id="my_back_line">\n\t\t\t\t\t\t\t\t{mp}\n\t\t\t\t\t\t\t\t<div class="inlb" style="vertical-align:top;">\n\t\t\t\t\t\t\t\t\t{mnm}<br />\n\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t{ac}\n\t\t\t\t\t\t\t{im}\n\t\t\t\t\t\t\t{sc}\n\t\t\t\t\t\t\t{friends}\n\t\t\t\t\t\t\t{st}\n\t\t\t\t\t\t\t{ab}\n\t\t\t\t\t\t\t<div class="back_line center" style="padding: 5px 0;margin-top: 15px;">{la}</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t', ctx).insertIn(content);
					} else {
						this.parse('\n\t\t\t\t\t\t<div class="menu-items">\n\t\t\t\t\t\t\t{lg}\n\t\t\t\t\t\t\t{ab}\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t', ctx).insertIn(content);
					}
					dcom.position();
				}
			};
		});
		content = f_dc_temp({
			state: {
				class: 'menu'
			}
		}).insertIn(bodytag);
		var opened = false;
		return {
			state: {
				class: 'menu_b',
				html: '<div class="menu_lines" style="margin-top:10px;"></div><div class="menu_lines"></div><div class="menu_lines"></div><div class="menu_notify"></div>'
			},
			events: {
				click: function click() {
					dcom.open('top');
				},
				u_login: function u_login() {
					f_user_authorized() ? my_name.set(U.name) : my_name.set('');
				}
			},
			extend: {
				open: function open(position) {
					menu_items.set(position);
					opened = true;
					m_back.addClass('m_back_show');
					content.addClass('menu_opened');
				},
				close: function close() {
					opened = false;
					m_back.removeClass('m_back_show');
					content.removeClass('menu_opened');
				},
				toggle: function toggle(position) {
					opened ? dcom.close() : dcom.open(position);
				},
				friends: function friends() {
					// ctx.friends.change({html:'hmmm'});
				},
				position: function position() {
					var body = space.el.crec();
					var el = content.el;
					var m = el.crec();
					var ww = window.innerWidth;
					if (ww > body.width + 2 * m.width) {
						el.css({ right: body.right - body.width - m.width });
					} else {
						el.css({ right: 0 });
					}
				},
				activate: function activate(v) {
					pages.find(function (a) {
						if (a.state.page == v) {
							a.here();
							return;
						}
					});
				},
				set_my_pic: function set_my_pic(a) {
					my_picture.set(a);
				}
			},
			init: function init() {
				dcom = this;
				this.insertIn(head);
				menu_items.init();
				if (f_user_authorized()) dcom.friends();
			}
		};
	});

	var context = f_dc_temp(function () {
		var timer;
		var dcom = f_dc_temp({
			state: {
				class: 'contextmenu',
				html: '\n\t\t\t<div class="div">\n\t\t\t\t<div class="link">text</div>\n\t\t\t\t<div class="link">app</div>\n\t\t\t\t<div class="link">text</div>\n\t\t\t</div>\n\t\t\t<div class="div">\n\t\t\t\t<div class="link">app</div>\n\t\t\t\t<div class="link">access</div>\n\t\t\t\t<div class="link">app</div>\n\t\t\t</div>\n\t\t\t<br>\n\t\t\t<div class="div2">\n\t\t\t\t<div class="link">link</div>\n\t\t\t\t<div class="link">option</div>\n\t\t\t\t<div class="link">one more</div>\n\t\t\t</div>\n\t\t\t<div class="div2">\n\t\t\t\t<div class="link">link text</div>\n\t\t\t\t<div class="link">option</div>\n\t\t\t\t<div class="link">improve</div>\n\t\t\t</div>\n\t\t\t'
			}
		});
		// for(var i=0;i<5;i++){
		// 	f_dc_temp({
		// 		state: {
		// 			text: 'option #'+i
		// 		}
		// 	}).insertIn(dcom);
		// }
		return {
			extend: {
				open: function open() {
					if (!g_context_opened) {
						dcom.el.show();
						g_context_opened = 1;
					}
					if (timer) {
						clearTimeout(timer);
						dcom.removeClass('show_up_once');
					}
					dcom.addClass('show_up_once');
					timer = setTimeout(function () {
						dcom.removeClass('show_up_once');
					}, 200);
					var sz = dcom.el.crec();
					dcom.el.css({ left: e.clientX - sz.width / 2, top: e.clientY - sz.height / 2 });
				},
				close: function close() {
					if (g_context_opened) {
						g_context_opened = 0;
						dcom.el.hide();
					}
				}
			},
			init: function init() {
				dcom.insertIn(bodytag);
			}
		};
	});

	var log = f_dc_temp({
		attrs: {
			id: 'log'
		},
		extend: {
			is: function is(v, t) {
				if (!t) t = 900;
				var self = this;
				this.el.show();
				this.t = v;
				self.clearTimeouts();
				this.timeout(function () {
					self.el.hide();
				}, t);
			},
			long: function long(v) {
				this.is(v, 2500);
			},
			until: function until(v) {
				if (typeof v == 'undefined') {
					this.el.hide();return;
				}
				this.el.show();
				this.t = v;
			}
		},
		init: function init() {
			this.insertIn(bodytag);
		}
	});

	var app_short_descr = f_dc_temp({
		state: {
			html: '<div class="back_line inlb" style="padding: 0 10px;margin-top: 20px;">\n\t\t\t\t\t<h2>MEXY.PRO</h2>\n\t\t\t\t\t<p>Enjoy awesomeness while interacting with others</p>\n\t\t\t\t\t<p>Free & Fast , Beautiful & Secure</p>\n\t\t\t\t\t<p>And better with time</p>\n\t\t\t\t</div>'
		}
	});

	var chat = f_dc_temp(function () {
		var ctx = {},
		    box_chat,
		    over_chat,
		    under_chat,
		    sendbt,
		    m_lastmid,
		    interlocutor_uid,
		    m_cid,
		    m_gid = 1,
		    have_unread_cid,
		    my_unread_messages,
		    all_messages;

		function reset_vars() {
			g_chat_active = 0;
			append_message.reset();
			temp_list = {};
			m_lastmid = '';
			m_cid = 0;
			last_typing_time_sent = 0;
			have_unread_cid = 0;
			my_unread_messages = {};
			all_messages = {};
		}

		function count_lines(str) {
			return (str.match(/[\n\r]/g) || []).length;
		}

		function set_last_mid_if(mid) {
			if (mid > m_lastmid) m_lastmid = mid;
		}

		var temp_list, inserted_m; // if inserted, typing container should be reinserted

		var audio = f_dc_temp({
			eltype: 'audio',
			events: {
				canplaythrough: function canplaythrough() {
					audio.ready = 1;
				},
				tab_active: function tab_active() {
					this.el.pause();
				}
			},
			init: function init() {
				var src = f_dc_temp({
					eltype: 'source',
					attrs: {
						src: '/other/15bells.mp3'
					}
				}).insertIn(this);
				this.play = function () {
					if (this.ready) {
						this.el.currentTime = 0;
						this.el.play();
					}
				};
			}
		});

		var append_message = function () {
			var last_m_is_my, my, lright, fake, block_val, t2, sender, last_m_time, last_date_displayed;
			var pub_f = function pub_f(v, beforetarget) {
				my = fake = 0;
				lright = '';
				if (!v) {
					v = {};
					fake = 1;
					block_val = input.el.value;
					input.v = '';
				} else if (v._id && v.data) {
					block_val = v.data;
					set_last_mid_if(v._id);
				}
				var not_viewed = v.viewed === false;
				if (f_my_uid(v.sender)) {
					lright = ' lright';my = 1;
				} else if (v.sender != interlocutor_uid) {
					f_close_chat_error();return;
				}
				if (!my && not_viewed) have_unread_cid = v.cid;
				t2 = f_getDate(v.time);
				if (t2 != last_date_displayed) {
					f_dc_temp({
						state: {
							class: 'mdate',
							text: t2
						}
					}).insertIn(box_chat);
					last_date_displayed = t2;
				}
				var l = f_dc_temp({
					state: {
						class: 'l' + lright
					}
				});
				var time = f_dc_temp({
					eltype: 'span',
					state: {
						class: 'mtime',
						text: fake ? '' : f_getTime(v.time)
					}
				});
				l.data.t = function (v) {
					time.t = f_getTime(v);
				};
				var block = f_dc_temp({
					state: {
						class: 'block',
						text: block_val
					}
				});
				if (my) {
					if (last_m_is_my != 1) {
						last_m_is_my = 1;
						sender = f_dc_temp({
							state: {
								class: 'm_sender_name',
								text: 'Me:'
							}
						});
						sender.insertIn(l);
					}
					var pulsar;
					if (v.viewed === false || fake) {
						pulsar = f_dc_temp({
							state: {
								class: 'm_unread'
							}
						});
						pulsar.insertIn(l);
					}
					time.insertIn(l);
					block.insertIn(l);
					if (fake) {
						temp_list[m_gid] = l;
						f_save_message({
							data: block_val,
							gid: m_gid
						});
					}
				} else {
					if (last_m_is_my != 0) {
						last_m_is_my = 0;
						var u = f_known_people(interlocutor_uid);
						var name = u.name.split(' ')[0];
						sender = f_dc_temp({
							state: {
								class: 'm_sender_name',
								text: name + ':'
							}
						});
						sender.insertIn(l);
					}
					block.insertIn(l);
					time.insertIn(l);
					_typing.stop();
				}
				if (beforetarget) {
					prepend_message(l.el, beforetarget);
				} else {
					l.insertIn(box_chat);
				}
				if (v._id) {
					l._id = v._id;
					if (my && not_viewed) my_unread_messages[v._id] = l;
					all_messages[v._id] = l;
				}
				l.read = function () {
					if (pulsar) pulsar.remove();
				};
				l.pulsar = pulsar;
				if (_typing.is()) {
					// if typing
					_typing.init();
				} else {
					inserted_m = 1;
				}
				if (!f_tab_is_active()) audio.play();
				f_appear_once(l);
				chat_scroll();
			};
			pub_f.reset = function () {
				last_m_is_my = null;
				last_m_time = 0;
				last_date_displayed = 0;
			};
			pub_f.nameBefore = function (beforetarget) {
				if (last_m_is_my != 1) {
					last_m_is_my = 1;
					sender = f_dc_temp({
						state: {
							class: 'm_sender_name',
							text: 'Me:'
						}
					});
					sender.render();
					beforetarget.insertBefore(sender.el, beforetarget.firstChild);
					chat_scroll();
				}
			};
			return pub_f;
		}();

		function chat_resize() {
			box_chat.el.css({ height: space.el.height() - 15 - head.el.height() - under_chat.el.height() });
		}

		function chat_scroll() {
			box_chat.el.scrollTop = box_chat.el.scrollHeight;
		}

		function prepend_message(el, target) {
			box_chat.el.insertBefore(el, target);
		}

		function f_save_message(o) {
			if (!m_cid) return f_logIs('wrong conversation');
			if (g_route_current == 'sc') return;
			var data = o.data;
			m_gid++;
			f_semit('im', {
				act: 'save', data: data, cid: m_cid, gid: o.gid, after: m_lastmid
			}, function (v) {
				if (v.gid && v.mid) {
					set_last_mid_if(v.mid);
					chat.oper({ ok: 1, gid: v.gid, mid: v.mid });
					if (v.ms) {
						var target = all_messages[v.mid];
						v.ms.reverse().forEach(function (m) {
							append_message(m, target.el);
						});
						append_message.nameBefore(target.el);
					}
				} else {
					f_logLong(v.reason);
				}
			});
		}

		box_chat = f_dc_temp({
			state: {
				class: 'chat'
			}
		});
		var last_typing_time_sent, last_local_time_drawn;

		var input = ctx.in = f_dc_temp({
			eltype: 'textarea',
			attrs: {
				placeholder: 'Write a message',
				class: 'inp',
				id: 'textp'
			},
			state: {
				val: ''
			},
			events: {
				input: function input(e) {
					var val = this.value;
					var lenlines = count_lines(val);
					var time = Date.now();
					if (time - last_local_time_drawn < 150) return;
					_typing.draw({ uid: f_my_uid() });
					last_local_time_drawn = time;
					if (!f_known_people.isOnline(interlocutor_uid)) return;
					if (time - last_typing_time_sent < 700) return;
					last_typing_time_sent = time;
					f_semit('typing', { uid: interlocutor_uid });
				},
				keydown: function keydown(e) {
					if (e.keyCode == 13 && !e.shiftKey) {
						f_preventDefault(e);
						sendbt.onclick();
					}
				}
			}
		});
		sendbt = ctx.sbt = f_dc_temp({
			eltype: 'button',
			state: {
				class: 'b',
				text: '➤'
			},
			attrs: {
				id: 'send'
			},
			events: {
				click: function click() {
					var source = input.el;
					var val = source.value.trim();
					if (val.length > 500) {
						val = val.substr(0, 500);val = val.trim();
					}
					if (val != source.value) input.v = val;
					source.focus();
					if (!val.length) return;
					input.v = val;
					append_message();
					_typing.stop(1);
				}
			}
		});

		under_chat = f_dc_temp({
			init: function init() {
				this.parse('\n\t\t\t\t<div class="under_chat">\n\t\t\t\t\t<div style="padding: 0 50px 0 51px;position: relative;">\n\t\t\t\t\t\t{in}\n\t\t\t\t\t\t<input id="attach_f" type="button" class="b" value="+">\n\t\t\t\t\t\t{sbt}\n\t\t\t\t\t</div>\n\t\t\t\t</div>', ctx);
			}
		});

		var _typing = function () {
			var my_div = f_dc_temp({
				state: {
					class: 'lright my_typing',
					html: '<div class="in_typing"></div>'
				}
			}),
			    intl_div = f_dc_temp({
				state: {
					class: 'in_typing'
				}
			}),
			    displayed,
			    container = f_dc_temp({
				state: {
					class: 'typing_div'
				}
			}),
			    last_div_height,
			    my_timer,
			    me_busy = 0,
			    intl_busy = 0,
			    intl_timer;

			var scroll = function scroll() {
				var hright = my_div.el.crec().height;
				var h = container.el.crec().height;
				if (hright && h < hright) h = hright;
				if (h != last_div_height) {
					chat_scroll();last_div_height = h;
				}
			};
			return {
				init: function init() {
					container.insertIn(box_chat);
				},
				is: function is() {
					return me_busy || intl_busy ? 1 : 0;
				},
				stop: function stop(me) {
					// stop drawing that person is typing
					if (me) {
						if (!me_busy) return;
						if (my_timer) clearTimeout(my_timer);
						my_div.el.remove();
						scroll();
						me_busy = 0;
					} else {
						if (!intl_busy) return;
						if (intl_timer) clearTimeout(intl_timer);
						intl_div.el.remove();
						scroll();
						intl_busy = 0;
					}
				},
				draw: function draw(obj) {
					if (inserted_m) {
						_typing.init();inserted_m = 0;
					}
					if (f_my_uid(obj.from)) {
						my_div.insertIn(container);
						if (my_timer) clearTimeout(my_timer);
						me_busy = 1;
						my_timer = setTimeout(function () {
							_typing.stop(1);
						}, 1800);
					} else {
						intl_div.insertIn(container);
						if (intl_timer) clearTimeout(intl_timer);
						intl_busy = 1;
						intl_timer = setTimeout(function () {
							_typing.stop();
						}, 1800);
					}
					scroll();
				}
			};
		}();

		function read_intl_messages() {
			if (g_chat_active && f_tab_is_active() && have_unread_cid && m_cid == have_unread_cid) {
				f_semit('im', {
					act: 'read',
					cid: have_unread_cid,
					before: m_lastmid
				}, function (res) {
					if (res.ok) have_unread_cid = 0;
				});
			}
		}

		function mark_my_messages_viewed(v) {
			if (g_chat_active && f_tab_is_active() && v.cid == m_cid) {
				for (var id in my_unread_messages) {
					if (v.before < id) continue;
					var l = my_unread_messages[id];
					l.read();
					delete my_unread_messages[id];
				}
			}
		}

		return {
			events: {
				tab_active: function tab_active() {
					read_intl_messages();
				}
			},
			extend: {
				start: function start(data, reinit) {
					// here we initialize conversation
					// data should have info about interlocutor (target) and conversation id
					// to get `f_known_people(uid)` and `cid`
					g_chat_active = 1;
					if (data) {
						interlocutor_uid = data.target;
						m_cid = data.cid;
					}
					if (reinit) return route_init();
					f_semit('user', { act: 'is_online', uid: interlocutor_uid }, function (res) {
						f_known_people.online(interlocutor_uid, res == 1);
						head_intl.draw(interlocutor_uid);
						chat.load();
						chat.adapt();
					});
				},
				check: function check() {
					var v = route_read_url_search();
					var cid = v.cid;
					if (cid == m_cid) return;
					if (cid) {
						if (interlocutor_uid) {
							m_cid = cid;
							chat.start();
						} else {
							// load info about interlocutor - target
							f_get_conversation_info(cid, function (err, uid) {
								if (err) return f_close_chat_error();
								chat.start({
									cid: cid,
									target: uid
								});
							});
						}
					} else {
						head_intl.hide();
						g_chat_active = 0;
					}
				},
				adapt: function adapt() {
					chat_resize();
					chat_scroll();
				},
				add: function add(v) {
					if (v.length) {
						v.reverse().forEach(function (v) {
							if (v._id > m_lastmid) append_message(v);
						});
						read_intl_messages();
						chat.adapt();
					}
				},
				load: function load() {
					if (g_chat_active && m_cid) {
						var ops = { act: 'load', cid: m_cid };
						if (m_lastmid) ops.after = m_lastmid;
						f_semit('im', ops, function (res) {
							if (res.ok) chat.add(res.ok);
						});
					} else {
						console.log('unable to load ms');
					}
				},
				received: function received(v) {
					if (v && m_cid == v.cid) chat.load();
				},
				viewed: function viewed(v) {
					mark_my_messages_viewed(v);
				},
				oper: function oper(v) {
					if (v.ok) {
						if (v.gid && v.mid) {
							var gid = v.gid;
							if (!temp_list[gid]) {
								f_logLong('strange thing happened');return;
							}
							var l;
							my_unread_messages[v.mid] = l = temp_list[gid];
							all_messages[v.mid] = l;
							l._id = v.mid;
							l.data.t();
							delete temp_list[gid];
						}
						chat.adapt();
					}
				},
				focus: function focus() {
					input.el.focus();
				},
				typing: function typing(obj) {
					if (obj.from == interlocutor_uid) _typing.draw(obj);
				},
				close: function close() {
					reset_vars();
					head_intl.hide();
				}
			},
			initLater: function initLater() {
				reset_vars();
				this.DClist([box_chat, under_chat]);
				box_chat.t = '';
				_typing.init();
				return this;
			}
		};
	});

	var login_route = f_dc_temp(function () {

		var or_div = f_dc_temp({
			state: {
				html: '<div class="back_line inlb" style="margin: 20px 0;padding: 0 10px;">Or</div>'
			}
		});
		var logo = f_dc_temp();
		var restore_box_1 = f_dc_temp(function () {
			var ctx = {};
			var dcom, result, email;
			result = ctx.rs = f_dc_temp(function () {
				var self;
				return {
					getSelf: function getSelf(a) {
						self = a;
					},
					extend: {
						is: function is(v) {
							self.t = v;
						}
					},
					attrs: {
						class: 'form'
					}
				};
			});
			email = ctx.em = f_dc_temp({
				eltype: 'input',
				attrs: {
					class: 'inp',
					placeholder: 'Email',
					type: 'email',
					maxlength: 80
				},
				events: {
					keydown: function keydown(e) {
						if (e.keyCode == 13) send(e);
					}
				}
			});
			var button = ctx.bt = f_dc_temp({
				eltype: 'button',
				attrs: {
					class: 'b'
				},
				state: {
					html: 'next'
				},
				events: {
					click: function click(e) {
						if (!f_email_valid(email.v)) {
							dcom.fail('invalid email');
							email.el.focus();
							return;
						}
						if (loading.busy) return;
						f_loadingShow();
						socket.emit('restore', { email: email.v }, function (res) {
							f_loadingHide();
							if (res.reason) {
								result.is(res.reason);
							} else {
								if (res.ok) result.is('Check your inbox!');
							}
						});
						result.is('');
					}
				}
			});
			var button2 = ctx.btc = f_dc_temp({
				eltype: 'button',
				attrs: {
					class: 'b'
				},
				state: {
					html: 'cancel'
				},
				events: {
					click: function click(e) {
						sign_in_box.el.show('inline-block');
						dcom.el.hide();
					}
				}
			});
			function send(e) {
				f_preventDefault(e);
				button.onclick();
			}
			return {
				extend: {
					fail: function fail(v) {
						f_pulse_once(dcom);
						result.is(v);
					},
					appear: function appear() {
						dcom.el.show('inline-block');
					}
				},
				init: function init() {
					dcom = this;
					this.parse('\n\t\t\t<div style="display: inline-block;" class="enter_form">\n\t\t\t\t<div class="back_line">Reset password via email:</div>\n\t\t\t\t<div style="padding-right: 22px;">\n\t\t\t\t\t{em}\n\t\t\t\t</div>\n\t\t\t\t{bt}{btc}\n\t\t\t\t{rs}\n\t\t\t</div>\n\t\t\t', ctx);
					this.el.hide();
				}
			};
		});

		var restore_header = f_dc_temp({
			state: {
				text: 'Create new password'
			}
		});

		var restore_email_info = f_dc_temp();

		var restore_box_2 = f_dc_temp(function () {
			var ctx = {};
			var dcom, result, pass1;
			result = ctx.rs = f_dc_temp(function () {
				var self;
				return {
					getSelf: function getSelf(a) {
						self = a;
					},
					extend: {
						is: function is(v) {
							self.t = v;
						}
					},
					attrs: {
						class: 'form'
					}
				};
			});
			pass1 = ctx.p1 = f_dc_temp({
				eltype: 'input',
				attrs: {
					class: 'inp',
					placeholder: 'type new password',
					type: 'password',
					maxlength: 80
				},
				events: {
					keydown: function keydown(e) {
						if (e.keyCode == 13) send(e);
					}
				}
			});
			var pass2 = ctx.p2 = f_dc_temp({
				eltype: 'input',
				attrs: {
					class: 'inp',
					placeholder: 'repeat password',
					type: 'password',
					maxlength: 80
				},
				events: {
					keydown: function keydown(e) {
						if (e.keyCode == 13) send(e);
					}
				}
			});
			var button = ctx.bt = f_dc_temp({
				eltype: 'button',
				attrs: {
					class: 'b'
				},
				state: {
					html: 'next'
				},
				events: {
					click: function click(e) {
						var p1 = pass1.v;
						var p2 = pass2.v;
						if (!p1) return pass1.el.focus();
						if (p1.length < 8) {
							dcom.fail('invalid password');
							pass1.el.focus();
							return;
						}
						if (!p2) return pass2.el.focus();
						if (p2 !== p1) {
							dcom.fail('password mismatch');
							pass2.el.focus();
							return;
						}
						if (loading.busy) return;
						f_loadingShow();
						socket.emit('change_pass', { email: window.restore_email, key: window.restore_key, newpass: pass1.v }, function (res) {
							f_loadingHide();
							if (res.reason) {
								result.is(res.reason);
							} else {
								if (res.ok) {
									f_dc_list(restore_box_2, [success_box, go_button]);
								}
							}
						});
						result.is('');
					}
				}
			});
			var button2 = ctx.btc = f_dc_temp({
				eltype: 'button',
				state: {
					class: 'b',
					html: 'cancel'
				},
				events: {
					click: function click(e) {
						window.restore_email = false;
						route_init();
					}
				}
			});
			var success_box = f_dc_temp({
				state: {
					text: 'Success! Now, login with new password'
				}
			});
			var go_button = f_dc_temp({
				eltype: 'button',
				state: {
					text: 'ok',
					class: 'b'
				},
				events: {
					click: function click() {
						button2.onclick();
					}
				}
			});
			function send(e) {
				f_preventDefault(e);
				button.onclick();
			}
			return {
				extend: {
					fail: function fail(v) {
						f_pulse_once(dcom);
						result.is(v);
					},
					appear: function appear() {
						dcom.el.show('inline-block');
					}
				},
				init: function init() {
					dcom = this;
					this.parse('\n\t\t\t<div style="display: inline-block;" class="enter_form">\n\t\t\t\t<div class="back_line">remember it:</div>\n\t\t\t\t<div style="padding-right: 22px;">\n\t\t\t\t\t{p1}<br />\n\t\t\t\t\t{p2}\n\t\t\t\t</div>\n\t\t\t\t{bt}{btc}\n\t\t\t\t{rs}\n\t\t\t</div>\n\t\t\t', ctx);
				}
			};
		});
		var sign_in_box = f_dc_temp(function () {
			var ctx = {};
			var dcom, result, login, password, button;
			result = ctx.rs = f_dc_temp(function () {
				var self;
				return {
					getSelf: function getSelf(a) {
						self = a;
					},
					extend: {
						is: function is(v) {
							self.t = v;
						}
					},
					attrs: {
						class: 'form'
					}
				};
			});
			login = ctx.em = f_dc_temp({
				eltype: 'input',
				attrs: {
					class: 'inp',
					placeholder: 'login',
					maxlength: 80
				},
				events: {
					keydown: function keydown(e) {
						if (e.keyCode == 13) send(e);
					}
				}
			});
			password = ctx.ps = f_dc_temp({
				eltype: 'input',
				attrs: {
					class: 'inp',
					placeholder: 'Password',
					type: 'password',
					maxlength: 20
				},
				events: {
					keydown: function keydown(e) {
						if (e.keyCode == 13) send(e);
					}
				}
			});
			button = ctx.bt = f_dc_temp({
				eltype: 'button',
				attrs: {
					class: 'b'
				},
				state: {
					html: 'login'
				},
				events: {
					click: function click(e) {
						f_preventDefault(e);
						var loginval = login.el.value;
						// if(!f_email_valid(loginval)){
						// 	dcom.fail('invalid email');
						// 	login.el.focus();
						// 	return;
						// }
						if (loginval.length < 4) {
							dcom.fail('invalid login');
							login.el.focus();
							return;
						}
						var pas = password.el.value;
						if (pas.length < 8) {
							dcom.fail('invalid password');
							password.el.focus();
							return;
						}
						if (loading.busy) return;
						var data = {
							login: loginval,
							pass: pas
						};
						loading.show();
						f_semit('signin', data, function (v) {
							loading.hide();
							if (v.token) {
								f_App_signin(v.token);
							} else {
								sign_in_box.fail('Nope, ' + v.reason);
							}
						});
						result.is('');
					}
				}
			});
			function send(e) {
				f_preventDefault(e);
				button.onclick();
			}
			var forgot_pas_text = ctx.ft = f_dc_temp({
				eltype: 'span',
				state: {
					class: 'forgot_password',
					text: 'restore access?'
				},
				events: {
					click: function click() {
						sign_in_box.el.hide();
						restore_box_1.appear();
					},
					mousedown: function mousedown() {}
				}
			});
			return {
				extend: {
					fail: function fail(v) {
						f_pulse_once(dcom);
						result.is(v);
					}
				},
				init: function init() {
					dcom = this;
					this.parse('\n\t\t\t<form class="enter_form">\n\t\t\t\t<div class="back_line">Sign in:</div>\n\t\t\t\t<div style="padding-right: 22px;">\n\t\t\t\t\t{em}<br />\n\t\t\t\t\t{ps}\n\t\t\t\t</div>\n\t\t\t\t{bt}\n\t\t\t\t{ft}\n\t\t\t\t{rs}\n\t\t\t</form>\n\t\t\t', ctx);
				}
			};
		});

		var sign_up_box = f_dc_temp(function () {
			var dc;
			////////////
			var first_name = f_dc_temp({
				eltype: 'input',
				state: {
					class: 'inp'
				},
				attrs: {
					placeholder: "name"
				},
				events: {
					keydown: function keydown(e) {
						if (e.keyCode == 13) send();
					},
					input: function input() {
						var v = this.value.replace(/\s/g, '').substr(0, 14);
						if (v != this.val()) this.val(v);
					}
				}
			});
			var second_name = f_dc_temp({
				eltype: 'input',
				state: {
					class: 'inp'
				},
				attrs: {
					placeholder: 'last name'
				},
				events: {
					keydown: function keydown(e) {
						if (e.keyCode == 13) send();
					},
					input: function input() {
						var v = this.value.replace(/\s/g, '').substr(0, 14);
						if (v != this.val()) this.val(v);
					}
				}
			});
			var login = f_dc_temp({
				eltype: 'input',
				state: {
					class: 'inp'
				},
				attrs: {
					placeholder: 'login'
				},
				events: {
					keydown: function keydown(e) {
						if (e.keyCode == 13) send();
					}
				}
			});
			var email = f_dc_temp({
				eltype: 'input',
				state: {
					class: 'inp'
				},
				attrs: {
					placeholder: 'email'
				},
				events: {
					keydown: function keydown(e) {
						if (e.keyCode == 13) send();
					}
				}
			});
			var password = f_dc_temp({
				eltype: 'input',
				state: {
					class: 'inp'
				},
				attrs: {
					placeholder: 'password',
					type: 'password'
				},
				events: {
					keydown: function keydown(e) {
						if (e.keyCode == 13) send();
					}
				}
			});
			var button = f_dc_temp({
				eltype: 'button',
				state: {
					text: 'next',
					class: 'b'
				},
				events: {
					click: function click() {
						var fname = first_name.el.value.replace(/\s/g, '');
						var sname = second_name.el.value.replace(/\s/g, '');
						var loginval = login.el.value.trim();
						var passval = password.el.value;
						var emval = email.el.value.trim();
						// simple name and password validation
						if (fname.length < 4) {
							first_name.el.focus();
							if (fname.length) dc.fail("wrong name");
							return;
						}
						if (sname.length < 4) {
							second_name.el.focus();
							if (sname.length) dc.fail("wrong name");
							return;
						}
						if (emval.length < 4 || !f_email_valid(emval)) {
							email.el.focus();
							if (emval.length && !f_email_valid(emval)) dc.fail("wrong email");
							return;
						}
						if (loginval.length < 4) {
							login.el.focus();
							if (loginval.length) dc.fail("wrong login");
							return;
						}
						if (passval.length < 4) {
							password.el.focus();
							if (passval.length) dc.fail("wrong password");
							return;
						}
						update('processing . . .');
						f_semit('signup', {
							name: fname + ' ' + sname,
							login: loginval,
							email: emval,
							pass: passval
						}, function (data) {
							var text = '';
							if (data.reason) {
								text += 'failed\n';
								text += JSON.stringify(data, null, 4);
							} else if (data.ok) {
								text = 'Success! Check your inbox!';
							}
							update(text);
						});
					}
				}
			});
			function send() {
				button.onclick();
			}
			var result = f_dc_temp({
				state: {
					class: 'form'
				}
			});
			function update(v) {
				result.t = v;
			}
			// return {
			// 	init(){
			// 		var ctx = {
			// 			fn: first_name,
			// 			sn: second_name,
			// 			em: email,
			// 			a: login,
			// 			b: password,
			// 			c: button,
			// 			d: result
			// 		}
			// 		this.parse(`<div>{fn}<br />{sn}<br />{em}<br />{a}<br />{b}<br />{c}{d}</div>`,ctx);
			// 	}
			// }
			f_dc_temp({
				eltype: 'button',
				attrs: {
					class: 'b'
				},
				state: {
					html: 'next'
				},
				events: {
					click: function click(e) {

						if (!f_email_valid(email.el.value)) {
							dc.fail('invalid email');
							email.el.focus();
							return;
						}
						if (loading.busy) return;
						var data = {
							email: email.el.value
						};
						data = { data: data };
						// loading.show();
						// setTimeout(function(){
						// 	f_semit('signup',data);
						// },g_500_delay);
						result.is('');
					}
				}
			});
			var show_b = f_dc_temp({
				eltype: 'button',
				state: {
					class: 'b',
					text: 'register'
				},
				events: {
					click: function click() {
						signup_form.el.show('inline-block');
						show_b.el.hide();
					}
				}
			});
			var signup_form = f_dc_temp().parse('\n\t<div style="display: inline-block;margin-bottom: 80px;" class="enter_form">\n\t\t<div class="back_line">Sign up with email:</div>\n\t\t<div style="padding-right: 22px;">\n\t\t\t{fn}<br />\n\t\t\t{sn}<br />\n\t\t\t{em}<br />\n\t\t\t{a}<br />\n\t\t\t{b}<br />\n\t\t\t{c}{d}\n\t\t</div>\n\t</div>', {
				fn: first_name,
				sn: second_name,
				em: email,
				a: login,
				b: password,
				c: button,
				d: result
			});
			signup_form.el.hide();
			return {
				extend: {
					fail: function fail(v) {
						f_pulse_once(dc);
						update(v);
					}
				},
				init: function init() {
					dc = this;
					this.parse('\n\t\t\t<div>{a}{b}\n\t\t\t</div>\n\t\t\t', {
						a: show_b,
						b: signup_form
					});
				}
			};
		});

		return {
			state: {
				class: 'form center'
			},
			attrs: {
				style: 'padding-bottom: 120px;'
			},
			groups: 'route',
			initLater: function initLater() {
				logo_canvas.run(logo);
				var arr;
				if (window.restore_email && window.restore_key) {
					restore_email_info.h = 'for <b>' + window.restore_email + '</b>';
					arr = [logo, restore_header, restore_email_info, restore_box_2];
				} else {
					arr = [logo, app_short_descr, sign_in_box, restore_box_1, or_div, sign_up_box];
				}
				this.DClist(arr);
				return this;
			}
		};
	});
	var contacts_route = f_dc_temp(function () {
		var search = f_dc_temp(function () {
			function f_draw_user_search(obj) {
				var dcs = [],
				    cur = 0;
				if (obj && obj.length) {
					for (var i = 0; i < obj.length; i++) {
						cur = obj[i];
						dcs.push(f_draw_user_from_search(cur));
					}
					search.res(dcs);
				} else {
					search.fail();
				}
			}

			function f_draw_user_from_search(obj) {
				obj = f_clone(obj);
				// obj.photo = f_get_photo(obj.photo);
				var dc = f_dc_temp();
				var ctx = {};
				var uid = obj._id;
				var bthtml;
				// style="background-image:url(' + obj.photo + ');"
				var html = '<div class="back_line"><div class="u_picture"></div>';
				html += '<div class="inlb" style="vertical-align:top;"><div class="inlb">' + obj.name + '</div><br />';
				if (uid != U.id) {
					if (obj.status == null) {
						bthtml = 'request';
					} else if (obj.status == 0) {
						if (obj.initiator_me) {
							html += '<div class="green">requested</div>';
						} else {
							bthtml = 'accept';
						}
					} else if (obj.status == 1) {
						bthtml = 'talk';
					}
				}
				if (bthtml) {
					var button = ctx.bt = f_dc_temp({
						eltype: 'button',
						attrs: {
							class: 'b '
						},
						state: {
							text: bthtml
						},
						events: {
							click: function click() {
								if (obj.status != 1) {
									f_loadingShow();
									var data = { target: uid };
									f_semit('contact', {
										data: data, type: bthtml
									}, function (v) {
										f_loadingHide();
										f_sq_res(v, function (v) {
											if (bthtml == 'request') {
												button.replaceWith('<div class="green">requested</div>', 1);
											} else {
												button.replaceWith('<div class="green">accepted</div>', 1);
											}
										});
									});
								} else {
									f_start_conv(uid);
								}
							}
						}
					});
					html += '{bt}';
				}
				html += '</div></div>';
				dc.parse(html, ctx);
				return dc;
			}

			var button, text_result, search_div_result, input;
			input = f_dc_temp({
				eltype: 'input',
				attrs: {
					class: 'inp',
					style: 'max-width:150px;',
					placeholder: 'Type name'
				},
				extend: {
					fail: function fail() {
						f_pulse_once(input);
						input.el.focus();
					}
				},
				events: {
					keypress: function keypress(e) {
						if (this.value.length) clearbutton.el.show('inline-block');
						if (e.keyCode == 13) {
							button.onclick(e);
						}
					}
				}
			});
			button = f_dc_temp({
				eltype: 'button',
				state: {
					class: 'b',
					text: 'search'
				},
				events: {
					click: function click(e) {
						if (loading.busy) return;
						var user_name = input.el.value;
						if (user_name.length < 3) {
							f_pulse_once(text_result);
							input.fail();
							text_result.fail('enter more letters');
							return;
						}
						// f_loadingShow();
						var data = { name: user_name };
						text_result.is('searching...');
						f_semit('search', {
							data: data, type: "people"
						}, function (v) {
							f_loadingHide();
							f_draw_user_search(v.ok);
						});
					}
				}
			});
			var clearbutton = f_dc_temp({
				eltype: 'button',
				state: {
					class: 'b',
					text: 'clear'
				},
				events: {
					click: function click(e) {
						clearbutton.el.hide();
					}
				}
			});
			clearbutton.el.hide();
			text_result = f_dc_temp({
				attrs: {
					class: 'center back_line inlb',
					style: 'padding: 5px;'
				},
				extend: {
					is: function is(v) {
						text_result.el.show('');
						text_result.t = v;
					},
					fail: function fail(v) {
						f_pulse_once(text_result);
						input.fail();
						v ? text_result.is(v) : text_result.is('not found');
						search_div_result.t = '';
					}
				}
			});
			var temp = f_dc_temp({
				eltype: 'p',
				state: {
					text: 'Search for people'
				}
			});
			var search_div = f_dc_temp({
				attrs: {
					class: 'center back_line',
					style: 'margin: 20px 0;padding: 1px 5px 10px;'
				},
				init: function init() {
					this.DClist([temp, input, clearbutton]);
				}
			});
			search_div_result = f_dc_temp();
			return {
				extend: {
					res: function res(dcs) {
						text_result.is('hey, there are results:');
						search_div_result.t = '';
						dcs.map(function (v) {
							v.insertIn(search_div_result);
						});
					},
					fail: function fail() {
						text_result.fail();
					},
					clear: function clear() {
						text_result.el.hide();
						input.v = '';
						search_div_result.t = '';
					}
				},
				init: function init() {
					this.clear();
					this.DClist([search_div, text_result, search_div_result]);
					return this;
				}
			};
		});

		var friends = f_dc_temp(function () {
			var list = f_dc_temp({
				state: {
					class: 'contacts_list'
				}
			});
			var waitlist = f_dc_temp();
			var button = f_dc_temp({
				eltype: 'button',
				state: {
					class: 'b',
					text: 'refresh'
				},
				events: {
					click: function click() {
						f_semit('contact', { act: 'show_all' }, function (data) {
							if (data.arr) {
								f_semit('contact', { act: 'show_userdata_lots', idarr: data.arr }, function (data) {
									if (data.arr) {
										for (var uid in data.arr) {
											var c = data.arr[uid];
											if (c) {
												c.forEach(function (s) {
													return f_known_people.updateData(uid, s);
												});
											}
										}
									}
								});
								data.arr.forEach(function (c) {
									c.status = 1;
									if (c.last_v) c.last_v = new Date(c.last_v).toISOString();
									f_known_people.add(c._id, c);
									if (c.online) f_known_people.online(c._id, 1);
								});
								friends.draw();
							}
						});
						search.clear();
					}
				}
			});
			var text_result = f_dc_temp({
				attrs: {
					class: 'center back_line inlb'
				},
				extend: {
					is: function is(v) {
						text_result.el.show();
						text_result.t = v;
					},
					fail: function fail(v) {
						f_pulse_once(text_result);
						v ? text_result.is(v) : text_result.is('You have no friends yet');
					}
				}
			});
			text_result.el.hide();

			function stop_items_timers() {
				for (var uid in items) {
					var user = items[uid];
					if (user.timer) user.timer.stop();
				}
			}

			function start_items_timers() {
				for (var uid in items) {
					var user = items[uid];
					if (user.timer) user.update();
				}
			}

			var items = {};
			return {
				extend: {
					draw: function draw() {
						var friends = f_clone(f_known_people.getFriends());
						// waitlist.change({ html: '' });
						// if (obj1 && obj1.length) {
						// 	text_result.el.hide();
						// 	for (var uid in obj1) {
						// 		if (uid == 'length') continue;
						// 		f_draw_user_from_search(obj1[uid]).insertIn(waitlist);
						// 	}
						// }
						if (friends) {
							text_result.el.hide();
							for (var uid in friends) {
								if (uid == 'length') continue;
								if (items[uid]) continue;
								items[uid] = f_draw_friend_item(friends[uid]).insertIn(list);
							}
							start_items_timers();
						} else {
							text_result.fail();
						}
					},
					fail: function fail() {
						text_result.fail();
					},
					load: function load() {
						button.onclick();
					},
					stop: function stop() {
						stop_items_timers();
					}
				},
				init: function init() {
					this.DClist([text_result, waitlist, list]);
					return this;
				}
			};
		});

		return {
			state: {
				class: 'form center'
			},
			groups: 'route',
			extend: {
				title: 'Contacts',
				onleave: function onleave() {
					friends.stop();
				}
			},
			events: {
				u_login: function u_login() {
					if (f_user_authorized()) friends.load();
				}
			},
			initLater: function initLater() {
				friends.draw();
				this.DClist([search.init(), friends]);
				return this;
			}
		};
	});

	var im_route = f_dc_temp(function () {
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
					f_known_people.load(uid, function () {}, function () {
						u = f_known_people(uid);
						name.t = u.name;
					});
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
				data.sett = function (text) {
					var shorted = text.substr(0, 90);
					if (shorted.length != text.length) shorted += '...';
					data.t = shorted;
				};
				data.sett(o.data);
				var my_pic = f_dc_temp({
					state: {
						class: 'u_picture_micro va_middle'
					},
					attrs: {
						style: 'margin: 5px;'
					},
					events: {
						u_data: function u_data() {
							my_picture.set();
						}
					}
				});
				my_pic.set = function () {
					var url = cloudinary(U.userdata.crop_photo);
					if (url) my_pic.el.css({ 'background-image': 'url(' + url + ')' });
				};
				my_pic.set();
				my_pic.visible = function () {
					my ? my_pic.el.show('inline-block') : my_pic.el.hide();
				};
				var dc = f_dc_temp({
					events: {
						click: function click() {
							f_start_conv(uid);
						}
					}
				});
				var photo = f_dc_temp({
					state: {
						class: 'u_picture_mid'
					}
				});
				dc.update = function (_o) {
					u = f_known_people(uid);
					if (u.userdata && u.userdata.crop_photo) photo.el.css({ 'background-image': 'url(' + cloudinary(u.userdata.crop_photo) + ')' });
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
				};
				user_data_eventer(uid, dc.update);
				var line = f_dc_temp().parse('<div class="back_line message_preview_line">{ph}<div class="inlb padl5 va_top">{a}<br />{mp}{b}</div></div>', {
					ph: photo,
					a: name,
					b: data,
					mp: my_pic
				}).insertIn(dc);
				dc.update(o);
				return dc;
			}
			var created = {};
			return {
				initLater: function initLater() {
					if (!dc) dc = this;
					f_semit('conv', { act: 'get_list' }, function (res) {
						// console.log(res);
						if (res.ok) {
							var arr = [];
							res.ok.forEach(function (o) {
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
					});
					return dc;
				}
			};
		});

		return {
			state: {
				// html: '<div class="back_line inlb" style="margin: 20px 0;padding: 0 10px;">You have no friends yet</div>'
			},
			extend: {
				title: function title() {
					var v = route_read_url_search();
					if (v.cid) {
						return false;
					} else {
						return 'Instant messages';
					}
				}
			},
			groups: 'route',
			initLater: function initLater() {
				var v = route_read_url_search();
				var content = [];
				if (v.cid) {
					content.push(chat.init());
				} else {
					content.push(list.init());
				}
				this.DClist(content);
				return this;
			}
		};
	});

	var sc_route = f_dc_temp(function () {
		var div = f_dc_temp({
			state: {
				html: '<div style="margin: 20px;padding: 10px;background: rgba(63, 63, 63, 0.72);">\n\t\t\t<p style="color:white;">Not available yet</p>\n\t\t\t<p style="color:white;">You can use <a href="https://temp.mexy.pro" target="_blank" style="color: #ff8282;font-weight: bold;">temp.mexy.pro</a> instead</p>\n\t\t\t</div>'
			}
		});

		var friends = f_dc_temp(function () {
			var list = f_dc_temp({
				state: {
					class: 'contacts_list'
				}
			});
			var button = f_dc_temp({
				eltype: 'button',
				state: {
					class: 'b',
					text: 'refresh'
				},
				events: {
					click: function click() {
						logo_canvas.stop();
						logo_canvas.run(list);
					}
				}
			});
			var text_result = f_dc_temp({
				attrs: {
					class: 'center back_line inlb'
				},
				extend: {
					is: function is(v) {
						text_result.el.show('');
						text_result.change({ text: v });
					},
					fail: function fail(v) {
						f_pulse_once(text_result);
						v ? text_result.is(v) : text_result.is('No friends online');
					}
				}
			});
			text_result.el.hide();
			return {
				extend: {
					draw: function draw() {
						var html = '',
						    cur,
						    obj = f_clone(P.on);
						var dc;
						list.change({ html: '' });
						var count = 0; // number of friends online
						if (obj && obj.length) {
							text_result.el.hide();
							obj.map(function (cur) {
								logr(cur);
								cur = f_get_one_u(cur);
								if (!cur) return;
								f_draw_user_from_search(cur).insertIn(list);
								count++;
							});
						}
						if (!count) {
							text_result.fail();
						}
					},
					fail: function fail() {
						text_result.fail();
					}
				},
				init: function init() {
					this.DClist([text_result, button, list]);
					return this;
				}
			};
		});

		return {
			state: {
				class: 'form center'
			},
			extend: {
				title: 'Secret talks'
			},
			groups: 'route',
			initLater: function initLater() {
				this.DClist([div]);
				// logo_canvas.run(this);
				// sc_route_friends.init()
				return this;
			}
		};
	});

	var settings_route = DC.make(function () {

		var theme = f_dc_temp(function () {
			var ctx = {};
			var dcom,
			    email,
			    button,
			    themes = [],
			    active_item,
			    active_theme,
			    saved_theme,
			    button;
			function theme_item(a) {
				return f_dc_temp(function () {
					var self;
					return {
						getSelf: function getSelf(a) {
							self = a;
						},
						eltype: 'div',
						state: {
							class: 'choose_theme choose_radio',
							text: a.tx
						},
						data: {
							theme: a.t
						},
						extend: {
							sel: function sel() {
								if (active_item) active_item.removeClass('selected_radio');
								self.addClass('selected_radio');
								active_item = self;
								saved_theme != active_theme ? button.el.show() : button.el.hide();
							}
						},
						events: {
							click: function click(e) {
								f_preventDefault(e);
								self.sel();
								f_change_theme(a.t);
							}
						}
					};
				});
			}
			button = ctx.bt = f_dc_temp({
				eltype: 'button',
				state: {
					class: 'b',
					text: 'save'
				},
				events: {
					click: function click(e) {
						f_preventDefault(e);
						var theme = active_theme;
						if (!theme) theme = '';
						f_loadingShow();
						f_semit('settings', { prop: 'theme', val: theme }, function (res) {
							f_loadingHide();
							if (res.ok) {
								f_change_theme(theme, 1);
								button.el.hide();
							}
						});
					}
				}
			});
			button.el.hide();
			themes.push(ctx.bw = theme_item({ t: 'black_white_mn', tx: 'black & white' }));
			themes.push(ctx.dm = theme_item({ t: 'dark_mn', tx: 'dark colours' }));
			themes.push(ctx.bm = theme_item({ t: 'bright_mn', tx: 'bright enough' }));
			themes.push(ctx.gl = theme_item({ t: 'grey_mn', tx: 'grey lines' }));
			themes.push(ctx.eb = theme_item({ t: 'easy_blue_mn', tx: 'easy blue' }));
			if (U.css) {
				// 
			} else {
				ctx.bw.onclick();
			}
			var theme_items = f_dc_temp({
				init: function init() {
					this.parse('\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<p>Select main theme:</p>\n\t\t\t\t\t\t<div class="center">\n\t\t\t\t\t\t\t{bw}\n\t\t\t\t\t\t\t{dm}\n\t\t\t\t\t\t\t{bm}\n\t\t\t\t\t\t\t{gl}\n\t\t\t\t\t\t\t{eb}\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div>{bt}</div>\n\t\t\t\t\t</div>\n\t\t\t\t\t', ctx);
				}
			});
			return {
				extend: {
					set: function set(v, saved) {
						var prefix = app_local_mode ? '/raw_' : '/';
						themes.find(function (a) {
							if (a.data.theme == v) {
								if (css_link.el.attr('href') != prefix + 'css/' + U.css.theme + '.css?v=' + App_version) {
									css_link.el.attr({ href: prefix + 'css/' + U.css.theme + '.css?v=' + App_version });
									active_theme = v;
								}
								if (saved) {
									saved_theme = v;
								}
								a.sel();
								return;
							}
						});
					}
				},
				init: function init() {
					return theme_items;
				}
			};
		});

		var profile_photo = f_dc_temp(function () {
			var finalDataURL;

			var preview_div_wrap = f_dc_temp({
				state: {
					class: 'preview_div_wrap'
				}
			}).iIn(bodytag);

			var preview_f_div = f_dc_temp({
				state: {
					class: 'preview_f_div'
				}
			}).iIn(preview_div_wrap);

			var photo_preview_wrap = f_dc_temp({
				state: {
					class: 'crop_img_wrap'
				}
			}).iIn(preview_f_div);

			var buttons = f_dc_temp().iIn(preview_f_div);

			var upload_b = f_dc_temp({
				eltype: 'button',
				state: {
					class: 'b',
					text: 'upload'
				},
				events: {
					click: function click() {
						previewer.upload();
					}
				}
			}).iIn(buttons);

			f_dc_temp({
				eltype: 'button',
				state: {
					class: 'b',
					text: 'cancel'
				},
				events: {
					click: function click() {
						previewer.cancel();
					}
				}
			}).iIn(buttons);

			var input = DC.temp({
				eltype: 'input',
				attrs: {
					type: 'file'
				},
				events: {
					change: function change() {
						readURL(this);
					}
				}
			});

			var content = f_dc_temp({
				state: {
					class: 'center'
				}
			});

			f_dc_temp({
				state: {
					class: 'back_line',
					text: 'How about your profile photo?'
				}
			}).iIn(content);

			var my_picture = f_dc_temp({
				attrs: {
					class: 'profile_picture'
				},
				extend: {
					set: function set(a) {
						this.el.css({ 'background-image': 'url(' + a + ')' });
					}
				},
				events: {
					u_data: function u_data() {
						if (U.userdata.crop_photo) {
							var url = cloudinary(U.userdata.crop_photo);
							my_picture.set(url);
						}
					}
				}
			}).iIn(f_dc_temp().iIn(content));

			DC.temp({
				eltype: 'button',
				state: {
					text: 'change photo',
					class: 'b'
				},
				events: {
					click: function click() {
						input.el.click();
					}
				}
			}).iIn(content);

			var previewer = function () {
				function crop_move(cursor, touch) {
					var el = crop_border.el;
					var left = parseInt(el.css('left')) || 0;
					var top = parseInt(el.css('top')) || 0;
					var dx = cursor.clientX - left;
					var dy = cursor.clientY - top;
					if (!mm.f) mm.f = function (e) {
						cursor = touch ? e.changedTouches[0] : e;
						var x = cursor.clientX - dx,
						    y = cursor.clientY - dy;
						var rect = el.crec();
						if (x < 0) x = 0;
						if (y < 0) y = 0;
						if (x + rect.width > imel.width) x = imel.width - rect.width;
						if (y + rect.height > imel.height) y = imel.height - rect.height;
						el.css({ left: x, top: y });
					};
				}
				function crop_resize(cursor, touch) {
					var el = crop_border.el;
					var rect = el.crec();
					var left = parseInt(el.css('left')) || 0;
					var top = parseInt(el.css('top')) || 0;
					var k = imel.width / imel.naturalWidth;
					var min = 300 * k;
					var fx = cursor.clientX;
					var fy = cursor.clientY;
					if (!mm.f) mm.f = function (e) {
						cursor = touch ? e.changedTouches[0] : e;
						var w = cursor.clientX - fx + rect.width,
						    h = cursor.clientY - fy + rect.height;
						if (w < min) w = min;
						if (h < min) h = min;
						if (left + w > imel.width) w = imel.width - left;
						if (h > imel.height - top) h = imel.height - top;
						if (w < h) h = w;
						if (h < w) w = h;
						el.css({ width: w, height: h });
					};
				}
				var crop_border = f_dc_temp({
					state: {
						class: 'crop_img_border'
					},
					events: {
						mousedown: function mousedown(e) {
							f_preventDefault(e);
							crop_move(e);
						},
						touchstart: function touchstart(e) {
							f_preventDefault(e);
							g_drag_event = 1;
							crop_move(e.changedTouches[0], 1);
						}
					}
				}).iIn(photo_preview_wrap);
				f_dc_temp({
					state: {
						class: 'crop_img_resize'
					},
					events: {
						mousedown: function mousedown(e) {
							f_preventDefault(e);
							crop_resize(e);
						},
						touchstart: function touchstart(e) {
							f_preventDefault(e);
							g_drag_event = 1;
							crop_resize(e.changedTouches[0], 1);
						}
					}
				}).iIn(crop_border);
				var preview_image = f_dc_temp({
					eltype: 'img',
					state: {
						class: 'img_preview'
					}
				}).iIn(photo_preview_wrap);

				var info = f_dc_temp({
					state: {
						class: 'back_line'
					}
				}).iIn(photo_preview_wrap);

				var imel = preview_image.el;
				imel.onload = function () {
					finalDataURL = imel.src;
					if (imel.naturalWidth < 300 || imel.naturalHeight < 300) {
						f_logIs('too liitle image');
						fn.cancel();
					}
				};

				var fn = {};

				fn.open = function (dataURL) {
					if (dataURL.length > 5000000) return f_logIs('too large photo');
					preview_image.el.src = dataURL;
					crop_border.el.css({ left: 0, top: 0, width: 100, height: 100 });
					preview_div_wrap.el.show();
					upload_b.el.show('inline-block');
					info.t = '';
				};

				fn.cancel = function () {
					preview_image.src = '';
					input.v = '';
					finalDataURL = false;
					preview_div_wrap.el.hide();
				};

				var canvas = document.createElement('canvas');
				canvas.width = canvas.height = 300;

				fn.crop = function (cb) {
					var el = crop_border.el;
					var imel = preview_image.el;
					var k = imel.width / imel.naturalWidth;
					var rect = el.crec();
					var size = rect.width / k;
					if (size < 300) size = 300;
					var left = parseInt(el.css('left')) || 0;
					var top = parseInt(el.css('top')) || 0;

					var context = canvas.getContext('2d');
					var img = new Image();

					img.onload = function () {
						// draw cropped image
						var sourceX = left / k;
						var sourceY = top / k;
						var sourceWidth = size;
						var sourceHeight = size;
						var destWidth = 300;
						var destHeight = 300;
						var destX = 0;
						var destY = 0;

						context.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);

						cb(canvas.toDataURL());
					};
					img.src = imel.src;
				};

				function uploadPacks(o) {
					if (!finalDataURL) return;
					var packs = o.arr;
					if (o.cur == 0) o.total = packs.length;
					var cur = o.cur,
					    total = o.total;
					if (cur == total) {
						if (o.type == 'crop') {
							info.t = 'saving crop photo...';
							f_semit('save_crop_photo', { loid: o.loid }, function (res) {
								if (res.crop_photo) {
									U.userdata.crop_photo = res.crop_photo;
									DC.emit('u_data');
								}
								info.t = 'done!';
								upload_b.el.show('inline-block');
								fn.cancel();
							});
						} else if (o.type == 'orig') {
							info.t = 'saving photo...';
							f_semit('save_photo', { loid: o.loid }, function (res) {
								info.t = 'cropping photo...';
								fn.crop(function (dataURL) {
									finalDataURL = dataURL;
									fn.upload({ type: 'crop' });
								});
							});
						}
						return;
					}
					f_semit('upload', {
						bin: packs[cur],
						loid: o.loid
					}, function (res) {
						if (res && res.reason) {
							console.log('error happened');
						} else {
							console.log('packet', cur, 'uploaded');
							o.cur++;
							info.t = 'uploading... ' + Math.floor(cur / total * 100) + '%';
							uploadPacks(o);
						}
					});
				}

				fn.upload = function () {
					var ops = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

					if (!finalDataURL) return info.t = 'empty file data';
					var packsize = 40000; // split our data into chunks of 40KB
					fetch(finalDataURL).then(function (res) {
						return res.blob();
					}).then(function (blob) {
						console.log(blob);
						if (blob.size > 4000000) return info.t = 'too large file';
						// console.log(blob)
						var packs = [];
						for (var i = 0, l = Math.floor(blob.size / packsize); i <= l; i++) {
							packs.push(blob.slice(i * packsize, i * packsize + packsize));
						}
						upload_b.el.hide();
						uploadPacks({
							arr: packs,
							cur: 0,
							loid: f_gen_loid(),
							type: ops.type || 'orig'
						});
					});
				};

				fn.cancel();

				return fn;
			}();

			function readURL(input) {

				if (input.files && input.files[0]) {
					var reader = new FileReader();

					reader.onload = function (e) {
						previewer.open(e.target.result);
					};

					reader.readAsDataURL(input.files[0]);
				}
			}
			return {
				extend: {
					set: function set(v) {
						// 
					}
				},
				init: function init() {
					return content;
				}
			};
		});

		return {
			state: {
				class: 'form'
			},
			extend: {
				title: 'Settings',
				theme: theme,
				profile_photo: profile_photo
			},
			groups: 'route',
			initLater: function initLater() {
				this.DClist([theme.init(), profile_photo.init()]);
				return this;
			}
		};
	});

	var about_route = f_dc_temp(function () {
		var descr = f_dc_temp({
			state: {
				html: '<div class="back_line inlb" style="margin: 20px 0;padding: 0 10px;">MEXY.PRO is all you need to interact with others in this world</div>'
			}
		});
		var logo = f_dc_temp();
		return {
			state: {
				class: 'form center'
			},
			extend: {
				title: 'About'
			},
			groups: 'route',
			initLater: function initLater() {
				logo_canvas.run(logo);
				this.DClist([logo, descr, app_short_descr]);
				return this;
			}
		};
	});

	window.onpopstate = function () {
		route_change(route_get(), 0);
	};
	DC.onwindow('resize', function () {
		f_window_resize();
		if (g_chat_active) {
			chat.adapt();
		}
	});
	!function () {
		var gesture, startx, starty;
		var supportsPassive = false;
		document.createElement("div").addEventListener("test", function () {}, {
			get passive() {
				supportsPassive = true;
				return false;
			}
		});
		window.addEventListener('touchstart', function (e) {
			// var touches = e.changedTouches;
			// for (var i = 0; i < touches.length; i++) {
			// 	console.log("touchstart:" + i + ".", touches[i]);
			// }
			var ww = window.innerWidth;
			var touch = e.changedTouches[0];
			startx = touch.clientX;
			starty = touch.clientY;
			if (!supportsPassive) f_preventDefault(e);
			gesture = 1;
		}, supportsPassive ? { passive: true } : false);
		window.addEventListener('touchmove', function (e) {
			if (g_drag_event) {
				if (mm.f) {
					mm.f(e);
				}
				return;
			}
			var ww = window.innerWidth;
			var touch = e.changedTouches[0];
			var x = touch.clientX,
			    y = touch.clientY;
			if (gesture) {
				if (!supportsPassive) f_preventDefault(e);
				if (Math.abs(x - startx) > 35) {
					menu.toggle('bottom');
					gesture = 0;
				} else if (Math.abs(y - starty) > 15) {
					gesture = 0;
				}
			}
		}, supportsPassive ? { passive: true } : false);
		DC.onwindow('touchend', function (e) {
			startx = 0;
			gesture = 0;
			g_drag_event = 0;
			mm = {};
		});
	}();
	DC.onwindow('mousedown', function (e) {
		if (e.button == 2) {
			g_context_start_point = [e.clientX, e.clientY];
		} else if (g_context_opened) {

			context.close();
		}
	});
	DC.onwindow('mousemove', function (e) {
		if (mm.f) {
			mm.f(e);
		}
	});
	DC.onwindow('mouseup', function () {
		mm = {};
	});
	DC.onwindow('contextmenu', function (e) {
		if (g_context_start_point) {
			var points = g_context_start_point;
			g_context_start_point = 0;
			var x = e.clientX,
			    y = e.clientY,
			    dx = points[0] - x,
			    dy = points[1] - y,
			    d = dx * dx + dy * dy,
			    threshold = 12;
			if (d > threshold * threshold) {

				context.close();
				if (x - points[0] > threshold) {
					history.forward();
				} else if (points[0] - x > threshold) {
					history.back();
				}
				return f_preventDefault(e);
			}
		}
		// if(!e.ctrlKey)context.open();
		if (!e.ctrlKey && e.which == 3) {
			f_preventDefault(e);
			menu.toggle();
		}
	});
	DC.onwindow('keydown', function (e) {
		if (e.altKey) {
			f_preventDefault(e);
			menu.toggle();
		}
		if (g_chat_active) {
			var inp = String.fromCharCode(e.keyCode);
			if (/[а-яёa-z0-9-_!-+ )]/i.test(inp)) chat.focus();
		}
	});

	!function () {
		var production = location.hostname === 'mexy.pro';
		var port = production ? 8443 : location.port;
		if (production && location.protocol != 'https:') location.protocol = 'https:';
		var host = production ? 'mexy-lepta.rhcloud.com' : '';
		socket = io(host + ':' + port, { transports: ['websocket'], 'reconnectionAttempts': 5 });
	}();
	log.until('connecting...');
	socket.on('connect', function () {
		log.until();
		connected = 1;
		f_loadingHide();
		socket.sendBuffer = [];
		f_App_authorize();
	}).on('disconnect', function (v) {
		connected = 0;
		f_dc_emit('u_login');
	}).on('app_local_mode', function (v) {
		app_local_mode = 1;
	}).on('error', function (v) {
		log.until('socket error');
		// 
	});
	function f_socket_authorized() {
		// set App listeners after authorization
		socket.on('newm', function (v) {
			//new message
			chat.received(v);
		});
		socket.on('viewedm', function (v) {
			chat.viewed(v);
		});
		socket.on('typing', function (v) {
			chat.typing(v);
		});
		socket.on('contact_online', function (v) {
			f_known_people.online(v.uid, 1);
			f_dc_emit('contacts');
		});
		socket.on('contact_offline', function (v) {
			f_known_people.online(v.uid, 0);
			f_dc_emit('contacts');
		});
		socket.on('userdata', function (v) {
			// my userdata
			for (var s in v) {
				U.userdata[s] = v[s];
			}f_dc_emit('u_data');
		});
		socket.on('push', function (v) {
			// server says something else
		});
	}
	f_change_theme();
	f_window_resize();
	f_loadingShow('initialize...');

	// console.log(performance.now() - global_time);

	f_tab_is_active(f_tab_event); // add function to event
	f_tab_event();
});

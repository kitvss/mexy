var menu = f_dc_temp(function () {
	var dcom;
	var ctx = {};
	var m_back, content, friends, active_page, pages = [], my_picture, my_name;
	m_back = f_dc_temp({
		events: {
			click() {
				menu.close();
			}
		},
		init() {
			this.insertIn(bodytag).el.attr({ id: 'm_back' });
		}
	});
	friends = ctx.friends = f_dc_temp();
	function menu_item(a) {
		return f_dc_temp(function () {
			var self;
			return {
				getSelf(a) {
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
					here() {
						if (active_page) active_page.removeClass('here');
						self.addClass('here');
						active_page = self;
						dcom.close();
					}
				},
				events: {
					click(e) {
						f_preventDefault(e);
						route_change(self.state.page);
						self.here();
					}
				}
			}
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
			set(a) {
				this.el.css({ 'background-image': 'url(' + a + ')' });
			}
		},
		events: {
			u_data(){
				if(U.userdata.crop_photo){
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
			set(a) {
				this.t = a;
			}
		}
	});
	var last_user_state;
	var menu_items = f_dc_temp(function(){
		var position;
		return {
			extend: {
				set(where) {
					if(position != where){
						if (where == 'bottom') {
							menu_items.el.css({ bottom: 0, top: 'auto' });
						} else {
							menu_items.el.css({ bottom: 'auto', top: 0 });
						}
						position = where;
					}
				}
			},
			initLater() {
				if (last_user_state == f_user_authorized()) return;
				last_user_state = f_user_authorized();
				f_dc_list(content,[]);
				if (last_user_state) {
					this.parse(`
						<div class="menu-items">
							<div class="center" id="my_back_line">
								{mp}
								<div class="inlb" style="vertical-align:top;">
									{mnm}<br />
									</div>
							</div>
							{ac}
							{im}
							{sc}
							{friends}
							{st}
							{ab}
							<div class="back_line center" style="padding: 5px 0;margin-top: 15px;">{la}</div>
						</div>
						`, ctx).insertIn(content);
				} else {
					this.parse(`
						<div class="menu-items">
							{lg}
							{ab}
						</div>
						`, ctx).insertIn(content);
				}
				dcom.position();
			}
		}
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
			click() {
				dcom.open('top');
			},
			u_login() {
				f_user_authorized() ?
					my_name.set(U.name) :
					my_name.set('');
			}
		},
		extend: {
			open(position) {
				menu_items.set(position);
				opened = true;
				m_back.addClass('m_back_show');
				content.addClass('menu_opened');
			},
			close() {
				opened = false;
				m_back.removeClass('m_back_show');
				content.removeClass('menu_opened');
			},
			toggle(position){
				opened?
				dcom.close():
				dcom.open(position);
			},
			friends() {
				// ctx.friends.change({html:'hmmm'});
			},
			position() {
				var body = space.el.crec();
				var el = content.el;
				var m = el.crec();
				var ww = window.innerWidth;
				if (ww > body.width + 2 * m.width) {
					el.css({ right: body.right - body.width - m.width });
				} else {
					el.css({ right: 0 })
				}
			},
			activate(v) {
				pages.find(function (a) {
					if (a.state.page == v) {
						a.here();
						return;
					}
				});
			},
			set_my_pic(a) {
				my_picture.set(a);
			},
		},
		init() {
			dcom = this;
			this
				.insertIn(head);
			menu_items.init();
			if (f_user_authorized()) dcom.friends();
		}
	}
});

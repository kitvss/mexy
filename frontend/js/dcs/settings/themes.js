var theme = f_dc_temp(function () {
	var ctx = {};
	var dcom, email, button, themes = [], active_item, active_theme, saved_theme, button;
	function theme_item(a) {
		return f_dc_temp(function () {
			var self;
			return {
				getSelf: function (a) {
					self = a;
				},
				eltype: 'div',
				state: {
					class: 'choose_theme choose_radio',
					text: a.tx
				},
				data: {
					theme: a.t,
				},
				extend: {
					sel: function () {
						if (active_item) active_item.removeClass('selected_radio');
						self.addClass('selected_radio');
						active_item = self;
						saved_theme != active_theme ? button.el.show() : button.el.hide();
					}
				},
				events: {
					click: function (e) {
						f_preventDefault(e);
						self.sel();
						f_change_theme(a.t);
					}
				}
			}
		});
	}
	button = ctx.bt = f_dc_temp({
		eltype: 'button',
		state: {
			class: 'b',
			text: 'save'
		},
		events: {
			click: function (e) {
				f_preventDefault(e);
				var theme = active_theme;
				if (!theme) theme = '';
				f_loadingShow();
				f_semit('settings', { prop: 'theme', val: theme }, res => {
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
		init: function () {
			this.parse(`
					<div>
						<p>Select main theme:</p>
						<div class="center">
							{bw}
							{dm}
							{bm}
							{gl}
							{eb}
						</div>
						<div>{bt}</div>
					</div>
					`, ctx)
		}
	});
	return {
		extend: {
			set: function (v, saved) {
				var prefix = app_local_mode ? '/raw_' : '/';
				themes.find(function (a) {
					if (a.data.theme == v) {
						if (css_link.el.attr('href') != prefix + 'css/' + U.css.theme + '.css?v=' + App_version) {
							css_link.el.attr({ href: prefix + 'css/' + U.css.theme + '.css?v=' + App_version });
							active_theme = v;
						}
						if(saved){
							saved_theme = v;
						}
						a.sel();
						return;
					}
				});
			}
		},
		init: function () {
			return theme_items;
		}
	}
});

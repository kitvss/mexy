var search = f_dc_temp(function () {
	function f_draw_user_search(obj) {
		var dcs = [], cur = 0;
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
		if(uid != U.id){
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
					click: function () {
						if (obj.status != 1) {
							f_loadingShow();
							var data = { target: uid };
							f_semit('contact',{
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
			placeholder: 'Type name',
		},
		extend: {
			fail: function () {
				f_pulse_once(input);
				input.el.focus();
			}
		},
		events: {
			keypress: function (e) {
				if(this.value.length) clearbutton.el.show('inline-block');
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
			click: function (e) {
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
			click: function (e) {
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
			is: function (v) {
				text_result.el.show('');
				text_result.t = v;
			},
			fail: function (v) {
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
		init: function () {
			this
				.DClist([
					temp,
					input,
					clearbutton
				]);
		}
	});
	search_div_result = f_dc_temp();
	return {
		extend: {
			res: function (dcs) {
				text_result.is('hey, there are results:');
				search_div_result.t = '';
				dcs.map(function (v) {
					v.insertIn(search_div_result);
				});
			},
			fail: function () {
				text_result.fail();
			},
			clear: function () {
				text_result.el.hide();
				input.v = '';
				search_div_result.t = '';
			}
		},
		init: function () {
			this.clear();
			this
				.DClist([
					search_div,
					text_result,
					search_div_result
				]);
			return this;
		}
	}
});

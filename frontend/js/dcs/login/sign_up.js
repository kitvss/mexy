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
			keydown(e) {
				if (e.keyCode == 13) send();
			},
			input() {
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
			keydown(e) {
				if (e.keyCode == 13) send();
			},
			input() {
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
			keydown(e) {
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
			keydown(e) {
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
			keydown(e) {
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
			click() {
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
					} else
						if (data.ok) {
							text = 'Success! Check your inbox!';
						}
					update(text);
				})
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
		result.t =  v;
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
			click: function (e) {
				
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
			click(){
				signup_form.el.show('inline-block');
				show_b.el.hide();
			}
		}
	});
	var signup_form = f_dc_temp().parse(`
	<div style="display: inline-block;margin-bottom: 80px;" class="enter_form">
		<div class="back_line">Sign up with email:</div>
		<div style="padding-right: 22px;">
			{fn}<br />
			{sn}<br />
			{em}<br />
			{a}<br />
			{b}<br />
			{c}{d}
		</div>
	</div>`,{
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
			fail: function (v) {
				f_pulse_once(dc);
				update(v);
			}
		},
		init: function () {
			dc = this;
			this.parse(`
			<div>{a}{b}
			</div>
			`, {
				a: show_b,
				b: signup_form
			});
		}
	}
});

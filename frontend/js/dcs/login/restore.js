var restore_box_1 = f_dc_temp(function () {
	var ctx = {};
	var dcom, result, email;
	result = ctx.rs = f_dc_temp(function () {
		var self;
		return {
			getSelf: function (a) {
				self = a;
			},
			extend: {
				is: function (v) {
					self.t = v;
				}
			},
			attrs: {
				class: 'form',
			}
		}
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
			keydown(e) {
				if (e.keyCode == 13) send(e);
			},
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
			click: function (e) {
				if (!f_email_valid(email.v)) {
					dcom.fail('invalid email');
					email.el.focus();
					return;
				}
				if (loading.busy) return;
				f_loadingShow();
				socket.emit('restore', { email: email.v }, res => {
					f_loadingHide();
					if (res.reason) {
						result.is(res.reason);
					} else {
						if(res.ok) result.is('Check your inbox!');
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
			click: function (e) {
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
			fail: function (v) {
				f_pulse_once(dcom);
				result.is(v);
			},
			appear: function () {
				dcom.el.show('inline-block');
			}
		},
		init: function () {
			dcom = this;
			this
				.parse(`
			<div style="display: inline-block;" class="enter_form">
				<div class="back_line">Reset password via email:</div>
				<div style="padding-right: 22px;">
					{em}
				</div>
				{bt}{btc}
				{rs}
			</div>
			`, ctx);
			this.el.hide();
		}
	}
});

var restore_header = f_dc_temp({
	state: {
		text: 'Create new password'
	}
});

var restore_email_info = f_dc_temp();

var restore_box_2 = f_dc_temp(function(){
	var ctx = {};
	var dcom, result, pass1;
	result = ctx.rs = f_dc_temp(function () {
		var self;
		return {
			getSelf: function (a) {
				self = a;
			},
			extend: {
				is: function (v) {
					self.t = v;
				}
			},
			attrs: {
				class: 'form',
			}
		}
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
			keydown(e) {
				if (e.keyCode == 13) send(e);
			},
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
			keydown(e) {
				if (e.keyCode == 13) send(e);
			},
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
			click: function (e) {
				var p1 = pass1.v;
				var p2 = pass2.v;
				if(!p1) return pass1.el.focus();
				if (p1.length < 8) {
					dcom.fail('invalid password');
					pass1.el.focus();
					return;
				}
				if(!p2) return pass2.el.focus();
				if (p2 !== p1) {
					dcom.fail('password mismatch');
					pass2.el.focus();
					return;
				}
				if (loading.busy) return;
				f_loadingShow();
				socket.emit('change_pass', { email: window.restore_email, key: window.restore_key, newpass: pass1.v }, res => {
					f_loadingHide();
					if (res.reason) {
						result.is(res.reason);
					} else {
						if(res.ok){
							f_dc_list(restore_box_2, [
								success_box,
								go_button
							]);
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
			click: function (e) {
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
			click(){
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
			fail: function (v) {
				f_pulse_once(dcom);
				result.is(v);
			},
			appear: function () {
				dcom.el.show('inline-block');
			}
		},
		init: function () {
			dcom = this;
			this
				.parse(`
			<div style="display: inline-block;" class="enter_form">
				<div class="back_line">remember it:</div>
				<div style="padding-right: 22px;">
					{p1}<br />
					{p2}
				</div>
				{bt}{btc}
				{rs}
			</div>
			`, ctx);
		}
	}
});
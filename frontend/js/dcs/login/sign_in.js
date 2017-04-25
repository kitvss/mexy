var sign_in_box = f_dc_temp(function(){
	var ctx={};
	var dcom,result,login,password,button;
	result = ctx.rs = f_dc_temp(function(){
		var self;
		return {
			getSelf: function(a){
				self=a;
			},
			extend: {
				is: function(v){
					self.t = v;
				}
			},
			attrs: {
				class: 'form',
			}
		}
	});
	login = ctx.em = f_dc_temp({
		eltype: 'input',
		attrs: {
			class: 'inp',
			placeholder: 'login',
			maxlength: 80
		},
		events: {
			keydown(e) {
				if (e.keyCode == 13) send(e);
			},
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
			keydown(e) {
				if (e.keyCode == 13) send(e);
			},
		}
	});
	button = ctx.bt = f_dc_temp({
		eltype: 'button',
		attrs: {
			class: 'b',
		},
		state: {
			html: 'login'
		},
		events: {
			click: function(e){
				f_preventDefault(e);
				var loginval=login.el.value;
				// if(!f_email_valid(loginval)){
				// 	dcom.fail('invalid email');
				// 	login.el.focus();
				// 	return;
				// }
				if(loginval.length<4){
					dcom.fail('invalid login');
					login.el.focus();
					return;
				}
				var pas=password.el.value;
				if(pas.length<8){
					dcom.fail('invalid password');
					password.el.focus();
					return;
				}
				if(loading.busy)return;
				var data={
					login:loginval,
					pass:pas
				};
				loading.show();
				f_semit('signin', data, v => {
					loading.hide();
					if(v.token){
						f_App_signin(v.token);
					}else{
						sign_in_box.fail('Nope, ' + v.reason);
					}
				});
				result.is('');
			}
		}
	});
	function send(e){
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
			click: function(){
				sign_in_box.el.hide();
				restore_box_1.appear();
			},
			mousedown: function(){
				
			}
		}
	});
	return {
		extend: {
			fail: function(v){
				f_pulse_once(dcom);
				result.is(v);
			}
		},
		init: function(){
			dcom=this;
			this
			.parse(`
			<form class="enter_form">
				<div class="back_line">Sign in:</div>
				<div style="padding-right: 22px;">
					{em}<br />
					{ps}
				</div>
				{bt}
				{ft}
				{rs}
			</form>
			`,ctx);
		}
	}
});

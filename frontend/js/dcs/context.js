var context = f_dc_temp(function(){
	var timer;
	var dcom = f_dc_temp({
		state: {
			class: 'contextmenu',
			html: `
			<div class="div">
				<div class="link">text</div>
				<div class="link">app</div>
				<div class="link">text</div>
			</div>
			<div class="div">
				<div class="link">app</div>
				<div class="link">access</div>
				<div class="link">app</div>
			</div>
			<br>
			<div class="div2">
				<div class="link">link</div>
				<div class="link">option</div>
				<div class="link">one more</div>
			</div>
			<div class="div2">
				<div class="link">link text</div>
				<div class="link">option</div>
				<div class="link">improve</div>
			</div>
			`
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
			open: function(){
				if(!g_context_opened){
					dcom.el.show();
					g_context_opened = 1;
				}
				if(timer){
					clearTimeout(timer);
					dcom.removeClass('show_up_once');
				}
				dcom.addClass('show_up_once');
				timer = setTimeout(function(){
					dcom.removeClass('show_up_once');
				},200);
				var sz = dcom.el.crec();
				dcom.el.css({left:e.clientX - sz.width/2,top:e.clientY - sz.height/2});
			},
			close: function(){
				if(g_context_opened){
					g_context_opened = 0;
					dcom.el.hide();
				}
			}
		},
		init: function(){
			dcom.insertIn(bodytag);
		}
	}
});

var friends = f_dc_temp(function(){
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
			click: function(){
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
			is: function(v){
				text_result.el.show('');
				text_result.change({text:v});
			},
			fail: function(v){
				f_pulse_once(text_result);
				v?text_result.is(v):text_result.is('No friends online');
			}
		}
	});
	text_result.el.hide();
	return {
		extend: {
			draw: function(){
				var html='',cur,obj=f_clone(P.on);
				var dc;
				list.change({html:''});
				var count=0;// number of friends online
				if(obj&&obj.length){
					text_result.el.hide();
					obj.map(function(cur){
						logr(cur)
						cur=f_get_one_u(cur);
						if(!cur)return;
						f_draw_user_from_search(cur).insertIn(list);
						count++;
					});
				}
				if(!count){
					text_result.fail();
				}
			},
			fail: function(){
				text_result.fail();
			}
		},
		init: function(){
			this
			.DClist([
					text_result,
					button,
					list
				]);
			return this;
		}
	}
});

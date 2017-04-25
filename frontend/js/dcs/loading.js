var loading = f_dc_temp(function(){
	var loading_back = f_dc_temp({
		init: function(){
			this.insertAs('#loading_back');
		}
	});
	var dc;
	var loading_animation=f_dc_temp({
		attrs: {
			style: 'background: none;',
			class: 'loading_div'
		}
	});
	var span1=f_dc_temp({
		eltype: 'span',
		state: {
			class: 'loading_ball'
		}
	});
	var span2=f_dc_temp({
		eltype: 'span'
	});
	var loading_text=f_dc_temp({
		attrs: {
			class: 'loading_text'
		}
	});
	return {
		extend: {
			hide: function(){
				this.el.hide();
				loading_back.el.hide();
				this.busy=false;
				loading_animation.clearIntervals();
			},
			show: function(text){
				if(text){
					loading_text.el.show();
					loading_text.t = text;
				}else{
					loading_text.el.hide();
				}
				this.el.show();
				loading_back.el.show();
				if(this.busy)return;
				this.busy=true;
			},
			busy: true
		},
		init: function(){
			dc=this;
			this.insertAs('#loading').t = '';
			loading_animation.DClist([span1,span2]);
			loading_animation.insertIn(dc);
			loading_text.insertIn(dc);
		}
	}
});

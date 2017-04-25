var log = f_dc_temp({
	attrs: {
		id: 'log'
	},
	extend: {
		is: function(v,t){
			if(!t)t=900;
			var self=this;
			this.el.show();
			this.t = v;
			self.clearTimeouts();
			this.timeout(function(){
				self.el.hide();
			},t);
		},
		long: function(v){
			this.is(v,2500);
		},
		until: function(v){
			if(typeof v=='undefined'){this.el.hide();return;}
			this.el.show();
			this.t = v;
		}
	},
	init: function(){
		this.insertIn(bodytag);
	}
});

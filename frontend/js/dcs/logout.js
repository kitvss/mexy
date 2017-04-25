var logout = f_dc_temp(function(){
	var self;
	return {
		getSelf: function(a){
			self=a;
		},
		eltype: 'a',
		state: {
			class: 'b',
			text: 'logout'
		},
		attrs: {
			href: '/logout',
			id: 'logout'
		},
		events: {
			click: function(e){
				
				socket.disconnect();
				delete Storage.token;
				Storage.clear();
				location.href='/';
			}
		}
	}
});

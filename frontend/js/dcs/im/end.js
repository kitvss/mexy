	return {
		state: {
			// html: '<div class="back_line inlb" style="margin: 20px 0;padding: 0 10px;">You have no friends yet</div>'
		},
		extend: {
			title: function(){
				var v=route_read_url_search();
				if(v.cid){
					return false;
				}else{
					return 'Instant messages';
				}
			}
		},
		groups: 'route',
		initLater: function(){
			var v=route_read_url_search();
			var content=[];
			if(v.cid){
				content.push(chat.init());
			}else{
				content.push(list.init());
			}
			this
			.DClist(content);
			return this;
		}
	}
});

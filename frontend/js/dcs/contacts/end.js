return {
	state: {
		class: 'form center',
	},
	groups: 'route',
	extend: {
		title: 'Contacts',
		onleave(){
			friends.stop();
		}
	},
	events: {
		u_login() {
			if (f_user_authorized()) friends.load();
		}
	},
	initLater: function () {
		friends.draw();
		this
			.DClist([
				search.init(),
				friends
			]);
		return this;
	}
}
});

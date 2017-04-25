var about_route = f_dc_temp(function(){
	var descr=f_dc_temp({
		state: {
			html: '<div class="back_line inlb" style="margin: 20px 0;padding: 0 10px;">MEXY.PRO is all you need to interact with others in this world</div>'
		}
	});
	var logo=f_dc_temp();
	return {
		state: {
			class: 'form center',
		},
		extend: {
			title: 'About'
		},
		groups: 'route',
		initLater: function(){
			logo_canvas.run(logo);
			this
			.DClist([
					logo,
					descr,
					app_short_descr
				]);
			return this;
		}
	}
});

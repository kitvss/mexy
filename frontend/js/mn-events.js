window.onpopstate = function () {
	route_change(route_get(), 0);
}
DC.onwindow('resize', function () {
	f_window_resize();
	if (g_chat_active) {
		chat.adapt();
	}
});
!function () {
	var gesture, startx, starty;
	var supportsPassive = false;
	document.createElement("div").addEventListener("test", function () { }, {
		get passive() {
			supportsPassive = true;
			return false;
		}
	});
	window.addEventListener('touchstart', function (e) {
		// var touches = e.changedTouches;
		// for (var i = 0; i < touches.length; i++) {
		// 	console.log("touchstart:" + i + ".", touches[i]);
		// }
		var ww = window.innerWidth;
		var touch = e.changedTouches[0];
		startx = touch.clientX;
		starty = touch.clientY;
		if (!supportsPassive) f_preventDefault(e);
		gesture = 1;
	}, supportsPassive ? { passive: true } : false);
	window.addEventListener('touchmove', function (e) {
		if(g_drag_event) {
			if (mm.f) { mm.f(e); }
			return;
		}
		var ww = window.innerWidth;
		var touch = e.changedTouches[0];
		var x = touch.clientX,
			y = touch.clientY;
		if (gesture) {
			if (!supportsPassive) f_preventDefault(e);
			if (Math.abs(x - startx) > 35) {
				menu.toggle('bottom');
				gesture = 0;
			} else if (Math.abs(y - starty) > 15) {
				gesture = 0;
			}
		}
	}, supportsPassive ? { passive: true } : false);
	DC.onwindow('touchend', function (e) {
		startx = 0;
		gesture = 0;
		g_drag_event = 0;
		mm = {};
	});
} ();
DC.onwindow('mousedown', function (e) {
	if (e.button == 2) {
		g_context_start_point = [e.clientX, e.clientY];
	} else
		if (g_context_opened) {

			context.close();
		}
});
DC.onwindow('mousemove', function (e) {
	if (mm.f) { mm.f(e); }
});
DC.onwindow('mouseup', function () {
	mm = {};
});
DC.onwindow('contextmenu', function (e) {
	if (g_context_start_point) {
		var points = g_context_start_point;
		g_context_start_point = 0;
		var x = e.clientX,
			y = e.clientY,
			dx = points[0] - x,
			dy = points[1] - y,
			d = dx * dx + dy * dy,
			threshold = 12;
		if (d > threshold * threshold) {

			context.close();
			if (x - points[0] > threshold) {
				history.forward();
			} else
				if (points[0] - x > threshold) {
					history.back();
				}
			return f_preventDefault(e);
		}
	}
	// if(!e.ctrlKey)context.open();
	if (!e.ctrlKey && e.which == 3) {
		f_preventDefault(e);
		menu.toggle();
	}
});
DC.onwindow('keydown', function (e) {
	if (e.altKey) {
		f_preventDefault(e);
		menu.toggle();
	}
	if (g_chat_active) {
		var inp = String.fromCharCode(e.keyCode);
		if (/[а-яёa-z0-9-_!-+ )]/i.test(inp)) chat.focus();
	}
});

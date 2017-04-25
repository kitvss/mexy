var logo_canvas = f_dc_temp(function () {
	var running = 1;
	var canvas_parent = f_dc_temp();
	var algorithm = (function () {
		'use strict';
		var canvas_dc = f_dc_temp({
			eltype: 'canvas',
			attrs: {
				style: 'top:0;left:0;'
			}
		});
		var image_size = 200;
		var image = new Image(image_size, image_size);
		image.src = '/img/logo.png';
		var image_ready = 0;
		image.onload = function () { image_ready = 1; };
		canvas_dc.insertIn(canvas_parent);
		canvas_parent.el.css({margin: '0 auto',overflow: 'hidden',position:'relative'});
		var canvas = canvas_dc.el;
		var ctx = canvas.getContext("2d");
		var cs = [], c, m = { ci: 0, all: [], length: 21, size: 4 }, gi = 0;
		var pulses = { all: [], now: 0, max: m.size * 3 };
		var timeout = 0;
		function new_pulse(a) {
			var c = {
				cx: a.cx,
				cy: a.cy,
				r: a.r,
				min: 1,
				max: a.max || 1.2,
				s: 1,
				sk: a.sk || .01
			}
			pulses.all[pulses.now] = c;
			pulses.now++;
			if (pulses.now >= pulses.max) pulses.now = 0;
		}
		function draw_pulses() {
			var c, a;
			ctx.save();
			ctx.lineWidth = 1;
			for (var i = 0; i < pulses.all.length; i++) {
				c = pulses.all[i];
				if (!c) continue;
				ctx.beginPath();
				ctx.arc(c.cx, c.cy, c.r * c.s, 0, PI2);
				a = 1 - (c.s - c.min) / (c.max - c.min);
				ctx.strokeStyle = 'rgba(70,70,70,' + a + ')';
				ctx.stroke();
				c.s += c.sk;
				if (c.s > c.max) pulses.all[i] = false;
			}
			ctx.restore();
		}
		var degk =  180 / Math.PI;
		var angle180 = 180 / degk;
		var PI2 = Math.PI * 2;
		function genSegmentPath(x, y, x2, y2, r1, r2) {
			var dx = x2 - x;
			var dy = y2 - y;

			var angle = Math.atan2(dx, dy);

			ctx.beginPath();

			var rotation = angle180 - angle;

			ctx.arc(x, y, r1, rotation, Math.PI + rotation);

			ctx.arc(x2, y2, r2, -angle, Math.PI - angle);

			ctx.closePath();
		}
		var clockspeed = 17;
		var prev_size_width;
		function move2() {
			if (!running) return;
			var size = canvas_parent.el.crec(),
				ww = size.width,
				wh = ww;//size.height;
			if (window.innerHeight < ww) ww = wh = window.innerHeight;
			if (!wh) {
				move2_again();
				return;
			}
			var
				x, y,
				a, a2, a3, b, last, curli,
				w, h, s, s2, shift, deg,
				x1, x2, y1, y2, left, top,
				mar, tar,
				r = ww > wh ? wh / 2.75 : ww / 2.75,
				k = r * .0015,
				maxm = r / 5,// max coordinate translation
				ci = m.ci,
				length = m.length;
			// if(ww>wh){
			// 	ww=wh;
			// }else if(wh>ww){
			// 	wh=ww;
			// }
			var cx = ww / 2,
				cy = wh / 2;
			// fit canvas to window size with autoscaling for HDPI
			var devicePixelRatio = window.devicePixelRatio || 1,
				backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
					ctx.mozBackingStorePixelRatio ||
					ctx.msBackingStorePixelRatio ||
					ctx.oBackingStorePixelRatio ||
					ctx.backingStorePixelRatio || 1,
				ratio = devicePixelRatio / backingStoreRatio;
			if (devicePixelRatio !== backingStoreRatio) {

				var oldWidth = ww;
				var oldHeight = wh;

				canvas.width = oldWidth * ratio;
				canvas.height = oldHeight * ratio;

				canvas.style.width = oldWidth + 'px';
				canvas.style.height = oldHeight + 'px';

				ctx.scale(ratio, ratio);

			} else {
				canvas.width = ww;
				canvas.height = wh;
			}
			if(prev_size_width != canvas.width){
				prev_size_width = canvas.width;
			}
			ctx.beginPath();
			ctx.arc(cx, cy, r, 0, PI2);
			ctx.fillStyle = 'rgba(255, 255, 255,.75)';
			ctx.fill();
			if (image_ready) {
				a = image_size;
				if (a > ww / 2) a = ww / 2;
				ctx.drawImage(image, cx - a / 2, cy - a / 2, a, a);
			}
			draw_pulses();
			for (var li = 0; li < m.size; li++) {
				if (!m.all[li]) {
					m.all[li] = { arr: [], last: false };
				}
				curli = m.all[li];
				mar = curli.arr;
				last = curli.last;
				if (!last) {
					curli.last = last = {
						vr: 100,
						imin: 5,
						imax: 15
					}
					last.vx = randix(-last.vr, last.vr) / last.vr + .1;
					last.vy = randix(-last.vr, last.vr) / last.vr + .1;
					last.x = randi(0, ww);
					last.y = randi(0, wh);
					// last.x=cx;
					// last.y=cy;
					last.i = randi(last.imin, last.imax);
				}
				last.sx = randi(maxm / 10, maxm);
				last.sy = randi(maxm / 10, maxm);
				a = {
					x: last.vx * last.sx,
					y: last.vy * last.sy
				}
				x = last.x + a.x;
				y = last.y + a.y;
				// in boundaries of circle
				if (Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) > r) {
					a = { x: x - cx, y: cy - y };
					a.a2 = Math.atan2(a.x, a.y);
					x = cx + r * Math.cos(a.a2 - Math.PI / 2);
					y = cy + r * Math.sin(a.a2 - Math.PI / 2);
					last.vx = -last.vx;
					last.vy = -last.vy;
					a = r / 50;
					new_pulse({ r: a, cx: x, cy: y, max: a * 3, sk: a / 10 });
					// new_pulse({r:r,cx:cx,cy:cy});
				}
				last.x = x;
				last.y = y;
				last.i--;
				if (last.i < last.imin) {
					last.vx = randix(-last.vr, last.vr) / last.vr + .1;
					last.vy = randix(-last.vr, last.vr) / last.vr + .1;
					last.i = randi(last.imin, last.imax);
				}
				mar[m.ci] = {
					x: x,
					y: y
				}
				a3 = [];
				if (mar.length > 1) {
					tar = [];
					for (var i = ci; i >= 0; i--) {
						tar.push(mar[i]);
						a3.push([i, mar[i].x]);
						if (i == 0) { i = mar.length; } else { if (i == mar.length) i = -1; }
						if (tar.length >= mar.length) i = -1;
					}
				} else {
					tar = mar;
				}
				ctx.lineCap = 'round';
				ctx.lineWidth = 5;
				for (let i = 0; i < length; i++) {
					c = cs[i];
					s = tar[i];
					s2 = tar[i + 1];
					if (s2) {
						if (li == 0) { ctx.fillStyle = 'rgba(0, 0, 0, ' + (1 - i / length) + ')'; } else
							if (li == 1) { ctx.fillStyle = 'rgba(235, 0, 0, ' + (1 - i / length) + ')'; } else
								if (li == 2) { ctx.fillStyle = 'rgba(15, 135, 235, ' + (1 - i / length) + ')'; } else
									if (li == 3) { ctx.fillStyle = 'rgba(100, 100, 250, ' + (1 - i / length) + ')'; }
						let r = i*k;
						if(r < 1) r = 1;
						genSegmentPath(s.x,s.y,s2.x,s2.y,r,r);
						ctx.fill();
					}
				}
			}
			m.ci++;
			if (m.ci == length) m.ci = 0;
			move2_again();
		}
		function move2_again() {
			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(move2, clockspeed);
		}
		function randi(min, max) {
			return Math.floor(Math.random() * (max + 1 - min)) + min;
		}
		function randix(min, max) {
			var type = randi(0, 1);
			if (type) {
				var r = randi(1, max);
			} else {
				var r = randi(min, -1);
			}
			return r;
		}
		return {
			run: function () {
				running = 1;
				move2();
			},
			stop: function () {
				running = 0;
			}
		}

	} ());
	return {
		extend: {
			run: function (dc, opts) {
				if (dc) canvas_parent.insertIn(dc);
				algorithm.run();
				if (!opts) opts = {};
				var sz = opts.sz;
				if (!sz) sz = 500;
				canvas_parent.el.css({ 'max-width': sz });
			},
			stop: function () {
				if (!running) return;
				algorithm.stop();
			}
		},
		init: function () {
			this.el = canvas_parent.el;
		}
	}
});

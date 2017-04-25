var friends = f_dc_temp(function() {
    var list = f_dc_temp({
        state: {
            class: 'contacts_list'
        }
    });
    var waitlist = f_dc_temp();
    var button = f_dc_temp({
        eltype: 'button',
        state: {
            class: 'b',
            text: 'refresh'
        },
        events: {
            click: function() {
                f_semit('contact', { act: 'show_all' }, data => {
                    if (data.arr) {
                        f_semit('contact', { act: 'show_userdata_lots', idarr: data.arr }, data => {
                            if (data.arr) {
                                for (var uid in data.arr) {
                                    var c = data.arr[uid];
                                    if (c) { c.forEach(s => f_known_people.updateData(uid, s)); }
                                }
                            }
                        });
                        data.arr.forEach(c => {
                            c.status = 1;
                            if (c.last_v) c.last_v = new Date(c.last_v).toISOString();
                            f_known_people.add(c._id, c);
                            if (c.online) f_known_people.online(c._id, 1);
                        });
                        friends.draw();
                    }
                })
                search.clear();
            }
        }
    });
    var text_result = f_dc_temp({
        attrs: {
            class: 'center back_line inlb'
        },
        extend: {
            is: function(v) {
                text_result.el.show();
                text_result.t = v;
            },
            fail: function(v) {
                f_pulse_once(text_result);
                v ? text_result.is(v) : text_result.is('You have no friends yet');
            }
        }
    });
    text_result.el.hide();

    function stop_items_timers() {
        for (var uid in items) {
            var user = items[uid];
            if (user.timer) user.timer.stop();
        }
    }

    function start_items_timers() {
        for (var uid in items) {
            var user = items[uid];
            if (user.timer) user.update();
        }
    }

    var items = {};
    return {
        extend: {
            draw: function() {
                var friends = f_clone(f_known_people.getFriends());
                // waitlist.change({ html: '' });
                // if (obj1 && obj1.length) {
                // 	text_result.el.hide();
                // 	for (var uid in obj1) {
                // 		if (uid == 'length') continue;
                // 		f_draw_user_from_search(obj1[uid]).insertIn(waitlist);
                // 	}
                // }
                if (friends) {
                    text_result.el.hide();
                    for (var uid in friends) {
                        if (uid == 'length') continue;
                        if (items[uid]) continue;
                        items[uid] = f_draw_friend_item(friends[uid]).insertIn(list);
                    }
                    start_items_timers();
                } else {
                    text_result.fail();
                }
            },
            fail: function() {
                text_result.fail();
            },
            load() {
                button.onclick();
            },
            stop() {
                stop_items_timers();
            },
        },
        init: function() {
            this
                .DClist([
                    text_result,
                    waitlist,
                    list
                ]);
            return this;
        }
    }
});

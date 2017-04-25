var chat = f_dc_temp(function () {
    var ctx = {}, box_chat, over_chat, under_chat, sendbt, m_lastmid, interlocutor_uid, m_cid, m_gid = 1, have_unread_cid, my_unread_messages, all_messages;

    function reset_vars() {
        g_chat_active = 0;
        append_message.reset();
        temp_list = {};
        m_lastmid = '';
        m_cid = 0;
        last_typing_time_sent = 0;
        have_unread_cid = 0;
        my_unread_messages = {};
        all_messages = {};
    }

    function count_lines(str) {
        return (str.match(/[\n\r]/g) || []).length;
    }

    function set_last_mid_if(mid) {
        if (mid > m_lastmid) m_lastmid = mid;
    }

    var temp_list,
        inserted_m;// if inserted, typing container should be reinserted

    var audio = f_dc_temp({
        eltype: 'audio',
        events: {
            canplaythrough() {
                audio.ready = 1;
            },
            tab_active() {
                this.el.pause();
            }
        },
        init() {
            var src = f_dc_temp({
                eltype: 'source',
                attrs: {
                    src: '/other/15bells.mp3'
                },
            })
                .insertIn(this);
            this.play = function () {
                if (this.ready) {
                    this.el.currentTime = 0;
                    this.el.play();
                }
            }
        }
    });

    var append_message = (function () {
        var last_m_is_my, my, lright, fake, block_val, t2, sender,
            last_m_time, last_date_displayed;
        var pub_f = function (v, beforetarget) {
            my = fake = 0;
            lright = '';
            if (!v) {
                v = {};
                fake = 1;
                block_val = input.el.value;
                input.v = '';
            } else
                if (v._id && v.data) {
                    block_val = v.data;
                    set_last_mid_if(v._id);
                }
            var not_viewed = v.viewed === false;
            if (f_my_uid(v.sender)) { lright = ' lright'; my = 1; } else if (v.sender != interlocutor_uid) { f_close_chat_error(); return; }
            if (!my && not_viewed) have_unread_cid = v.cid;
            t2 = f_getDate(v.time);
            if (t2 != last_date_displayed) {
                f_dc_temp({
                    state: {
                        class: 'mdate',
                        text: t2
                    }
                }).insertIn(box_chat);
                last_date_displayed = t2;
            }
            var l = f_dc_temp({
                state: {
                    class: 'l' + lright
                }
            });
            var time = f_dc_temp({
                eltype: 'span',
                state: {
                    class: 'mtime',
                    text: fake ? '' : f_getTime(v.time)
                }
            });
            l.data.t = function (v) {
                time.t = f_getTime(v);
            }
            var block = f_dc_temp({
                state: {
                    class: 'block',
                    text: block_val
                },
                // events: {
                //     click() {
                //         console.log(l._id);
                //     }
                // }
            });
            if (my) {
                if (last_m_is_my != 1) {
                    last_m_is_my = 1;
                    sender = f_dc_temp({
                        state: {
                            class: 'm_sender_name',
                            text: 'Me:'
                        }
                    });
                    sender.insertIn(l);
                }
                var pulsar;
                if (v.viewed === false || fake) {
                    pulsar = f_dc_temp({
                        state: {
                            class: 'm_unread'
                        }
                    });
                    pulsar.insertIn(l);
                }
                time.insertIn(l);
                block.insertIn(l);
                if (fake) {
                    temp_list[m_gid] = l;
                    f_save_message({
                        data: block_val,
                        gid: m_gid
                    });
                }
            } else {
                if (last_m_is_my != 0) {
                    last_m_is_my = 0;
                    var u = f_known_people(interlocutor_uid);
                    var name = u.name.split(' ')[0];
                    sender = f_dc_temp({
                        state: {
                            class: 'm_sender_name',
                            text: name + ':'
                        }
                    });
                    sender.insertIn(l);
                }
                block.insertIn(l);
                time.insertIn(l);
                typing.stop();
            }
            if (beforetarget) {
                prepend_message(l.el, beforetarget);
            } else {
                l.insertIn(box_chat);
            }
            if (v._id) {
                l._id = v._id;
                if (my && not_viewed) my_unread_messages[v._id] = l;
                all_messages[v._id] = l;
            }
            l.read = () => { if (pulsar) pulsar.remove() };
            l.pulsar = pulsar;
            if (typing.is()) { // if typing
                typing.init();
            } else {
                inserted_m = 1;
            }
            if (!f_tab_is_active()) audio.play();
            f_appear_once(l);
            chat_scroll();
        }
        pub_f.reset = function () {
            last_m_is_my = null;
            last_m_time = 0;
            last_date_displayed = 0;
        }
        pub_f.nameBefore = function (beforetarget) {
            if (last_m_is_my != 1) {
                last_m_is_my = 1;
                sender = f_dc_temp({
                    state: {
                        class: 'm_sender_name',
                        text: 'Me:'
                    }
                });
                sender.render();
                beforetarget.insertBefore(sender.el, beforetarget.firstChild);
                chat_scroll();
            }
        }
        return pub_f;
    })();

    function chat_resize() {
        box_chat.el.css({ height: space.el.height() - 15 - head.el.height() - under_chat.el.height() });
    }

    function chat_scroll() {
        box_chat.el.scrollTop = box_chat.el.scrollHeight;
    }

    function prepend_message(el, target) {
        box_chat.el.insertBefore(el, target);
    }

    function f_save_message(o) {
        if (!m_cid) return f_logIs('wrong conversation');
        if (g_route_current == 'sc') return;
        var data = o.data;
        m_gid++;
        f_semit('im', {
            act: 'save', data: data, cid: m_cid, gid: o.gid, after: m_lastmid
        }, function (v) {
            if (v.gid && v.mid) {
                set_last_mid_if(v.mid);
                chat.oper({ ok: 1, gid: v.gid, mid: v.mid });
                if (v.ms) {
                    var target = all_messages[v.mid];
                    v.ms.reverse().forEach(m => {
                        append_message(m, target.el);
                    });
                    append_message.nameBefore(target.el);
                }
            } else {
                f_logLong(v.reason);
            }
        });
    }

    box_chat = f_dc_temp({
        state: {
            class: 'chat'
        }
    });
    var last_typing_time_sent, last_local_time_drawn;

    var input = ctx.in = f_dc_temp({
        eltype: 'textarea',
        attrs: {
            placeholder: 'Write a message',
            class: 'inp',
            id: 'textp'
        },
        state: {
            val: ''
        },
        events: {
            input: function (e) {
                var val = this.value;
                var lenlines = count_lines(val);
                var time = Date.now();
                if (time - last_local_time_drawn < 150) return;
                typing.draw({ uid: f_my_uid() });
                last_local_time_drawn = time;
                if (!f_known_people.isOnline(interlocutor_uid)) return;
                if (time - last_typing_time_sent < 700) return;
                last_typing_time_sent = time;
                f_semit('typing', { uid: interlocutor_uid });
            },
            keydown: function (e) {
                if (e.keyCode == 13 && !e.shiftKey) {
                    f_preventDefault(e);
                    sendbt.onclick();
                }
            }
        }
    });
    sendbt = ctx.sbt = f_dc_temp({
        eltype: 'button',
        state: {
            class: 'b',
            text: '➤'
        },
        attrs: {
            id: 'send'
        },
        events: {
            click: function () {
                var source = input.el;
                var val = source.value.trim();
                if (val.length > 500) { val = val.substr(0, 500); val = val.trim(); }
                if (val != source.value) input.v = val;
                source.focus();
                if (!val.length) return;
                input.v = val;
                append_message();
                typing.stop(1);
            }
        }
    });

    under_chat = f_dc_temp({
        init: function () {
            this.parse(`
				<div class="under_chat">
					<div style="padding: 0 50px 0 51px;position: relative;">
						{in}
						<input id="attach_f" type="button" class="b" value="+">
						{sbt}
					</div>
				</div>`, ctx);
        }
    });

    var typing = (function () {
        var my_div = f_dc_temp({
            state: {
                class: 'lright my_typing',
                html: '<div class="in_typing"></div>'
            }
        }),
            intl_div = f_dc_temp({
                state: {
                    class: 'in_typing'
                }
            }),
            displayed,
            container = f_dc_temp({
                state: {
                    class: 'typing_div'
                }
            }),
            last_div_height,
            my_timer,
            me_busy = 0,
            intl_busy = 0,
            intl_timer;

        var scroll = function () {
            var hright = my_div.el.crec().height;
            var h = container.el.crec().height;
            if (hright && h < hright) h = hright;
            if (h != last_div_height) { chat_scroll(); last_div_height = h; }
        }
        return {
            init() {
                container.insertIn(box_chat);
            },
            is() {
                return (me_busy || intl_busy) ? 1 : 0;
            },
            stop(me) { // stop drawing that person is typing
                if (me) {
                    if (!me_busy) return;
                    if (my_timer) clearTimeout(my_timer);
                    my_div.el.remove();
                    scroll();
                    me_busy = 0;
                } else {
                    if (!intl_busy) return;
                    if (intl_timer) clearTimeout(intl_timer);
                    intl_div.el.remove();
                    scroll();
                    intl_busy = 0;
                }
            },
            draw(obj) {
                if (inserted_m) { typing.init(); inserted_m = 0; }
                if (f_my_uid(obj.from)) {
                    my_div.insertIn(container);
                    if (my_timer) clearTimeout(my_timer);
                    me_busy = 1;
                    my_timer = setTimeout(function () {
                        typing.stop(1);
                    }, 1800);
                } else {
                    intl_div.insertIn(container);
                    if (intl_timer) clearTimeout(intl_timer);
                    intl_busy = 1;
                    intl_timer = setTimeout(function () {
                        typing.stop();
                    }, 1800);
                }
                scroll();
            }
        }
    })();

    function read_intl_messages() {
        if (g_chat_active && f_tab_is_active() && have_unread_cid && m_cid == have_unread_cid) {
            f_semit('im', {
                act: 'read',
                cid: have_unread_cid,
                before: m_lastmid
            }, res => {
                if (res.ok) have_unread_cid = 0;
            });
        }
    }

    function mark_my_messages_viewed(v) {
        if (g_chat_active && f_tab_is_active() && v.cid == m_cid) {
            for (var id in my_unread_messages) {
                if (v.before < id) continue;
                var l = my_unread_messages[id];
                l.read();
                delete my_unread_messages[id];
            }
        }
    }

    return {
        events: {
            tab_active() {
                read_intl_messages();
            }
        },
        extend: {
            start(data, reinit) {
                // here we initialize conversation
                // data should have info about interlocutor (target) and conversation id
                // to get `f_known_people(uid)` and `cid`
                g_chat_active = 1;
                if (data) {
                    interlocutor_uid = data.target;
                    m_cid = data.cid;
                }
                if (reinit) return route_init();
                f_semit('user', { act: 'is_online', uid: interlocutor_uid }, res => {
                    f_known_people.online(interlocutor_uid, res == 1);
                    head_intl.draw(interlocutor_uid);
                    chat.load();
                    chat.adapt();
                })
            },
            check() {
                var v = route_read_url_search();
                var cid = v.cid;
                if (cid == m_cid) return;
                if (cid) {
                    if (interlocutor_uid) {
                        m_cid = cid;
                        chat.start();
                    } else {
                        // load info about interlocutor - target
                        f_get_conversation_info(cid, function (err, uid) {
                            if (err) return f_close_chat_error();
                            chat.start({
                                cid: cid,
                                target: uid
                            });
                        });
                    }
                } else {
                    head_intl.hide();
                    g_chat_active = 0;
                }
            },
            adapt() {
                chat_resize();
                chat_scroll();
            },
            add(v) {
                if (v.length) {
                    v.reverse().forEach(function (v) { if (v._id > m_lastmid) append_message(v); });
                    read_intl_messages();
                    chat.adapt();
                }
            },
            load() {
                if (g_chat_active && m_cid) {
                    var ops = { act: 'load', cid: m_cid };
                    if (m_lastmid) ops.after = m_lastmid;
                    f_semit('im', ops, res => {
                        if (res.ok) chat.add(res.ok);
                    })
                } else {
                    console.log('unable to load ms')
                }
            },
            received(v) {
                if (v && m_cid == v.cid) chat.load();
            },
            viewed(v) {
                mark_my_messages_viewed(v);
            },
            oper(v) {
                if (v.ok) {
                    if (v.gid && v.mid) {
                        var gid = v.gid;
                        if (!temp_list[gid]) { f_logLong('strange thing happened'); return; }
                        var l;
                        my_unread_messages[v.mid] = l = temp_list[gid];
                        all_messages[v.mid] = l;
                        l._id = v.mid;
                        l.data.t();
                        delete temp_list[gid];
                    }
                    chat.adapt();
                }
            },
            focus() {
                input.el.focus();
            },
            typing(obj) {
                if (obj.from == interlocutor_uid) typing.draw(obj);
            },
            close() {
                reset_vars();
                head_intl.hide();
            }
        },
        initLater() {
            reset_vars();
            this
                .DClist([
                    box_chat,
                    under_chat
                ]);
            box_chat.t = '';
            typing.init();
            return this;
        }
    }
});

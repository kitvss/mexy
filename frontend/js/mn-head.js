// var global_time = performance.now();
DC.ready(function() {
    'use strict';

    DC.setPseudo([
        'u_login',
        'tab_active',
        'contacts',// when contacts changed online status
        'u_data',// when user data updated, for example user profile photo
    ]);

    const U = {};// for App and user profile settings
    U.authorized = 0;
    U.css = {};
    U.userdata = {};
    var app_local_mode;
    // end part

    var f_known_people = function() {
        var list = {};
        var online = {};
        var friends = {};

        // function update(uid, data){
        //     var u = list[uid];
        //     if(!u) return;
        //     for(var prop in data) {
        //         if(u[prop] != data[prop]) u[prop] = data[prop];
        //     }
        // }

        var fn = function(uid, cbfail, cbok) {
            var u = list[uid];
            if (!u) {
                if (!cbfail && !cbok) return false;
                return fn.load(uid, cbfail, cbok);
            }
            u = f_clone(u);
            if (cbfail && cbok) {
                cbok(u);
            } else {
                return u;
            }
        }

        fn.updateData = (uid, data) => {
            var u = list[uid];
            if(!u) return;
            for(var s in data)u.userdata[s] = data[s];
            user_data_eventer.emit(uid);
        }

        fn.add = (uid, data) => {
            data.online = data.online || online[uid] == 1;
            data.wasOnline = data.online;
            var u = list[uid];
            if(!u) {u = list[uid] = data;} else {
                for(var v in data) u[v] = data[v];
            }
            if(!u.userdata) u.userdata = {};
            if (data.status == 1) friends[uid] = data;
        }

        fn.load = (uid, cbfail, cbok) => {
            f_semit('user', { act: 'get_info', uid: uid }, res => {
                if (res.ok) {
                    fn.add(uid, res.ok);
                    cbok();
                } else {
                    cbfail();
                }
            })
        }

        fn.online = (uid, _true) => {
            online[uid] = _true ? 1 : 0;
            var u = list[uid]
            if (u) {
                u.online = _true == 1;
                if (!u.online && u.online != u.wasOnline) u.last_v = new Date().toISOString();
                u.wasOnline = u.online;
            }
        }

        fn.getFriends = function() {
            return friends;
        }

        fn.isOnline = (uid) => {
            return online[uid] == 1;
        }

        return fn;
    } ();

    var Storage = localStorage;
    // route vars
    var g_route_initial = 'contacts';
    var g_route_current;
    // end part

    var LQ = []; // loading queue array
    var mm = {};// for move objects data
    var curFile = {};

    // socket part
    var authenticated = 0;
    var socket;
    var connected = 0;// socket connected
    var intersen = 0;
    var semit_allowed = function() {
        var i = 0,
            limit = 170; // allow x requests per 10 second

        function down() {
            i -= limit;
            if (i < 0) i = 0;
        }
        setInterval(down, 10000);
        var fn = function() {
            var allow = i < limit;
            if (!allow) console.log('request limit exceeded');
            return allow;
        }
        fn.inc = function() {
            i++;
        }
        return fn;
    } ();
    // end part

    // delay part i.e. for socket
    var g_fast_delay = 90;
    var g_500_delay = 500;
    // end part

    // css dependent vars
    var g_pulse_css = 150; // in ms
    // end part

    // chat and secret talks vars
    var g_chat_active;
    var g_secret_active;
    // end part

    // other global vars
    var g_context_opened;
    var g_context_start_point;
    var g_drag_event;
    // end part


    var css_link = f_dc_temp({
        eltype: 'link',
        attrs: {
            rel: 'stylesheet'
        },
        init: function() {
            this.insertIn('head');
        }
    });

    var space = f_dc_temp({ init: function() { this.insertAs('.body'); } });
    var bodytag = document.body;


    function clog(v) {
        setTimeout(function() {
            console.log(v);
        }, 10);
    }

    function logr() {
        console.log.apply(console, arguments);
    }

    var cloudinary = function(){
        var prefix = 'https://res.cloudinary.com/mexy-pro/image/upload/';
        var fn = function(id){
            var url = prefix + id;
            return url;
        }
        return fn;
    }();

    var user_data_eventer = function(){
        var users = {}, anyuser = [];
        var fn = function(uid,f){
            var a = users[uid];
            if(!a)a = users[uid] = [];
            a.push(f);
        };
        fn.any = function(f){
            anyuser.push(f);
        }
        fn.emit = function(uid){
            anyuser.forEach(f => f());
            var a = users[uid];
            if(!a)return;
            a.forEach(f => f());
        }
        return fn;
    }();
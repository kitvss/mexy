var page_title = f_dc_temp({
    state: {
        class: 'route_title'
    }
});

var routes_config;

function route_read_url_search() {
    var search = location.search.substr(1);
    search = search.split('&');
    var res = {}, a;
    search.map(function (v) {
        a = v.split('=');
        if (a.length == 2) res[a[0]] = a[1];
    });
    return res;
}

function route_set_url(v) {
    window.history.pushState(null, null, v);
}

function route_get() {
    return location.pathname.substr(1);
}

function route_go_pathname() {
    route_change(route_get());
}

function route_change(v, history) {
    var page;
    if (!g_route_current) g_route_current = v;
    if (typeof history == 'undefined') route_set_url(v);
    logo_canvas.stop();
    if (routes_config.notlast()) {
        page = routes_config(g_route_current);
        if (page && page.onleave) page.onleave();
        g_route_current = v;
        chat.close();
    }
    if (v == '') v = '/';
    if (connected) {
        if (!f_user_authorized()) {
            var route = v;
            space.t = '';
            switch (route) {
                case '/':
                    menu.activate(route);
                    space.DClist([
                        login_route.init()
                    ]);
                    break;
                case 'about':
                    menu.activate(route);
                    space.DClist([
                        about_route.init()
                    ]);
                    break;
                default:
                    route_change('/');
                    return;
            }
        } else {
            var route = v;
            if (route == '/') { route_change(g_route_initial); return; }
            page = routes_config(route);
            if (page) {
                menu.activate(route);
                var content = [];
                var title;
                if (route == 'im') {
                    title = page.title();
                    if (!g_chat_active) chat.check();
                } else {
                    title = page.title;
                }
                if (title) {
                    page_title.h = title;
                    page_title.el.show();
                    content.push(page_title);
                } else {
                    page_title.el.hide();
                }
                content.push(page);
                f_dc_list(space, content);
                if (g_chat_active) {
                    chat.adapt();
                }
            } else {
                space.t = '';
                log.until('undefined...');
            }
        }
    } else {
        loading.show();
    }
}

function route_init() {
    if (!routes_config) {
        routes_config = function () {
            var list = {
                'contacts': contacts_route,
                'im': im_route,
                'sc': sc_route,
                'settings': settings_route,
                'about': about_route,
            }
            var fn = function (name) {
                var route = list[name];
                if (!route) return false;
                return route.init();
            }
            var last;
            fn.notlast = function () {
                var url = location.href;
                var different = last != url;
                last = url;
                return different;
            }
            fn.notlast();
            return fn;
        } ();
    }
    route_change(route_get(), 0);
    menu.init();
    f_change_theme();
}

f_change_theme();
f_window_resize();
f_loadingShow('initialize...');

// console.log(performance.now() - global_time);

f_tab_is_active(f_tab_event); // add function to event
f_tab_event();
});
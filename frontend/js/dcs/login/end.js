return {
    state: {
        class: 'form center',
    },
    attrs: {
        style: 'padding-bottom: 120px;'
    },
    groups: 'route',
    initLater: function(){
        logo_canvas.run(logo);
        var arr;
        if(window.restore_email && window.restore_key){
            restore_email_info.h = 'for <b>' + window.restore_email + '</b>';
            arr = [
                logo,
                restore_header,
                restore_email_info,
                restore_box_2,
            ];
        } else {
            arr = [
                logo,
                app_short_descr,
                sign_in_box,
                restore_box_1,
                or_div,
                sign_up_box
            ];
        }
        this
        .DClist(arr);
        return this;
    }
}
});
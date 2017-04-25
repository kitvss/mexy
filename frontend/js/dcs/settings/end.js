return {
    state: {
        class: 'form',
    },
    extend: {
        title: 'Settings',
        theme: theme,
        profile_photo: profile_photo
    },
    groups: 'route',
    initLater: function(){
        this
        .DClist([
                theme.init(),
                profile_photo.init()
            ]);
        return this;
    }
}
});

var mn_components = [
  'src/js/mn-head.js',
  'src/js/mn-routes.js',
  'src/js/mn-functions.js',
];
mn_components = mn_components.concat([
  // dc stuff here
  'src/js/dcs/loading.js',
  'src/js/dcs/logo_canvas.js',
  'src/js/dcs/head.js',
  'src/js/dcs/head_intl.js',
  'src/js/dcs/logout.js',
  'src/js/dcs/menu.js',
  'src/js/dcs/context.js',
  'src/js/dcs/log.js',
  'src/js/dcs/app_short_descr.js',
  'src/js/dcs/chat.js',
  // login route
  'src/js/dcs/login/index.js',
  'src/js/dcs/login/restore.js',
  'src/js/dcs/login/sign_in.js',
  'src/js/dcs/login/sign_up.js',
  'src/js/dcs/login/end.js',
  // contacts route
  'src/js/dcs/contacts/index.js',
  'src/js/dcs/contacts/search.js',
  'src/js/dcs/contacts/friends.js',
  'src/js/dcs/contacts/end.js',
  // im route
  'src/js/dcs/im/index.js',
  'src/js/dcs/im/list.js',
  'src/js/dcs/im/end.js',
  // sc route
  'src/js/dcs/sc/index.js',
  'src/js/dcs/sc/friends.js',
  'src/js/dcs/sc/end.js',
  // settings route
  'src/js/dcs/settings/index.js',
  'src/js/dcs/settings/themes.js',
  'src/js/dcs/settings/profile_photo.js',
  'src/js/dcs/settings/end.js',
  // about route
  'src/js/dcs/about/index.js',
]);
mn_components = mn_components.concat([
  'src/js/mn-events.js',
  'src/js/mn-socket.js',
  'src/js/mn-end.js'
]);
module.exports = {
  mn_components: mn_components
}

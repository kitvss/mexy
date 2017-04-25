var compressor = require('node-minify');
var t = Date.now();
var mn_components = require('./minify_config').mn_components;
new compressor.minify({
  type: 'no-compress',
  fileIn: mn_components,
  fileOut: 'public/js/dev.js',
  callback: function (err, min) {
    if (err) {
      console.log(err);
      return;
    }
    t = Date.now() - t;
    console.log({finished: 'yes', elapsed: t})
  }
});
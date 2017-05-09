const Minify = require('node-minify').minify;
const t = Date.now();

new Minify({
  type: 'no-compress',
  fileIn: require('./minify_config').mn_components,
  fileOut: 'public/js/dev.js',
  callback(err, min) {
    if (err) return console.log(err);
    console.log(`Finished in  ${Date.now() - t} ms`)
  }
});
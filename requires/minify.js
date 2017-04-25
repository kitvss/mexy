module.exports = function (req, res) {
  const compressor = require('node-minify');
  let fs = require('fs');
  let t = Date.now();
  if (req.query.css) {
    let css_source_folder = 'public/raw_css/';
    let css_out_folder = 'public/css/';
    let css_files;

    function getFiles(dir, files_) {
      files_ = files_ || [];
      let files = fs.readdirSync(dir);
      for (let i in files) {
        let name = dir + files[i];
        if (fs.statSync(name).isDirectory()) {
          getFiles(name, files_);
        } else {
          // files_.push(name);
          files_.push(files[i]);
        }
      }
      return files_;
    }

    let exec = require('child_process').exec;
    let ern = 0;
    if (req.query.file) {
      css_files = [req.query.file];
    } else {
      css_files = getFiles(css_source_folder);
    }
    let length = css_files.length;
    let out = [];
    css_files.forEach(function (file) {
      exec('lessc --clean-css --autoprefix=">5%" ' + css_source_folder + file + ' > ' + css_out_folder + file,
        function (error, stdout, stderr) {
          out.push('<div style="color: green; margin-bottom: 20px;">' + out.length + ') ' + css_source_folder + file + '<br>out: ' + stdout + '<br>err: ' + stderr + '</div>');
          if (error !== null) {
            console.log('exec error: ' + error);
            ern++;
            return;
          } else {
            if (out.length == css_files.length) {
              res.send('time: ' + (Date.now() - t) + ' ms<br><br>' + out.join('-----------'));
            }
          }
        });
    });
    if (ern) {
      //
      res.send('Error. See console');
    }
    return;
  }
  let mn_components = require('./minify_config').mn_components;
  if (req.query.dev) {
    new compressor.minify({
      type: 'no-compress',
      fileIn: mn_components,
      fileOut: 'public/js/dev.js',
      callback: function (err, min) {
        if (err) {
          console.log(err);
          res.json({err: 'errors'});
          return;
        }
        t = Date.now() - t;
        res.json({finished: 'yes', type: 'dev', elapsed: t});
      }
    });
  } else {
    let concatenated_file = 'frontend/etc/mn.js';
    new compressor.minify({
      type: 'no-compress',
      fileIn: mn_components,
      fileOut: concatenated_file,
      callback: function (err, min) {
        if (err) {
          console.log(err);
          res.json({err: 'errors'});
          return;
        }
        require('child_process').exec('babel ' + concatenated_file + ' -o ' + concatenated_file,
          function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
              console.log('exec error: ' + error);
              res.sendStatus(500);
            } else {
              let type = 'gcc';
              let fileout = 'public/js/mn.js';
              new compressor.minify({
                type: type,
                fileIn: concatenated_file,
                fileOut: fileout,
                language: 'ECMASCRIPT5',
                callback: function (err, content) {
                  let i = 0;
                  if (err) {
                    i++;
                    console.log(err);
                  }
                  content = content.replace(/\\t/g, '');
                  fs.writeFile(fileout, content, 'utf8', function (err) {
                    if (err) {
                      res.json({err: err});
                      return;
                    }
                    t = Date.now() - t;
                    let say = 'no errors. success';
                    if (i) say = 'errors occured...';
                    res.json({finished: say, type: type, elapsed: t, file: fileout});
                  });
                }
              });
            }
          });
      }
    });
  }
}
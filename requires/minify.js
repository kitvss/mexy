/**
 * This module compiles css and js files for
 * usage in production on website
 */

import {minify as Minify} from 'node-minify';
import fs from 'fs';
import {exec} from 'child_process';
import {mn_components} from './minify_config';

function getFiles(dir, files_) {
  files_ = files_ || [];
  const files = fs.readdirSync(dir);
  files.forEach(name => {
    let path = dir + name;
    if (fs.statSync(path).isDirectory()) {
      getFiles(path, files_);
    } else {
      files_.push(name);
    }
  });
  return files_;
}

function cssOnly() {
  const css_source_folder = 'public/raw_css/';
  const css_out_folder = 'public/css/';
  const css_files = getFiles(css_source_folder);
  const out = [];
  const t = Date.now();

  css_files.forEach(function (file) {
    exec('lessc --clean-css --autoprefix=">5%" ' + css_source_folder + file + ' > ' + css_out_folder + file,
      (error, stdout, stderr) => {
        out.push(css_source_folder + file);
        if (error) return console.log('exec error: ' + error);

        if (out.length === css_files.length) console.log('Finished. Time: ' + (Date.now() - t), out);
      });
  });
}

function jsOnly() {
  const concatenated_file = 'frontend/temp/mn.js';
  const t = Date.now();
  const fileOut = 'public/js/mn.js';

  new Minify({
    type: 'no-compress',
    fileIn: mn_components,
    fileOut: concatenated_file,
    callback(err, min) {
      if (err) return console.log(err);

      exec('babel ' + concatenated_file + ' -o ' + concatenated_file,
        error => {
          if (error) return console.error('exec error: ' + error);

          new Minify({
            type: 'gcc',
            fileIn: concatenated_file,
            fileOut: fileOut,
            language: 'ECMASCRIPT5',
            callback(err, content) {
              if (err) return console.error(err);

              content = content.replace(/\\t/g, '');
              fs.writeFile(fileOut, content, 'utf8', err => {
                if (err) return console.error('error', err);
                console.log(`Finished "${fileOut}". Elapsed ${Date.now() - t}`);
              });
            }
          });
        });
    }
  });
}

process.argv.forEach(val => {
  if (val === '-css') cssOnly();
  if (val === '-js') jsOnly();
});
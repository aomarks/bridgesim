// configuration options
var target = 'index.html';
var buildDir = './build/';
var buildJS = 'build.js';
var buildHTML = 'index.html';

var exec = require('child_process').exec;
var fs = require('fs');

var SVGO = require('svgo');
var PATH = require('path');
var FS = require('fs');
var UglifyJS = require('uglify-js');
var crisper = require('crisper');
var minify = require('html-minifier').minify;
var vulcanize = require('vulcanize');

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

console.log('Compiling TypeScript...');

exec('tsc', function(error, stdout, stderr) {
  console.log(stdout);
  if (error) {
    console.log('error running tsc', error, stdout, stderr);
    return;
  }
  runVulcanize();
});

console.log('Copying images and textures...');
function puts(error, stdout, stderr) {
  if (stdout) {
    console.log(stdout);
  }
  if (stderr) {
    console.log(stderr);
  }
  if (error) {
    console.log('error copying', error, stdout, stderr);
  }
}
exec('cp -r images ' + buildDir, function(err, stdout, stderr) {
  puts(err, stdout, stderr);
  if (err) {
    return;
  }
  optimizeFolder(buildDir + 'images', {}, null);
});
exec('cp -r textures ' + buildDir, puts);

function runVulcanize() {
  console.log('Vulcanizing...');

  var vulcan = new vulcanize({
    abspath: '.',
    excludes: [],
    stripExcludes: [],
    inlineScripts: true,
    inlineCss: true,
    addedImports: [],
    redirects: [],
    implicitStrip: true,
    stripComments: true
  });
  vulcan.process(target, function(err, inlinedHtml) {
    if (err) {
      console.log('error vulcanizing', err);
      return;
    }
    runCrisper(inlinedHtml);
  });
}

function runCrisper(html) {
  console.log('Splitting HTML and JS...');
  var out = crisper({
    source: html,
    jsFileName: buildJS,
    scriptInHead: true,       // default true
    onlySplit: false,         // default false
    alwaysWriteScript: false  // default false
  });
  runMinify(out.html, out.js);
}

function runMinify(html, js) {
  console.log('Minifying...');
  var minHtml = runHtmlMinify(html);
  var jsResults = runJSMinify(js);
  var minJS = jsResults.code;
  var minJSMap = jsResults.map;

  var err = fs.writeFileSync(buildDir + buildHTML, minHtml);
  if (err) {
    console.log(err);
  }
  var err = fs.writeFileSync(buildDir + buildJS, minJS);
  if (err) {
    console.log(err);
  }
  var err = fs.writeFileSync(buildDir + buildJS + '.map', minJSMap);
  if (err) {
    console.log(err);
  }
}

function runHtmlMinify(html) {
  console.log('Minifying html...');
  var results = minify(html, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    customAttrAssign: [/\$=/],
    minifyCSS: true,
    removeAttributeQuotes: true,
    removeComments: true,
  });
  var compressed = (1 - results.length / html.length) * 100;
  console.log(' :: compressed ' + compressed.toFixed(1) + '%');
  return results;
}

function runJSMinify(js) {
  console.log('Minifying JS...');
  var results = UglifyJS.minify(js, {
    fromString: true,
    warnings: true,
    mangle: true,
    compress: true,
    outSourceMap: buildJS + '.map'
  });
  var compressed = (1 - results.code.length / js.length) * 100;
  console.log(' :: compressed ' + compressed.toFixed(1) + '%');
  return results;
}


// SVGO optimization
var regSVGFile = /\.svg$/;
function optimizeFolder(dir, config, output) {
  var svgo = new SVGO(config);
  if (!config.quiet) {
    console.log('Processing directory \'' + dir + '\':\n');
  }

  // absoluted folder path
  var path = PATH.resolve(dir);

  function printTimeInfo(time) { console.log('Done in ' + time + ' ms!'); }

  function printProfitInfo(inBytes, outBytes) {
    var profitPercents = 100 - outBytes * 100 / inBytes;

    console.log(
        (Math.round((inBytes / 1024) * 1000) / 1000) + ' KiB' +
        (profitPercents < 0 ? ' + ' : ' - ') +
        String(Math.abs((Math.round(profitPercents * 10) / 10)) + '%').green +
        ' = ' + (Math.round((outBytes / 1024) * 1000) / 1000) + ' KiB\n');
  }

  // list folder content
  FS.readdir(path, function(err, files) {

    if (err) {
      console.error(err);
      return;
    }

    if (!files.length) {
      console.log('Directory \'' + dir + '\' is empty.');
      return;
    }

    var i = 0, found = false;

    function optimizeFile(file) {
      // absoluted file path
      var filepath = PATH.resolve(path, file);
      var outfilepath = output ? PATH.resolve(output, file) : filepath;

      // check if file name matches *.svg
      if (regSVGFile.test(filepath)) {
        found = true;
        FS.readFile(filepath, 'utf8', function(err, data) {

          if (err) {
            console.error(err);
            return;
          }

          var startTime = Date.now(), time,
              inBytes = Buffer.byteLength(data, 'utf8'), outBytes;

          svgo.optimize(data, function(result) {

            if (result.error) {
              console.error(result.error);
              return;
            }

            outBytes = Buffer.byteLength(result.data, 'utf8');
            time = Date.now() - startTime;

            writeOutput();

            function writeOutput() {
              FS.writeFile(outfilepath, result.data, 'utf8', report);
            }

            function report(err) {
              if (err) {
                if (err.code === 'ENOENT') {
                  mkdirp(output, writeOutput);
                  return;
                } else if (err.code === 'ENOTDIR') {
                  console.error(
                      'Error: output \'' + output + '\' is not a directory.');
                  return;
                }
                console.error(err);
                return;
              }

              if (!config.quiet) {
                console.log(file + ':');

                // print time info
                printTimeInfo(time);

                // print optimization profit info
                printProfitInfo(inBytes, outBytes);
              }

              // move on to the next file
              if (++i < files.length) {
                optimizeFile(files[i]);
              }
            }

          });

        });

      }
      // move on to the next file
      else if (++i < files.length) {
        optimizeFile(files[i]);
      } else if (!found) {
        console.log('No SVG files have been found.');
      }
    }

    optimizeFile(files[i]);

  });
}

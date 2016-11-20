// configuration options
var target = 'index.html';
var buildDir = './dist/';
var buildJS = 'out.js';
var buildHTML = 'index.html';

var exec = require('child_process').exec;
var fs = require('fs');

var SVGO = require('svgo');
var path = require('path');
var FS = require('fs');
var UglifyJS = require('uglify-js');
var crisper = require('crisper');
var minify = require('html-minifier').minify;
var vulcanize = require('vulcanize');
var concat = require('source-map-concat');
var resolveSourceMapSync = require('source-map-resolve').resolveSourceMapSync;
var createDummySourceMap = require('source-map-dummy');

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

console.log('Compiling TypeScript...');

exec(
    'bash -c "browserify $(find client/ -name \'*.ts\' ! -name \'*_test.ts\' | tr -s \'\n\' \' \') -p tsify -p \[minifyify --map ' +
        buildJS + '.map --output ' + buildJS + '.map\] --outfile ' + buildJS +
        ' --verbose --debug"',
    function(error, stdout, stderr) {
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
exec('cp favicon.png ' + buildDir, puts);

function runVulcanize() {
  console.log('Vulcanizing...');

  var vulcan = new vulcanize({
    excludes: ['out.js'],
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
    scriptInHead: false,      // default true
    onlySplit: true,          // default false
    alwaysWriteScript: false  // default false
  });
  runMinify(out.html, out.js);
}

function runMinify(html, js) {
  var minHtml = runHtmlMinify(html);
  var err = fs.writeFileSync(buildDir + buildHTML, minHtml);
  if (err) {
    console.log(err);
  }

  var jsResults = runJSMinify(js, null);

  // Handle sourcemaps.
  var jsFiles = [buildJS];

  jsFiles = jsFiles.map(function(file) {
    file = {source: file, code: fs.readFileSync(file).toString()};
    file.previousMap =
        resolveSourceMapSync(file.code, file.source, fs.readFileSync);
    return file;
  })
  jsFiles.unshift({
    source: 'deps.js',
    code: jsResults.code,
    previousMap: jsResults,
  });
  jsFiles.forEach(function(file) {
    if (file.previousMap) {
      file.map = file.previousMap.map;
      file.sourcesRelativeTo = file.previousMap.sourcesRelativeTo;
    } else {
      file.map =
          createDummySourceMap(file.code, {source: file.source, type: 'js'});
    }
  });
  var concatenated =
      concat(jsFiles, {delimiter: '\n', mapPath: buildJS + '.map'});
  var result =
      concatenated.toStringWithSourceMap({file: path.basename(buildJS)});

  var minJS = result.code;
  var minJSMap = result.map.toString();


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

function runJSMinify(js, jsMap) {
  // return {code: js, map: jsMap};
  console.log('Minifying JS...');
  var results = UglifyJS.minify(js, {
    fromString: true,
    warnings: true,
    mangle: true,
    compress: true,
    inSourceMap: JSON.parse(jsMap),
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
  var rpath = path.resolve(dir);

  function printTimeInfo(time) {
    console.log('Done in ' + time + ' ms!');
  }

  function printProfitInfo(inBytes, outBytes) {
    var profitPercents = 100 - outBytes * 100 / inBytes;

    console.log(
        (Math.round((inBytes / 1024) * 1000) / 1000) + ' KiB' +
        (profitPercents < 0 ? ' + ' : ' - ') +
        Math.abs((Math.round(profitPercents * 10) / 10)) + '%' +
        ' = ' + (Math.round((outBytes / 1024) * 1000) / 1000) + ' KiB\n');
  }

  // list folder content
  FS.readdir(rpath, function(err, files) {

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
      var filepath = path.resolve(rpath, file);
      var outfilepath = output ? path.resolve(output, file) : filepath;

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

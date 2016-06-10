// configuration options
var target = 'index.html';
var buildDir = './build/';
var buildJS = 'build.js';
var buildHTML = 'index.html';

var exec = require('child_process').exec;
var fs = require('fs');

var UglifyJS = require("uglify-js");
var crisper = require('crisper');
var minify = require('html-minifier').minify;
var vulcanize = require('vulcanize');

if (!fs.existsSync(buildDir)){
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
    scriptInHead: true, // default true
    onlySplit: false, // default false
    alwaysWriteScript: false //default false
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
  var err = fs.writeFileSync(buildDir + buildJS+'.map', minJSMap);
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
  var compressed = (1-results.length/html.length)*100;
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
  var compressed = (1-results.code.length/js.length)*100;
  console.log(' :: compressed ' + compressed.toFixed(1) + '%');
  return results;
}

var Promise = require('bluebird');
var util = require('util');
var Phantom = Promise.promisifyAll(require('node-phantom-simple'));
var _ = require('lodash');
var async = Promise.promisifyAll(require('async'));
var gm = require('gm');
var compare = Promise.promisify(gm.compare);
var args = require('minimist')(process.argv.slice(2));
console.dir(args);


/**
 * To use this, you need Cairo for Image manipulation
 * Install dependencies with:
 *     wget https://raw.githubusercontent.com/LearnBoost/node-canvas/master/install -O - | sh
 */

var baseUrl = args[0];
var newUrl = args[1];

var defaults = {
  baseFilename: '.tmp/base.png',
  newFilename: '.tmp/new.png',
  diffFilename: '.tmp/diff.png'
};

function renderPage(page, url, filename) {

  var open = Promise.promisify(page.open);
  return open(url).then(function (status) {
    console.log("Opening", url, ":", status);
    return page;
  }).then(function (page) {
    var d = Promise.defer();

    setTimeout(function () {
      var render = Promise.promisify(page.render);
      console.log('Rendering', url, 'to', filename);
      d.resolve(render(filename));
    }, 1000);

    return d.promise;
  });
}

function compareUrls(baseUrl, newUrl) {
  var baseFilename = defaults.baseFilename,
      newFilename = defaults.newFilename,
      diffFilename = defaults.diffFilename;


  Phantom.createAsync().then(function (phantom) {
    var createPage = Promise.promisify(phantom.createPage);
    return createPage().then(function (page) {
      return renderPage(page, baseUrl, baseFilename).then(function () {
        return page;
      });
    }).then(function (page) {
      return renderPage(page, newUrl, newFilename).then(function () {
        return page;
      });
    }).then(function (page) {
      var d = Promise.defer();
      compare(baseFilename, newFilename, {
        highlightColor: 'yellow',
        file: diffFilename,
        highlightStyle: 'Tint'
      }, function (err, isEqual, equality, raw) {
        console.log('equality:', equality);
        d.resolve(page);
      });
      return d.promise;
    }).then(function () {
      phantom.exit();
    });
  });
}

compareUrls(
    'http://www.nymag.com/daily/intelligencer/2013/12/city-would-like-to-hear-the-real-nypd-tapes.html',
    'http://factory.qa.nymetro.com/daily/intelligencer/2013/12/city-would-like-to-hear-the-real-nypd-tapes.html'
);


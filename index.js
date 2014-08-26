var Promise = require('bluebird');
var Phantom = Promise.promisifyAll(require('node-phantom-simple'));
var _ = require('lodash');
var gm = require('gm');
var compare = Promise.promisify(gm.compare);
var args = require('minimist')(process.argv.slice(2));
console.dir(args);

var defaults = _.defaults(args, {
  base: '.tmp/base.png',
  new: '.tmp/new.png',
  diff: '.tmp/diff.png',
  width: 640,
  height: 480
});

function cropFile(filename, width, height) {
  height = height || 99999;
  width = width || 99999;
  var d = Promise.defer();
  gm(filename).crop(width, height, 0, 0).write(filename, function (err) {
    if (err) d.reject(err);
    else d.resolve();
  });
  return d.promise;
}

function renderPage(page, url, filename) {

  var open = Promise.promisify(page.open);
  var evaluate = Promise.promisify(page.evaluate);
  return open(url).then(function (status) {
    console.log("Opening", url, ":", status);
    return page;
  }).then(function (page) {
    var d = Promise.defer();

    setTimeout(function () {
      evaluate(function() {
        document.body.bgColor = 'white';
      });
      var render = Promise.promisify(page.render);
      console.log('Rendering', url, 'to', filename);
      d.resolve(render(filename));
    }, 3000);

    return d.promise;
  });
}

function compareUrls(baseUrl, newUrl) {
  var baseFilename = defaults.base,
      newFilename = defaults.new,
      diffFilename = defaults.diff;


  Phantom.createAsync().then(function (phantom) {
    var createPage = Promise.promisify(phantom.createPage);
    return createPage().then(function (page) {
      page.set('viewportSize', {
        width: defaults.width,
        height: defaults.height
      });
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
      var d = Promise.defer();
      /** If they want to compare them beside each other */
      if (args.beside) {
        gm(baseFilename)
            .append(newFilename, true)
            .append(diffFilename, true)
            .write(diffFilename, function (err) {
              if (err) throw err;
              d.resolve();
            });
      }
      return d.promise;
    }).then(function () {
      var top;
      /** If they recommend a top, crop all output */
      if (args.top) {
        top = parseInt(args.top, 10);
        return Promise.all([
          cropFile(diffFilename, null, top),
          cropFile(baseFilename, null, top),
          cropFile(newFilename, null, top)
        ]);
      }
      return Promise.resolve();
    }).then(function () {
      phantom.exit();
    });
  });
}

compareUrls(args._[0], args._[1]);


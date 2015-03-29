/*jshint strict:false*/
/*global CasperError, console, phantom, require*/

/**
 * Capture multiple pages of google search results
 *
 * Usage:
 *
 * $ bin/atmoscraper 014
 *
 * (all arguments will be used as the query)
 */

var allMeasures = [];

var casper = require("casper").create({
    waitTimeout: 1000,
    pageSettings: {
        userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/34.0.1847.116 Chrome/34.0.1847.116 Safari/537.36"
    }
});

var url = "http://www.atmoauvergne.asso.fr/fr/mesures/mesures-automatiques-par-station";

var wait = 1;

var currentPage = 1;

var currentDay = new Date();
// station
var station = casper.cli.args.join(" ");
// options 
var help = casper.cli.options.about;
var limit = casper.cli.options.limit || 10;
var stream = casper.cli.options.stream;
var screenshot = casper.cli.options.screenshot;
var wait = isNumber(casper.cli.options.wait) ? casper.cli.options.wait : 1;

var columnTitles = [
  "Heure GMT (TU)",
  "Dioxyde de soufre (SO2)",
  "Monoxyde d'azote (NO)",
  "Dioxyde d'azote (NO2)", 
  "Monoxyde de carbone (CO/100 - divisé par 100)",
  "Particules en suspension PM10", 
  "Particules en suspension PM2.5",
  "Benzène (C6H6)",
  "Ozone (O3)"
];

if (help) {
    usage();
}

casper.on('error', function (err) {
    casper.log(err, 'error');
    casper.capture('error.png');
    casper.exit(1);
});

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function usage() {
    casper
        .echo("Return data from selected atmo station formated in JSON.")
        .echo("")
        .echo("  Usage:")
        .echo("       $ casperjs atmoscraper.js 14")
        .echo("       $ casperjs atmoscraper.js 16 --limit=5")
        .echo("")
        .echo("  Options:")
        .echo("    --about                   show this help.")
        .echo("    --limit=LIMIT             crawl LIMIT atmo auvergne pages (default 10).")
        .echo("    --stream        return results when available. This writes formated results as soon as it is extracted.")
        .echo("    --screenshot    directory where to store screenshots")
        .echo("    --wait                    time to wait before parsing google results.")
        .echo("")
        .exit(1)
    ;
}

// sub a day to date - http://stackoverflow.com/questions/4413590/javascript-get-array-of-dates-between-2-dates
Date.prototype.subDays = function(days) {
    var dat = new Date(this.valueOf())
    dat.setDate(dat.getDate() - days);
    return dat;
}
// fr slashed date  render - http://stackoverflow.com/questions/3066586/get-string-in-yyyymmdd-format-from-js-date-object
Date.prototype.ddmmyyyySlashed = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return (dd[1]?dd:"0"+dd[0]) + '/' + (mm[1]?mm:"0"+mm[0]) + '/' + yyyy; // padding
}
// en slashed date  render - http://stackoverflow.com/questions/3066586/get-string-in-yyyymmdd-format-from-js-date-object
Date.prototype.yyyymmddSlashed = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy + '/' + (mm[1]?mm:"0"+mm[0]) + '/' + (dd[1]?dd:"0"+dd[0]); // padding
}

function serializeScreenshot(filename) {
    return JSON.stringify({type: 'screenshot', filename: filename});
}
function formatScreenshot(filename) {
    return casper.echo(serializeScreenshot(filename));
}
function takeScreenshot() {
    var screenshotFile = (+new Date()).toString(36) + '.png';

    casper
        .capture(screenshot + '/' + screenshotFile)
        .then(function () {
            // send screenshot
            if (stream) {
                formatScreenshot(screenshotFile);
            }
        });

    return casper;
}

// retrieve data's titles per column from current page
function getTableTitles() {
    var row = [];
    ths = document.querySelectorAll("table.table-mesures-par-station thead tr th");
    [].forEach.call(ths, function(th) {
        row.push(th.textContent); 
    });   
    return row;
}
// retrieve mesures per column from current page
function getTableMeasures() {
    var measures = [];
    trs = document.querySelectorAll("table.table-mesures-par-station tbody tr");
    [].forEach.call(trs, function(tr) {
    // ??? may I trs.forEach( function(tr) {
        var row = [];
        tds = tr.getElementsByTagName('td');
        [].forEach.call(tds, function(td) {
            // replace empty cell by ??
            row.push(td.textContent); 
        });
        measures.push(row);
    });   
    return measures;
}
// transpose array - http://stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript
function transpose(a) {
    return Object.keys(a[0]).map(
        function (c) { return a.map(function (r) { return r[c]; }); }
    );
}
// standardize crawled mesures
function standardizeMeasures(titles, measures) {
  measures[0].forEach(function(e) {
    e = currentDay.yyyymmddSlashed() + " " + e;
  });
  columnTitles.forEach(function(title, index) {
    if (titles.indexOf(title) == -1) {
      measures.splice(index, 0, new Array(measures[0].length+1).join('0').split(''));
    }
  });
  return measures;
}

// handle page crawling
var processPage = function() {
    // emulate a user looking at results with a random time
    var waitTime = wait + (Math.random() * 3);
    this//.echo('Will wait for ' + Math.floor(waitTime))
        .wait(waitTime * 1000);
    
    var titles = this.evaluate(getTableTitles); // ??? why evaluate

    var measures = transpose(this.evaluate(getTableMeasures)); // ??? why evaluate

    measures = standardizeMeasures(titles, measures);

    measures = transpose(measures);

    if (screenshot) {
      takeScreenshot();
    }
    
    JSONifyMeasures = { type: 'measures', day: currentDay.ddmmyyyySlashed(), url: url, data: measures };

    if (stream) {

      this.echo(JSON.stringify(JSONifyMeasures));//, 'INFO');
    }

    allMeasures = allMeasures.concat([JSONifyMeasures]);

    // don't go too far down the rabbit hole
    if (currentPage >= limit || this.exists('<h1>Mesures automatiques par station</h1>')) {
      return terminate.call(casper);
    }
    
    currentPage++;

    currentDay = currentDay.subDays(1);

    this.then(getPage);
    
};

// get next page to crawl
var getPage = function() {
  this.fill('form[action="/fr/mesures/mesures-automatiques-par-station"]', {
    mesauv_station: "0" + station,
    'mesauv_date[date]': currentDay.ddmmyyyySlashed()
  }, false);

  url = this.getCurrentUrl();

  this.thenClick('#edit-moteur-submit')
      // wait url changes
      .then(function() {
        this.waitFor(function() {
          return url !== this.getCurrentUrl();
        });
      })
      .waitForSelector('.mesures-auvergne-resultats', processPage); // ??? terminate);

};

// write links to the output if not streamed.
function terminate(err){
  if (screenshot) {
    takeScreenshot();
  }
  this.then(function () {
    if (!stream) {
      this.echo(JSON.stringify(allMeasures));
    }
  });
}

// let's start
casper.start(url, getPage);

casper.run();

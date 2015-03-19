/*jshint strict:false*/
/*global CasperError, console, phantom, require*/

/**
 * Capture multiple pages of google search results
 *
 * Usage:
 *
 * $ casperjs atmoscraper.js my search terms
 * $ casperjs atmoscraper.js my search terms --limit=5
 * $ casperjs atmoscraper.js my search terms --stream
 *
 * (all arguments will be used as the query)
 */

var casper = require("casper").create({
    waitTimeout: 1000,
    pageSettings: {
        //userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:23.0) Gecko/20130404 Firefox/23.0"
        userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/34.0.1847.116 Chrome/34.0.1847.116 Safari/537.36"
    }
});

var url = "http://www.atmoauvergne.asso.fr/fr/mesures/mesures-automatiques-par-station";

var wait = 1;

var currentPage = 1;

var currentDay = new Date();

// Number of page to crawl
var limit = casper.cli.options.limit || 10;

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

// transpose array - http://stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript
function transpose(a) {
    return Object.keys(a[0]).map(
        function (c) { return a.map(function (r) { return r[c]; }); }
    );
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

// retrieve data's titles per column from current page
function getTableTitles() {
    var row = [];
    ths = document.querySelectorAll("table.table-mesures-par-station thead tr th");
    [].forEach.call(ths, function(th) {
        row.push(th.textContent); 
    });   
    return row;
}

// retrieve data per column from current page
function getTableData() {
    var data = [];
    trs = document.querySelectorAll("table.table-mesures-par-station tbody tr");
    [].forEach.call(trs, function(tr) {
        var row = [];
        tds = tr.getElementsByTagName('td');
        [].forEach.call(tds, function(td) {
            row.push(td.textContent); 
        });
        data.push(row);
    });   
    return data;
}

// handle page crawling
var processPage = function() {
    // emulate a user looking at results with a random time
    var waitTime = wait + (Math.random() * 3);
    this.echo('Will wait for ' + Math.floor(waitTime))
        .wait(waitTime * 1000);
    //this.echo('Page url is: ' + this.getCurrentUrl(), 'INFO');
    this.echo('title: ' + JSON.stringify(this.evaluate(getTableTitles)), 'INFO');
    this.echo('data: ' + JSON.stringify(transpose(this.evaluate(getTableData))), 'INFO');
    
    url = this.getCurrentUrl();

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
    mesauv_station: "014",
    'mesauv_date[date]': currentDay.ddmmyyyySlashed()
  }, false);

  this.thenClick('#edit-moteur-submit');

  this.waitForSelector('.mesures-auvergne-resultats', processPage); //, terminate);
};

// write links to the output if not streamed.
function terminate(err){
    this.echo("that's all folks!");
}


// let's start
casper.start(url, getPage);

casper.run();

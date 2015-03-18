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
var links = [];

var casper = require("casper").create({
    waitTimeout: 1000,
    pageSettings: {
        //userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:23.0) Gecko/20130404 Firefox/23.0"
        userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/34.0.1847.116 Chrome/34.0.1847.116 Safari/537.36"
    }
});

var genericUrl = "http://www.atmoauvergne.asso.fr/fr/mesures/mesures-automatiques-par-station?mesauv_station=034&mesauv_date[date]=#date#&op=Rechercher";

var startingYear = 2012;

var wait = 1;

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

// transpose array
function transpose(a) {
    return Object.keys(a[0]).map(
        function (c) { return a.map(function (r) { return r[c]; }); }
    );
}

// add a day to date
// http://stackoverflow.com/questions/4413590/javascript-get-array-of-dates-between-2-dates
Date.prototype.addDays = function(days) {
    var dat = new Date(this.valueOf())
    dat.setDate(dat.getDate() + days);
    return dat;
}

Date.prototype.subDays = function(days) {
    var dat = new Date(this.valueOf())
    dat.setDate(dat.getDate() - days);
    return dat;
}

// Fr slashed date  render
// http://stackoverflow.com/questions/3066586/get-string-in-yyyymmdd-format-from-js-date-object
Date.prototype.ddmmyyyySlashed = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return (dd[1]?dd:"0"+dd[0]) + '/' + (mm[1]?mm:"0"+mm[0]) + '/' + yyyy; // padding
}


function getDatedUrls(startDate, stopDate) {
    var urlArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        var curr_day = currentDate.getDate();
        if(currentDate.getDate() < 10){
        curr_day = "0" + curr_day;
      }
      var curr_month = currentDate.getMonth() + 1;
      if(curr_month < 10){
        curr_month = "0" + (curr_month);
      }
      var curr_year = currentDate.getFullYear();
      var curr_date = curr_day + "%2F" + curr_month + "%2F" + curr_year;
      current_url = url.replace(/#date#/, curr_date );
      urlArray.push( current_url );
        currentDate = currentDate.addDays(1);
    }
    return urlArray;
}


function formatLinks(links) {
    if (!links instanceof Array) {
        links = [links];
    }
    // backward compatibility requires old format.
    var serialized = stream ? serializeLinks(links) : JSON.stringify(links);
    casper.echo(serialized);
}

// Retrieve data's title per column from current page
function getTableTitles() {
    var row = [];
    ths = document.querySelectorAll("table.table-mesures-par-station thead tr th");
    [].forEach.call(ths, function(th) {
        row.push(th.textContent); 
    });   
    return row;
}

// Retrieve data per column from current page
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
    
    // capturing current page
    this.echo('Page title is: ' + this.evaluate(function() {
        return document.title;
    }), 'INFO');
    this.echo('Page url is: ' + this.getCurrentUrl(), 'INFO');
    this.echo('title: ' + JSON.stringify(this.evaluate(getTableTitles)), 'INFO');
    this.echo('data: ' + JSON.stringify(this.evaluate(getTableData)), 'INFO');
    
    url = this.getCurrentUrl();

    if (!this.exists('<h1>Mesures automatiques par station</h1>')) {
            
            // fill form
            this.fill('form[action="/fr/mesures/mesures-automatiques-par-station"]', {
                'mesauv_station': "014",
                'mesauv_date[date]': "16/03/2015"
            }, false);
            // submit search
            this.thenClick('#edit-moteur-submit')
            // wait url changes
            .then(function() {
                this.waitFor(function() {
                    return url !== this.getCurrentUrl();
                }, processPage);//, terminate);
            });
    }
    
};


var url = "http://www.atmoauvergne.asso.fr/fr/mesures/mesures-automatiques-par-station";

casper.start(url, function() {
    this.fill('form[action="/fr/mesures/mesures-automatiques-par-station"]', {
        mesauv_station: "014",
        'mesauv_date[date]': "17/03/2015"
    }, false);
});
casper.thenClick('#edit-moteur-submit');

casper.waitForSelector('.mesures-auvergne-resultats', processPage); //, terminate);

casper.run();

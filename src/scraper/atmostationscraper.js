var utils = require('utils');
var options = [];
var casper = require('casper').create();
var url = "http://www.atmoauvergne.asso.fr/fr/mesures/mesures-automatiques-par-station";

function getOptions() {
    return Array.prototype.map.call(document.querySelectorAll("select#edit-mesauv-station option"), function(e) {
        return {
            id: e.getAttribute("value"),
            name: e.innerText
        };
    });
}

casper.start(url, function() {
    options = this.evaluate(getOptions);
});

casper.run(function() {
    options.shift();
    utils.dump(options);
    this.exit();
});
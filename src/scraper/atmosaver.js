var path = require('path');
var child_process = require('child_process');
var debug = require('debug');
var os = require('os');
var fs = require('fs');
var mkdirp = require('mkdirp');
var argv = require('minimist')(process.argv.slice(2));

// en slashed date  render - http://stackoverflow.com/questions/3066586/get-string-in-yyyymmdd-format-from-js-date-object
Date.prototype.yyyymmddSlashed = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy + '/' + (mm[1]?mm:"0"+mm[0]) + '/' + (dd[1]?dd:"0"+dd[0]); // padding
}

var limit = argv.limit || 10;
var start = argv.start || new Date();

// lanch casper cli
var casperresults = path.resolve(path.join(__dirname, '..', '..', 'bin', 'atmoscraper'));
var args = [ ];
if (limit) {
	args.push('--limit=' + limit);
}
if (start) {
	args.push('--start=' + start.yyyymmddSlashed());
}

var ls = child_process.spawn(casperresults, args.concat(14));
ls.stdout.on('data', function (data) {
	debug('stdout: ' + data);
	// as many chunks of data can be received at once,
	// we need to separate each line
	// and remove epty lines.
	data.toString()
		.split(os.EOL)
		.filter(function (msg) {
			return msg.length;
		})
		.forEach(function handleCasperMessage(msg) {
		var message;
			try {
				atmorec = JSON.parse(msg);
				csv = [];
				atmorec.data.forEach(function(e, i){
					csv += (e.join(',')) + "\n";
				});
				year = atmorec.day.substr(0, 4);
				
				if(!fs.existsSync( 'csv/' + year )) {
					mkdirp( './csv/' + year);
				}
				
				csvPath = 'csv/' + year + '/' + atmorec.day.replace(/\//g, '-') + ".csv";

				fs.writeFile(csvPath, csv, function(err) {
    				if(err) {
	        			return console.log(err);
    				}

				});
				delete atmorec.data; 
				atmorec.csv = csvPath;
				console.log(JSON.stringify(atmorec));
				
			} catch (err) {
				debug('unable to parse data ' + msg);
				debug(err);
			}
        });
});

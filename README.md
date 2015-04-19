# todo
- virer la fonction stream et l'affichage de la totale en fin de script
- remove csv format from tmoscraper command
- plutot que results ou data : mesures
- one JSON array per page (group url, day, data)
- enable screenshot

- push each day in results['year'] (or one file per day group at the end)
- create dataviz



# Atmoscraper
a web scraper to get atmoauvergne's data in cool graphs


## Setup

    $ npm install

## Harvest atmo data

Just run the following

``` bash
bin/atmoscraper 16 --limit=5 --stream
```

## Running the server

    $ nodemon src/server/index.js
    Atmoscraper server listening at 0.0.0.0:3000

Once the server is running, open `http://localhost:3000` in your browser.

## npm scripts

* `npm start` start a production server
* `npm test` run mocha tests
* `npm run-script dev` start dev environment
* `npm install` install dependencies and create required directories
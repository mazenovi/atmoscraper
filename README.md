# todo

- csv / json format organized by pickup point
- bootsrap interface
- create dataviz part

# Atmoscraper
a web scraper to get atmoauvergne's data in cool graphs


## Setup

    $ npm install

## Harvest atmo data

Just run the following

``` bash
bin/atmosaver 16 --limit=5 --stream
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
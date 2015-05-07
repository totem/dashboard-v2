# Totem v2 dashboard

[![Build Status](https://travis-ci.org/totem/dashboard-v2.svg?branch=develop)](https://travis-ci.org/totem/dashboard-v2)
[![Coverage Status](https://coveralls.io/repos/totem/dashboard-v2/badge.svg)](https://coveralls.io/r/totem/dashboard-v2)

## Setup

You need [Node.js](https://nodejs.org/) 0.10.x installed (use [nvm](https://github.com/creationix/nvm)).

Once node is running, you will need [Gulp](http://gulpjs.com/) and [Bower](http://bower.io/) installed globally to run the project

```sh
$ npm install -g gulp bower
```

Install dependencies:

```sh
$ git clone git@github.com:totem/dashboard-v2.git
$ cd dashboard-v2
$ npm install
$ bower install
```

## Build

```sh
$ gulp build
```

This will generate the `dist` folder that is served in production.

## Run

### Development

```sh
$ gulp serve
```

Run the app locally in development mode at `http://localhost:3000`.

### Production

```sh
$ gulp serve:dist
```

Run the app in "production" mode locally at `http://localhost:3000`.

```sh
$ docker build -t totem-dashboard:local .
$ docker run -Pit totem-dashboard:local
```

Run the app in Docker which mirrors production better than the previous command. This requires that [Boot2Docker](http://boot2docker.io/) is installed and running.

## Test

### Unit

```sh
$ gulp test
```

Run unit tests

```sh
$ gulp test:auto
```

When running site in development mode, watch JS files and run unit tests on file change.

### End-to-End

```sh
$ gulp protractor:src
```

Run e2e tests against source files

```sh
$ gulp protractor:dist
```

Run tests against generated `dist` files (production mode)

## Deploy

This app is deployed automatically via Totem.
(Note: This will be bundled with Totem provisioner in future.)

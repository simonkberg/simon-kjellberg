var newrelic = require('newrelic');
var express = require('express');
var debug = require('debug')('SK:app');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compression = require('compression');
var sass = require('node-sass-middleware');
var babel = require("babel-connect");
var lodash = require('lodash');

// routers
var routes = {
    '/': require('./routes/index'),
    '/exp': require('./routes/exp')
};

// main app
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// locals setup
app.locals.newrelic = newrelic;

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());

app.use(
  sass({
    src: path.join(__dirname, 'src/sass'),
    dest: path.join(__dirname, 'public/css'),
    prefix: '/css',
    includePaths: ['bower_components'],
    outputStyle: debug.enabled ? 'expanded' : 'compressed',
    debug: debug.enabled,
  })
);

app.use(
  babel({
    options: {
      // options to use when transforming files
    },
    src: path.join(__dirname, 'src'),
    dest: path.join(__dirname, 'public'),
    ignore: /node_modules/
  })
);

app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  res.header('X-UA-Compatible', 'IE=edge');
  next();
});

lodash.forEach(routes, function(route, path) {
  this.use(path, route);
}, app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {
      status: err.status
    }
  });
});


module.exports = app;

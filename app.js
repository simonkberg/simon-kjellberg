import newrelic from 'newrelic'
import express from 'express'
import debug from 'debug'
import path from 'path'
import favicon from 'serve-favicon'
import logger from 'morgan'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import compression from 'compression'
import sass from 'node-sass-middleware'
import babelify from 'express-babelify-middleware'

// routers
import routes from './routes'

// main app
const log = debug('SK:app')
const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

// locals setup
app.locals.newrelic = newrelic

app.use(favicon(__dirname + '/public/favicon.ico'))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(compression())

app.use(
  sass({
    src: path.join(__dirname, 'src/sass'),
    dest: path.join(__dirname, 'public/css'),
    prefix: '/css',
    includePaths: ['node_modules'],
    outputStyle: log.enabled ? 'expanded' : 'compressed',
    debug: log.enabled
  })
)

app.use(
  babelify(path.join(__dirname, 'src'))
)

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'static'), { dotfiles: 'allow' }))

app.use(function (req, res, next) {
  res.header('X-UA-Compatible', 'IE=edge')
  next()
})

Object.keys(routes).forEach((path) => {
  app.use(path, routes[path])
})

// catch 404 and forward to error handler
app.use((req, res, next) => {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.render('error', {
      message: err.message,
      error: err
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    error: {
      status: err.status
    }
  })
})

export default app

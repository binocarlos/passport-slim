var express = require('express')
var passport = require('passport')
var session = require('express-session')
var cookieParser = require('cookie-parser')
var Redis = require('ioredis')
var RedisStore = require('connect-redis')(session)
var Logger = require('./logger')
var Routes = require('./routes')
var tools = require('./tools')

module.exports = function(opts){
  opts = opts || {}
  var app = express()
  var routes = Routes(opts)

  passport.serializeUser(function(req, user, done) {
    done(null, user.id)
  })

  passport.deserializeUser(function(req, id, done) {
    tools.loadUserById(req.log, opts, id, done)
  })

  app.use(cookieParser())
  app.use(Logger())

  var redisConnection = new Redis({
    port: opts.redisport,
    host: opts.redishost,
    family: 4,
    db: opts.redisdatabase
  })

  app.use(session({
    store: new RedisStore({
      client:redisConnection,
      prefix:opts.redisprefix
    }),
    secret: opts.cookiesecret,
    resave: false,
    saveUninitialized: true
  }))
  app.use(passport.initialize())
  app.use(passport.session())

  function route(method, path, handler){
    app[method](opts.mountpath + path, handler)
  }

  route('get', '/version', routes.version)
  route('get', '/status', routes.status)
  route('get', '/logout', routes.logout)
  route('post', '/login', routes.login)
  route('post', '/register', routes.register)

  return app
}
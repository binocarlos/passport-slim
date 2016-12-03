var async = require('async')
var passport = require('passport')
var jsonist = require('jsonist')
var concat = require('concat-stream')
var tools = require('./tools')
var packageJSON = require('../package.json')
  
module.exports = function(opts){

  opts = opts || {}

  var primaryKeyField = tools.getPrimaryKeyField(opts)

  // after login and register - we need to load the user and reply
  function loadUserHandler(id, next){
    tools.loadUserById(opts, id, function(err, data){
      if(err){
        return next({
          code:500,
          message:err.toString()
        })
      }
      if(!data){
        return next({
          code:404,
          message:'user ' + loginres.id + ' not found'
        })
      }
      next(null, data)
    })
  }

  // handle the login of a user with data
  // i.e. write the cookie for actual login
  function loginUserHandler(req, data, next){
    req.login(data, function(err){
      if(err){
        return next({
          code:500,
          message:err.toString()
        })
      }
      next(null, data)
    })
  }

  // generic handler for posting to the storage service
  function postRequest(url, body, done){
    jsonist.post(url, body, function(err, data, res) {
      if(err){
        return done({
          code:500,
          message:err.toString()
        })
      }
      done(null, data, res)
    })
  }

  // version route
  function version(req, res){
    res.type('text/plain')
    res.end(packageJSON.version)
  }

  // login route
  var login = tools.slurpJSON(function loginHandler(req, res) {

    var baseResponse = {
      loggedIn:false
    }

    async.waterfall([

      // first authenticate with the submitted JSON
      function(next){
        postRequest(tools.getStorageURL(opts, '/authenticate'), req.jsonBody, function(err, data, login_res){
          if(err) return next(err)
          if(login_res.statusCode != 200 || !data.authenticated){
            return next({
              code:login_res.statusCode,
              message:'invalid details'
            })
          }
          next(null, data.id)
        })
      },

      function(userid, next){
        loadUserHandler(userid, next)
      },

      function(user, next){
        loginUserHandler(req, user, next)
      }

    ], function(err, data){
      if(err) return tools.errorHandler(res, err.code, err.message, baseResponse)
      res.status(200)
      res.json({
        loggedIn:true,
        data:data
      })
    })
  })


  // register route
  var register = tools.slurpJSON(function registerHandler(req, res) {

    var baseResponse = {
      registered:false
    }

    async.waterfall([

      // first check we have a primary key and pass it on
      function(next){
        var primaryKey = req.jsonBody[primaryKeyField] || ''

        if(!primaryKey){
          return next({
            code:400,
            message:'no ' + primaryKeyField + ' given'
          })
        }
        
        next(null, primaryKey)
      },

      // we need to see if this user exists
      // so we hit the '/data' using the field we are using
      function(primaryKey, next){
        tools.loadUser(opts, primaryKeyField, primaryKey, function(err, user){
          if(err){
            return next({
              code:500,
              message:err.toString()
            })
          }

          if(user){
            return next({
              code:409,
              message:'user with ' + primaryKeyField + '=' + primaryKey + ' already exists'
            })
          }

          next(null, req.jsonBody)
        })
      },

      // now we actually write the user to the backend
      function(userBody, next){

        postRequest(tools.getStorageURL(opts, '/create'), userBody, function(err, data, register_res){
          if(err) return next(err)
          if(register_res.statusCode >= 400 || !data.created){
            return next({
              code:register_res.statusCode,
              message:'invalid details'
            })
          }
          next(null, data.id)
        })
      },

      function(userid, next){
        loadUserHandler(userid, next)
      },

      function(user, next){
        loginUserHandler(req, user, next)
      }

    ], function(err){
      if(err) return tools.errorHandler(res, err.code, err.message, baseResponse)
      res.status(200)
      res.json({
        registered:true,
        data:data
      })
    })
    
  })
  
  // status route
  function status(req, res) {

    var baseResponse = {
      loggedIn:false
    }

    if(!req.user || !req.user.id){
      return tools.errorHandler(res, 200, 'no user found', baseResponse)
    }
    
    tools.loadUserById(opts, req.user.id, function(err, userprofile){
      if(err) return tools.errorHandler(res, 500, err.toString(), baseResponse)
      if(!userprofile) tools.errorHandler(res, 200, 'no user found', baseResponse)

      res.json({
        loggedIn:true,
        data:userprofile
      })

    })
  }

  // clear the session
  function logout(req, res) {
    req.logout()
    delete req.session
    res.redirect('/')
  }

  return {
    login:login,
    register:register,
    status:status,
    logout:logout,
    version:version
  }
}

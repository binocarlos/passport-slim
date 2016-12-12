var jsonist = require('jsonist')
var concat = require('concat-stream')
var pino = require('pino')
var generalLogger = pino()
// slurp JSON from a HTTP request and handle parsing errors
// we write the body to req.jsonBody and call the handler
function slurpJSON(handler){
  return function(req, res, next){
    req.pipe(concat(function(body){
      try {
        body = JSON.parse(body.toString())
      }
      catch(e) {
        req.log.error(e.toString())
        res.statusCode = 500
        res.end(e.toString())
        return
      }
      req.jsonBody = body
      handler(req, res, next)
    }))
  }
}

// what field are we using for login primary key (email or username)
function getPrimaryKeyField(opts){
  return opts.usernamefield ?
    'username' :
    'email'
}

// utility function for the backend storage url
function getStorageURL(opts, path) {
  return [
    'http://',
    opts.storagehost,
    ':',
    opts.storageport,
    opts.storagepath,
    path
  ].join('')
}

// utility function to load a user for the backend
// you can load by
//   * id
//   * email
//   * username
var loadUserFields = {
  id:true,
  email:true,
  username:true
}

function loadUser(logger, opts, field, value, done) {
  if(!loadUserFields[field]){
    return done(field + ' is not a valid user field')
  }
  var url = getStorageURL(opts, '/data?' + field + '=' + encodeURIComponent(value))

  logger = logger || generalLogger
  logger.debug({
    url:url,
    opts:opts,
    value:value
  }, 'load backend user')  
  
  jsonist.get(url, function(err, data, storageres) {
    if(err) return done(err)
    if(storageres.statusCode == 200){
      return done(null, data)
    }
    else{
      return done()
    }
  })

}

function loadUserById(logger, opts, id, done){
  return loadUser(logger, opts, 'id', id, done) 
}

function errorHandler(logger, res, code, error, body){
  logger.error({
    code:code,
    error:error.toString()
  })
  body = Object.assign({}, body)
  body.error = error.toString()
  res.status(code)
  res.json(body)
}

module.exports = {
  slurpJSON:slurpJSON,
  getPrimaryKeyField:getPrimaryKeyField,
  getStorageURL:getStorageURL,
  loadUser:loadUser,
  loadUserById:loadUserById,
  errorHandler:errorHandler
}

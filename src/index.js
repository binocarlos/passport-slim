var App = require('./app')

var args = require('minimist')(process.argv, {
  default:{
    port:process.env.PORT || 80,
    mountpath:process.env.MOUNTPATH,
    usernamefield:process.env.USERNAME_FIELD,
    emailfield:process.env.EMAIL_FIELD,
    cookiesecret:process.env.COOKIE_SECRET,
    storagehost:process.env.STORAGE_SERVICE_HOST,
    storageport:process.env.STORAGE_SERVICE_PORT || 80,
    storagepath:process.env.STORAGE_SERVICE_PATH,
    redishost:process.env.REDIS_SERVICE_HOST,
    redisport:process.env.REDIS_SERVICE_PORT || 6379,
    redisprefix:process.env.REDIS_SERVICE_PREFIX || 'sessions:',
    redisdatabase:process.env.REDIS_SERVICE_DATABASE || 0
  },
  boolean:['usernamefield', 'emailfield']
})

var requiredFields = [
  'cookiesecret',
  'storagehost',
  'storagepath',
  'redishost'
]

// return a processed version of the options above
function getOptions(opts){
  opts = opts || {}
  if(!opts.usernamefield && !opts.emailfield){
    throw new Error('one of the usernamefield or emailfield args are required')
  }

  requiredFields.forEach(function(field){
    if(!args[field]){
      throw new Error('the ' + field + ' arg is required')
    }
  })

  if(opts.mountpath == '/') opts.mountpath = ''

  return Object.assign({}, opts)
}


var app = App(getOptions(args))

// we wrap the top level removing mountpath from the url
// this lets us use the module in other web-servers as a library
app.listen(args.port)
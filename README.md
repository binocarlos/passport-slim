# passport-slim

A REST api service to handle authentication that uses a webhook to hand off state to a storage service and redis to save session state.

## install

```bash
$ docker pull binocarlos/passport-slim
```

## example

There is a example of a stack running that uses [passport-service-gui](https://github.com/binocarlos/passport-service-gui)

```bash
$ make frontend.build
$ docker-compose up
```

Then visit: http://localhost:8000

## overview

passport-slim provides a REST api gateway for user login and registration where state is kept in a backend storage service.

```
         browser
            |
         passport     admin
       /   slim     / panel
      /     |      /
     /     user   /
 redis    storage
```

It can be used in conjunction with [passport-service-gui](https://github.com/binocarlos/passport-service-gui)

It uses [passportjs](http://passportjs.org/) and so will be able to make use of the extensive list of [OAuth Providers](https://github.com/jaredhanson/passport#search-all-strategies)

## CLI options

When running in standalone mode from the command line:

 * --port - PORT - the port to listen on (default = 80)
 * --mountpath - MOUNTPATH - the path to mount the router on (default = /)
 * --usernamefield - USERNAME_FIELD - a boolean to activate the username field
 * --emailfield - EMAIL_FIELD - a boolean to activate the email field
 * --cookiesecret - COOKIE_SECRET - use to encode the browser cookie (default = 'secret')
 * --redishost - REDIS_SERVICE_HOST - the hostname of the redis service
 * --redisport - REDIS_SERVICE_PORT - the port of the redis service (default = 6379)
 * --redisprefix - REDIS_SERVICE_PREFIX - prepend redis keys with this value (default = 'sessions:')
 * --storagehost - STORAGE_SERVICE_HOST - the hostname of the storage service
 * --storageport - STORAGE_SERVICE_PORT - the port of the storage service (default = 80)
 * --storagepath - STORAGE_SERVICE_PATH - the path of the storage service api
 
There are several use cases the `usernamefield` and `emailfield` boolean options are controlling:

 * a system that uses email address as primary login username (emailfield=1,usernamefield=0)
 * login using a `username` (like `bob`) but also use register an email address (emailfield=1,usernamefield=1)
 * login with a username and no email address is required (emailfield=0,usernamefield=0)

You have to provide at least one of `usernamefield` and `emailfield` (or both).

## public routes

These routes are provided by the service to your frontend code.

All routes are mounted under the mountpath argument.
(e.g. `/version` with mountpath `/auth/v1` becomes `/auth/v1/version`).

#### version

`GET /version`

Returns `text/plain` with the semver of the current package.

#### current user status

`GET /status`

Returns the user details loaded from the storage service for the cookie passed in the request.

If the user is logged in - it will return `HTTP 200 - application/json`:

```json
{
  "loggedIn":true,
  "data":{
    "id":123,
    "username":"bob",
    "email":"bob@bob.com"
  }
}
```

If the user is not logged in - it will return `HTTP 200 - application/json`:

```json
{
  "loggedIn":false
}
```

#### login

`POST /login`

```json
{
  "username":"bob",
  "password":"apples"
}
```

Or if using email address as username:

```json
{
  "email":"bob@bob.com",
  "password":"apples"
}
```

If successful - returns `HTTP 200 - application/json`:

```json
{
  "loggedIn":true,
  "data":{
    "id":123,
    "username":"bob",
    "email":"bob@bob.com"
  }
}
```

If not successful - returns `HTTP 401 - application/json`:

```json
{
  "loggedIn":false
}
```

If errors were found in the request - this route returns `HTTP 400 - application/json`:

```json
{
  "loggedIn":false,
  "error":true,
  "error":"invalid email"
}
```

If errors were occurred when processing the request - returns `HTTP 500 - application/json`:

```json
{
  "loggedIn":false,
  "error":"database connection lost"
}
```

The `errors` property is decided by the backend storage service.

#### register

`POST /register`:

```json
{
  "email":"bob@bob.com",
  "username":"bob",
  "password":"apples"
}
```

If successful - returns `HTTP 200 - application/json`:

```json
{
  "registered":true,
  "data":{
    "id":123,
    "username":"bob",
    "email":"bob@bob.com"
  }
}
```

If another user with the same username/email already exists - it returns `HTTP 409 - application/json`:

```json
{
  "registered":false,
  "error":"username already exists"
}
```

If errors were found in the request - returns `HTTP 400 - application/json`:

```json
{
  "registered":false,
  "error":"invalid email"
}
```

If errors were occurred when processing the request - returns `HTTP 500 - application/json`:

```json
{
  "registered":false,
  "error":"database connection lost"
}
```

The `errors` property is decided by the backend storage service.

#### logout

`GET /logout`

Removes the session and redirects the user to `/`


## backend storage

The `passport-lite` service is stateless and will use HTTP to contact another service for storage.

The 3 variables to control where this service lives:

 * `--storage-host` - 1.2.3.4
 * `--storage-port` - 80
 * `--storage-path` - /api/v1/user

So using the example above we would create a HTTP server on `http://1.2.3.4:80/api/v1/user` that could handle the following requests:

#### get user

`GET /data?id=<id>`
`GET /data?username=<username>`
`GET /data?email=<email>`

Get a user by it's id, email or username - what data is viewable by the client is controlled by what this route returns.

If the user is found then return `HTTP 200 - application/json`:

```json
{
  "id":123,
  "username":"bob",
  "email":"bob@bob.com"
}
```

You **should** include an `id` field in your response.
You **should not** return any passwords or other sensitive information.

If the user is not found then return a `HTTP 404` and an empty body.

If there was an error - return a `HTTP 500 - application/json`:

```json
{
  "error":"no query parameter given"
}
```

#### authenticate user

This route will handle taking the password the user entered and deciding if it is the correct password.  This leaves password hashing up to your storage service.

`POST /authenticate`

```json
{
  "username":"bob@bob.com",
  "password":"apples"
}
```

Or if using email as username:

```json
{
  "email":"bob@bob.com",
  "password":"apples"
}
```

If valid then return `HTTP 200 - application/json`:

```json
{
  "authenticated":true,
  "id":123
}
```

If the credentials are not correct return `HTTP 401 - application/json`:

```json
{
  "authenticated":false
}
```

If there was an error in authenticating the user - return a `HTTP 500 - application/json`:

```json
{
  "authenticated":false,
  "error":"database connection missing"
}
```

#### create user

`POST /create`

```json
{
  "email":"bob@bob.com",
  "username":"bob",
  "password":"apples"
}
```

The usage of the `usernamefield` and `emailfield` options control what fields are included in the create user request.

If the user was created successfully - return `HTTP 201 - application/json`:

```json
{
  "created":true,
  "id":123
}
```

If you want to validate the details given (for example enforcing minimum password length or validating email address) - you can check the incoming JSON and return a `HTTP 400 - application/json`:

```json
{
  "created":false,
  "error":"invalid email"
}
```

If there was an error in creating the user - return a `HTTP 500 - application/json`:

```json
{
  "created":false,
  "error":"database connection missing"
}
```

## license

MIT
# http-server-plus

[![Build Status](https://img.shields.io/travis/julien-f/http-server-plus/master.svg)](http://travis-ci.org/julien-f/http-server-plus)
[![Dependency Status](https://david-dm.org/julien-f/http-server-plus/status.svg?theme=shields.io)](https://david-dm.org/julien-f/http-server-plus)
[![devDependency Status](https://david-dm.org/julien-f/http-server-plus/dev-status.svg?theme=shields.io)](https://david-dm.org/julien-f/http-server-plus#info=devDependencies)

> Augmented `http.Server`, HTTP/HTTPS/HTTP2 and multiple ports on the same instance


## Install

Download [manually](https://github.com/julien-f/http-server-plus/releases) or with package-manager.

#### [npm](https://npmjs.org/package/http-server-plus)

```
npm install --save http-server-plus
```

To add support for [HTTP/2](https://en.wikipedia.org/wiki/HTTP/2):

```
npm install --save http2
```

## Example

```javascript
// The `create()` method can also take a `requestListener`, just like
// `http.createServer()`.
var app = require('express')()
var server = require('http-server-plus').create(app)

// The listen method returns a promise which resolves when the server
// starts listening.
require('bluebird').all([
  // Listen on port localhost:80.
  server.listen({
    hostname: 'localhost',
    port: 80
  }),

  // Listen on port 443, using HTTPS.
  server.listen({
    port: 443,

    cert: require('fs').readFileSync(__dirname +'/certificate.pem'),
    key: require('fs').readFileSync(__dirname +'/private_key.pem')
  }),

  // Listen on socket.
  server.listen({
    socket: __dirname +'/http.sock'
  })
]).then(function (niceAddresses) {
  console.log('server is listening on', niceAddresses)
}).catch(function (error) {
  console.error('The server could not listen on', error.niceAddress)
})
```

## Contributing

Contributions are *very* welcome, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/julien-f/http-server-plus/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Julien Fontanet](http://julien.isonoe.net)

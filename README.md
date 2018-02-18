# http-server-plus [![Build Status](https://travis-ci.org/JsCommunity/http-server-plus.png?branch=master)](https://travis-ci.org/JsCommunity/http-server-plus)

> Augmented `http.Server`, HTTP/HTTPS/HTTP2 and multiple ports on the same instance

## Install

Installation of the [npm package](https://npmjs.org/package/http-server-plus):

```
npm install --save http-server-plus
```

To add support for [HTTP/2](https://en.wikipedia.org/wiki/HTTP/2):

```
npm install --save spdy
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
  }),

  // Listen on file descriptor (with systemd for instance).
  server.listen({
    fd: 3
  }),

  // Listen on a socket created by systemd.
  server.listen({
    systemdSocket: 0 // this is a socket index
  })
]).then(function (niceAddresses) {
  console.log('server is listening on', niceAddresses)
}).catch(function (error) {
  console.error('The server could not listen on', error.niceAddress)
})
```

Using [ES2016's async functions](https://github.com/tc39/ecmascript-asyncawait):

```javascript
import createExpressApp from 'express'
import {create} from 'http-server-plus'

async function main () {
  const app = createExpressApp()

  // The `create()` method can also take a `requestListener`, just
  // like `http.createServer()`.
  const server = create(app)

  try {
    // The listen method returns a promise which resolves when the server
    // starts listening.
    const niceAddresses = await Promise.all([
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
    ])

    console.log('the server is listening on', niceAdresses)
  } catch (error) {
    console.error('the server could not listen on', error.niceAddress)
  }
}
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/JsCommunity/http-server-plus/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Julien Fontanet](http://julien.isonoe.net)

'use strict';

//====================================================================

var httpServerPlus = require('../');

//====================================================================

var server  = httpServerPlus.create(function onRequest(request, response) {
  console.log('New request: %s %s', request.method, request.url);

  response.end('Nothing to see here.');
});

server.listen({
  host: 'localhost',
  port: 8080,
}).then(function () {
  console.log('Listening on %s', this.niceAddress());
});

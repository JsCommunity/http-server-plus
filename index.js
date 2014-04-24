'use strict';

//====================================================================

var EventEmitter = require('events').EventEmitter;
var http = require('http');
var https = require('https');
var inherits = require('util').inherits;

//--------------------------------------------------------------------

var eventToPromise = require('event-to-promise');

//====================================================================

var forwardedEvents = [
  'checkContinue',
  'clientError',
  'connect',
  'connection',
  'listening',
  'request',
  'upgrade',
];

//====================================================================

var Server = function () {
  this._servers = [];
};
inherits(Server, EventEmitter);

var proto = Server.prototype;

proto.addresses = function () {
  return this._servers.map(function (server) {
    return server.address();
  });
};

proto.close = function (callback) {
  if (callback)
  {
    this.on('close', callback);
  }

  // Closes each servers.
  this._servers.forEach(function (server) {
    server.close();
  });
};

proto.listen = function (opts) {
  var server;
  var servers = this._servers;

  if (opts.certificate && opts.key)
  {
    server = https.createServer({
      cert: opts.certificate,
      key: opts.key,
    });
  }
  else
  {
    server = http.createServer();
  }
  var i = servers.length;
  servers[i] = server;

  if (opts.socket)
  {
    server.listen(opts.socket);
  }
  else
  {
    server.listen(opts.port, opts.host || '0.0.0.0');
  }

  var emit = this.emit.bind(this);
  server.once('close', function () {
    servers.splice(i, 1);

    if (!servers.length)
    {
      emit('close');
    }
  });
  server.on('error', function (error) {
    servers.splice(i, 1);

    // FIXME: do not use emit to keep the original context.
    emit('error', error);
  });

  var listeners = this.listeners.bind(this);
  forwardedEvents.forEach(function (event) {
    server.on(event, function () {
      var ctxt = this;
      var args = arguments;

      // Do not use emit directly to keep the original context.
      listeners(event).forEach(function (listener) {
        listener.apply(ctxt, args);
      });
    });
  });

  return eventToPromise(server, 'listening');
};

proto.ref = function () {
  this._servers.forEach(function (server) {
    server.ref();
  });
};

proto.unref = function () {
  this._servers.forEach(function (server) {
    server.unref();
  });
};

//====================================================================

module.exports = exports = Server;

exports.create = function (requestListener) {
  var server = new Server();
  if (requestListener)
  {
    server.on('request', requestListener);
  }
  return server;
};

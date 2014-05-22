'use strict';

//====================================================================

var EventEmitter = require('events').EventEmitter;
var http = require('http');
var https = require('https');
var inherits = require('util').inherits;
var resolvePath = require('path').resolve;

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

// Wrap a value in a function.
var wrap = function (value) {
  return function () {
    return value;
  };
};

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

proto.niceAddresses = function () {
  return this._servers.map(function (server) {
    return server.niceAddress();
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

  // Human readable address.
  var address;

  if (opts.certificate && opts.key)
  {
    server = https.createServer({
      cert: opts.certificate,
      key: opts.key,
    });
    address = 'https://';
  }
  else
  {
    server = http.createServer();
    address = 'http://';
  }
  var i = servers.length;
  servers[i] = server;

  if (opts.socket)
  {
    var socket = resolvePath(opts.socket);
    server.listen(socket);
    server.niceAddress = wrap(address + socket);
  }
  else
  {
    var host = opts.host || '0.0.0.0';
    var port = +opts.port || 0;
    server.listen(port, host);

    if (port === 0)
    {
      server.niceAddress = function () {
        var realAddress = this.address();

        if (!realAddress)
        {
          return address + ':[unknown]';
        }

        address += ':'+ realAddress.port;
        server.niceAddress = wrap(address);
        return address;
      };
    }
    else
    {
      server.niceAddress = wrap(address + host +':'+ port);
    }
  }

  var emit = this.emit.bind(this);
  server.once('close', function () {
    servers.splice(i, 1);

    if (!servers.length)
    {
      emit('close');
    }
  });

  server.on('error', function () {
    servers.splice(i, 1);

    // FIXME: Should it be forwarded and be fatal if there is no
    // listeners?
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

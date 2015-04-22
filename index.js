'use strict'

// ===================================================================

var EventEmitter = require('events').EventEmitter
var forEach = require('lodash.foreach')
var formatUrl = require('url').format
var http = require('http')
var https = require('https')
var inherits = require('util').inherits
var map = require('lodash.map')
var resolvePath = require('path').resolve

// -------------------------------------------------------------------

var eventToPromise = require('event-to-promise')

// ===================================================================

var forwardedEvents = [
  'checkContinue',
  'clientError',
  'connect',
  'connection',
  'listening',
  'request',
  'upgrade'
]

// ===================================================================

function Server () {
  EventEmitter.call(this)

  this._servers = Object.create(null)
}
inherits(Server, EventEmitter)

var proto = Server.prototype

function getAddress (server) {
  return server.address()
}
proto.addresses = function Server$addresses () {
  return map(this._servers, getAddress)
}

function close (server) {
  server.close()
}

proto.close = function Server$close (callback) {
  if (callback) {
    this.on('close', callback)
  }

  // Closes each servers.
  forEach(this._servers, close)
}

var nextId = 0
proto.listen = function Server$listen (opts) {
  var servers = this._servers

  var server, protocol
  if (opts.certificate && opts.key) {
    server = https.createServer({
      cert: opts.certificate,
      key: opts.key
    })
    protocol = 'https'
  } else {
    server = http.createServer()
    protocol = 'http'
  }

  var id = nextId++
  servers[id] = server

  var niceAddress

  if (opts.socket) {
    var socket = resolvePath(opts.socket)
    server.listen(socket)
    niceAddress = formatUrl({
      protocol: protocol,
      path: socket
    })
  } else {
    server.listen(opts.port, opts.hostname, function () {
      var address = this.address()
      niceAddress = formatUrl({
        protocol: protocol,
        hostname: address.address,
        port: address.port
      })
    })

    niceAddress = formatUrl({
      protocol: protocol,

      // Hostname default to localhost.
      hostname: opts.hostname || 'localhost',

      // No port means random, unknown for now.
      port: opts.port || '<unknown>'
    })
  }

  var emit = this.emit.bind(this)
  server.once('close', function onClose () {
    delete servers[id]

    if (!servers.length) {
      emit('close')
    }
  })

  server.on('error', function onError () {
    delete servers[id]

    // FIXME: Should it be forwarded and be fatal if there is no
    // listeners?
  })

  var listeners = this.listeners.bind(this)
  forEach(forwardedEvents, function setUpEventForwarding (event) {
    server.on(event, function eventHandler () {
      var ctxt = this
      var args = arguments

      // Do not use emit directly to keep the original context.
      forEach(listeners(event), function forwardEvent (listener) {
        listener.apply(ctxt, args)
      })
    })
  })

  return eventToPromise(server, 'listening').then(
    function () {
      return niceAddress
    },
    function (error) {
      error.niceAddress = niceAddress
      throw error
    }
  )
}

function ref (server) {
  server.ref()
}

proto.ref = function Server$ref () {
  this._servers.forEach(ref)
}

function unref (server) {
  server.unref()
}

proto.unref = function Server$unref () {
  this._servers.forEach(unref)
}

// ===================================================================

module.exports = exports = Server

exports.create = function create (requestListener) {
  var server = new Server()
  if (requestListener) {
    server.on('request', requestListener)
  }
  return server
}

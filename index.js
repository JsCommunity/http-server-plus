'use strict'

// ===================================================================

var assign = require('lodash/assign')
var EventEmitter = require('events').EventEmitter
var eventToPromise = require('event-to-promise')
var forEach = require('lodash/forEach')
var formatUrl = require('url').format
var http = require('http')
var inherits = require('util').inherits
var isEmpty = require('lodash/isEmpty')
var map = require('lodash/map')
var resolvePath = require('path').resolve

// -------------------------------------------------------------------

var https
try {
  https = require('spdy')
} catch (e) {
  https = require('https')
}

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

function extractProperty (obj, prop) {
  var value = obj[prop]
  if (value !== undefined) {
    delete obj[prop]
    return value
  }
}

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
    this.once('close', callback)
  }

  // Emit the close event even if there are no registered servers.
  if (isEmpty(this._servers)) {
    var self = this
    setImmediate(function () {
      self.emit('close')
    })
  }
  // Closes each servers.
  forEach(this._servers, close)

  return eventToPromise(this, 'close')
}

var nextId = 0
proto.listen = function Server$listen (opts) {
  opts = assign({}, opts)
  var fd = extractProperty(opts, 'fd')
  var port = extractProperty(opts, 'port')
  var hostname = extractProperty(opts, 'hostname')
  var socket = extractProperty(opts, 'socket')

  var servers = this._servers

  var server, protocol
  if (
    opts.pfx ||
    opts.SNICallback ||
    (opts.cert && opts.key)
  ) {
    server = https.createServer(opts)
    protocol = 'https'
  } else {
    server = http.createServer()
    protocol = 'http'
  }

  var id = nextId++
  servers[id] = server

  // Compute a temporary nice address to display in case of error.
  var niceAddress
  if (fd != null) {
    server.listen({ fd: fd })
    niceAddress = protocol + '://<fd:' + fd + '>'
  } else if (socket != null) {
    socket = resolvePath(socket)
    server.listen(socket)
    niceAddress = protocol + '://' + socket
  } else if (port != null) {
    server.listen(port, hostname)
    niceAddress = formatUrl({
      protocol: protocol,

      // Hostname default to localhost.
      hostname: hostname || 'localhost',

      // No port means random, unknown for now.
      port: port || '<unknown>'
    })
  } else {
    throw new Error('invalid options (requires either socket or port)')
  }

  var emit = this.emit.bind(this)
  server.once('close', function onClose () {
    delete servers[id]

    if (isEmpty(servers)) {
      emit('close')
    }
  })

  server.on('error', function onError () {
    delete servers[id]

    // FIXME: Should it be forwarded and be fatal if there are no
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
      var address = server.address()
      if (typeof address === 'string') {
        return protocol + '://' + address
      }
      return formatUrl({
        protocol: protocol,
        hostname: address.address,
        port: address.port
      })
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

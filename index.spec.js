'use strict';

//====================================================================

var HttpServerPlus = require('./');

//--------------------------------------------------------------------

var expect = require('chai').expect;

//====================================================================

describe('HttpServerPlus', function () {
  describe('#create()', function () {
    it('creates a new instance', function () {
      expect(HttpServerPlus.create()).to.be.an.instanceof(HttpServerPlus);
    });

    it('can register a `request` listener', function () {
      var listener = function () {};
      var server = HttpServerPlus.create(listener);

      expect(server.listeners('request')).to.have.members([listener]);
    });
  });

  describe('.addresses()', function () {
    it('returns the list of addresses the server is listening at');
  });

  // TODO
  describe('.listen()', function () {
    it('can use a host:port');
    it('can use a socket');
    it('can use a HTTPS certificate');
    it('returns a promise which will resolve once listening');
    it('returns a promise which will reject if failure');
  });

  // TODO
  it('can be used exactly like `{http,https}.Server`');
});

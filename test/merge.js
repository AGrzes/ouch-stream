var assert = require('chai').assert
var sinon = require('sinon')
var Ouch = require('../index')
var miss = require('mississippi')
describe('Ouch', function () {
  describe('#merge()', function () {
    it('should call put', function (done) {
      var f = sinon.spy((x) => x)
      var db = {
        put: sinon.spy(() => Promise.resolve(null))
      }
      miss.pipe(miss.from.obj(['a']), new Ouch(db).merge(f), () => {
        assert.isTrue(db.put.called)
        done()
      })
    })
    it('should pass items to put', function (done) {
      var f = sinon.spy((x) => x)
      var db = {
        put: sinon.spy(() => Promise.resolve(null))
      }
      miss.pipe(miss.from.obj(['a', 'b']), new Ouch(db).merge(f), () => {
        assert.equal(db.put.getCall(0).args[0], 'a')
        assert.equal(db.put.getCall(1).args[0], 'b')
        done()
      })
    })
    it('should pass items to provided function', function (done) {
      var f = sinon.spy((x) => x)
      var db = {
        put: sinon.spy(() => Promise.resolve(null))
      }
      miss.pipe(miss.from.obj(['a', 'b']), new Ouch(db).merge(f), () => {
        assert.equal(f.getCall(0).args[0], 'a')
        assert.equal(f.getCall(1).args[0], 'b')
        done()
      })
    })

    it('should fail when put failed', function (done) {
      var f = sinon.spy((x) => x)
      var error = new Error()
      var db = {
        put: sinon.spy(() => Promise.reject(error))
      }
      miss.pipe(miss.from.obj(['a', 'b']), new Ouch(db).merge(f), (err) => {
        assert.equal(err, error)
        done()
      })
    })

    it('should call get when got update conflict', function (done) {
      var object = {
        _id: 'a'
      }
      var f = sinon.spy((x) => x)
      var error = new Error()
      error.name = 'conflict'
      var db = {
        put: sinon.spy(() => Promise.reject(error)),
        get: sinon.spy(() => Promise.resolve(object))
      }
      miss.pipe(miss.from.obj([object]), new Ouch(db).merge(f), () => {
        assert.isTrue(db.get.called)
        done()
      })
    })

    it('should pass id to get when got update conflict', function (done) {
      var object = {
        _id: 'a'
      }
      var f = sinon.spy((x) => x)
      var error = new Error()
      error.name = 'conflict'
      var db = {
        put: sinon.spy(() => Promise.reject(error)),
        get: sinon.spy(() => Promise.resolve(object))
      }
      miss.pipe(miss.from.obj([object]), new Ouch(db).merge(f), () => {
        assert.equal(db.get.getCall(0).args[0], 'a')
        done()
      })
    })
    it('should merge get result when got update conflict', function (done) {
      var object = {
        _id: 'a'
      }
      var f = sinon.spy((x) => x)
      var error = new Error()
      error.name = 'conflict'
      var db = {
        put: sinon.spy(() => Promise.reject(error)),
        get: sinon.spy(() => Promise.resolve('b'))
      }
      miss.pipe(miss.from.obj([object]), new Ouch(db).merge(f), () => {
        assert.equal(f.getCall(1).args[1], 'b')
        done()
      })
    })

    it('should put merge result when got update conflict', function (done) {
      var object = {
        _id: 'a'
      }
      var f = sinon.spy((x) => x)
      var error = new Error()
      error.name = 'conflict'
      var db = {
        put: sinon.spy(() => Promise.reject(error)),
        get: sinon.spy(() => Promise.resolve('b'))
      }
      miss.pipe(miss.from.obj([object]), new Ouch(db).merge(f), () => {
        assert.equal(db.put.getCall(1).args[0], object)
        done()
      })
    })
  })
})

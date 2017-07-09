var assert = require('chai').assert
var sinon = require('sinon')
var Ouch = require('../index')
var miss = require('mississippi')
var sink = () => miss.to.obj((_1, _2, cb) => cb())
describe('Ouch', function () {
  describe('#all()', function () {
    it('should call allDocs', function (done) {
      var db = {
        allDocs: sinon.spy(() => Promise.resolve(null))
      }
      miss.pipe(new Ouch(db).all(), sink(), () => {
        assert.isTrue(db.allDocs.called)
        done()
      })
    })

    it('should call allDocs with include_docs', function (done) {
      var db = {
        allDocs: sinon.spy(() => Promise.resolve(null))
      }
      miss.pipe(new Ouch(db).all(), sink(), () => {
        var options = db.allDocs.getCall(0).args[0]
        assert.isDefined(options)
        assert.isTrue(options.include_docs)
        done()
      })
    })

    it('should pass other options to all docs', function (done) {
      var db = {
        allDocs: sinon.spy(() => Promise.resolve(null))
      }
      miss.pipe(new Ouch(db).all({
        other: true
      }), sink(), () => {
        var options = db.allDocs.getCall(0).args[0]
        assert.isDefined(options)
        assert.isTrue(options.other)
        done()
      })
    })

    it('should set limit to highWaterMark', function (done) {
      var db = {
        allDocs: sinon.spy(() => Promise.resolve(null))
      }
      var all = new Ouch(db).all()
      all._readableState.highWaterMark = 100
      miss.pipe(all, sink(), () => {
        var options = db.allDocs.getCall(0).args[0]
        assert.isDefined(options)
        assert.equal(options.limit, 100)
        done()
      })
    })

    it('should set startkey to last key of previous batch', function (done) {
      var result = [{
        rows: [{
          key: 'a',
          doc: 'doc'
        }]
      }].reverse()
      var db = {
        allDocs: sinon.spy(() => Promise.resolve(result.pop()))
      }
      miss.pipe(new Ouch(db).all(), sink(), () => {
        var options = db.allDocs.getCall(1).args[0]
        assert.isDefined(options)
        assert.equal(options.startkey, 'a')
        done()
      })
    })
    // Have to figure out how to test that
    xit('should set skip to 1 in all batches after first', function (done) {
      var result = [{
        rows: [{
          key: 'a'
        }]
      }].reverse()
      var db = {
        allDocs: sinon.spy(() => Promise.resolve(result.pop()))
      }
      var rows = []
      miss.pipe(new Ouch(db).all(), miss.to.obj((row, _2, cb) => {
        rows.push(row)
        cb()
      }), () => {
        var options = db.allDocs.getCall(0).args[0]
        assert.isDefined(options)
        assert.equal(options.skip, 0)
        options = db.allDocs.getCall(1).args[0]
        assert.isDefined(options)
        assert.equal(options.skip, 1)
        done()
      })
    })

    it('should read rows', function (done) {
      var result = [{
        rows: [{
          doc: 'a'
        }]
      }].reverse()
      var db = {
        allDocs: sinon.spy(() => Promise.resolve(result.pop()))
      }
      var rows = []
      miss.pipe(new Ouch(db).all(), miss.to.obj((row, _2, cb) => {
        rows.push(row)
        cb()
      }), () => {
        assert.deepEqual(rows, ['a'])
        done()
      })
    })

    it('should read multiple rows', function (done) {
      var result = [{
        rows: [{
          doc: 'a'
        }, {
          doc: 'b'
        }]
      }].reverse()
      var db = {
        allDocs: sinon.spy(() => Promise.resolve(result.pop()))
      }
      var rows = []
      miss.pipe(new Ouch(db).all(), miss.to.obj((row, _2, cb) => {
        rows.push(row)
        cb()
      }), () => {
        assert.deepEqual(rows, ['a', 'b'])
        done()
      })
    })

    it('should read rows in multiple batches', function (done) {
      var result = [{
        rows: [{
          doc: 'a'
        }]
      }, {
        rows: [{
          doc: 'b'
        }]
      }].reverse()
      var db = {
        allDocs: sinon.spy(() => Promise.resolve(result.pop()))
      }
      var rows = []
      miss.pipe(new Ouch(db).all(), miss.to.obj((row, _2, cb) => {
        rows.push(row)
        cb()
      }), () => {
        assert.deepEqual(rows, ['a', 'b'])
        done()
      })
    })
  })
})

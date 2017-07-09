var assert = require('chai').assert
var sinon = require('sinon')
var Ouch = require('../index')
var miss = require('mississippi')
var sink = () => miss.to.obj((_1, _2, cb) => cb())
describe('Ouch', function () {
  describe('#view()', function () {
    it('should call query', function (done) {
      var db = {
        query: sinon.spy(() => Promise.resolve(null))
      }
      miss.pipe(new Ouch(db).view('view/name'), sink(), () => {
        assert.isTrue(db.query.called)
        done()
      })
    })

    it('should pass view to query', function (done) {
      var db = {
        query: sinon.spy(() => Promise.resolve(null))
      }
      miss.pipe(new Ouch(db).view('view/name'), sink(), () => {
        var view = db.query.getCall(0).args[0]
        assert.equal(view, 'view/name')
        done()
      })
    })

    it('should pass other options to query', function (done) {
      var db = {
        query: sinon.spy(() => Promise.resolve(null))
      }
      miss.pipe(new Ouch(db).view('view/name', {
        other: true
      }), sink(), () => {
        var options = db.query.getCall(0).args[1]
        assert.isDefined(options)
        assert.isTrue(options.other)
        done()
      })
    })
    describe('default pagination', function () {
      it('should set limit to highWaterMark', function (done) {
        var db = {
          query: sinon.spy(() => Promise.resolve(null))
        }
        var all = new Ouch(db).view('view/name')
        all._readableState.highWaterMark = 100
        miss.pipe(all, sink(), () => {
          var options = db.query.getCall(0).args[1]
          assert.isDefined(options)
          assert.equal(options.limit, 100)
          done()
        })
      })

      it('should set startkey to last key of previous batch', function (done) {
        var result = [{
          rows: [{
            key: 'a'
          }]
        }, {
          rows: [{
            key: 'b'
          }]
        }].reverse()
        var db = {
          query: sinon.spy(() => Promise.resolve(result.pop()))
        }
        var rows = []
        miss.pipe(new Ouch(db).view('view/name'), miss.to.obj((row, _2, cb) => {
          rows.push(row)
          cb()
        }), () => {
          var options = db.query.getCall(1).args[1]
          assert.isDefined(options)
          assert.equal(options.startkey, 'a')
          options = db.query.getCall(2).args[1]
          assert.isDefined(options)
          assert.equal(options.startkey, 'b')
          done()
        })
      })
      it('should set startkey_docid to last id of previous batch', function (done) {
        var result = [{
          rows: [{
            id: '1',
            key: 'a'
          }]
        }, {
          rows: [{
            id: '2',
            key: 'b'
          }]
        }].reverse()
        var db = {
          query: sinon.spy(() => Promise.resolve(result.pop()))
        }
        var rows = []
        miss.pipe(new Ouch(db).view('view/name'), miss.to.obj((row, _2, cb) => {
          rows.push(row)
          cb()
        }), () => {
          var options = db.query.getCall(1).args[1]
          assert.isDefined(options)
          assert.equal(options.startkey_docid, '1')
          options = db.query.getCall(2).args[1]
          assert.isDefined(options)
          assert.equal(options.startkey_docid, '2')
          done()
        })
      })
      it('should set skip to 1 in all batches after first', function (done) {
        var result = [{
          rows: [{
            key: 'a'
          }]
        }].reverse()
        var db = {
          query: sinon.spy(() => Promise.resolve(result.pop()))
        }
        var rows = []
        miss.pipe(new Ouch(db).view('view/name'), miss.to.obj((row, _2, cb) => {
          rows.push(row)
          cb()
        }), () => {
          var options = db.query.getCall(0).args[1]
          assert.isDefined(options)
          assert.equal(options.skip, 0)
          options = db.query.getCall(1).args[1]
          assert.isDefined(options)
          assert.equal(options.skip, 1)
          done()
        })
      })
      it('should finish on empty batch', function (done) {
        var result = [{
          rows: ['a']
        }, {
          rows: []
        }, {
          rows: ['b']
        }].reverse()
        var db = {
          query: sinon.spy(() => Promise.resolve(result.pop()))
        }
        var rows = []
        miss.pipe(new Ouch(db).view('view/name'), miss.to.obj((row, _2, cb) => {
          rows.push(row)
          cb()
        }), () => {
          assert.deepEqual(rows, ['a'])
          done()
        })
      })
    })

    describe('limit+skip pagination', function () {
      it('should set limit to highWaterMark', function (done) {
        var db = {
          query: sinon.spy(() => Promise.resolve(null))
        }
        var all = new Ouch(db).view('view/name', {
          limit_skip: true
        })
        all._readableState.highWaterMark = 100
        miss.pipe(all, sink(), () => {
          var options = db.query.getCall(0).args[1]
          assert.isDefined(options)
          assert.equal(options.limit, 100)
          done()
        })
      })

      it('should set skip to number of processed documents', function (done) {
        var result = [{
          rows: [{
            key: 'a'
          }, {
            key: 'b'
          }, {
            key: 'c'
          }]
        }, {
          rows: [{
            key: 'a'
          }, {
            key: 'b'
          }, {
            key: 'c'
          }]
        }].reverse()
        var db = {
          query: sinon.spy(() => Promise.resolve(result.pop()))
        }
        var rows = []
        miss.pipe(new Ouch(db).view('view/name', {
          limit_skip: true
        }), miss.to.obj((row, _2, cb) => {
          rows.push(row)
          cb()
        }), () => {
          var options = db.query.getCall(1).args[1]
          assert.isDefined(options)
          assert.equal(options.skip, 3)
          options = db.query.getCall(2).args[1]
          assert.isDefined(options)
          assert.equal(options.skip, 6)
          done()
        })
      })
      it('should finish on empty batch', function (done) {
        var result = [{
          rows: ['a']
        }, {
          rows: []
        }, {
          rows: ['b']
        }].reverse()
        var db = {
          query: sinon.spy(() => Promise.resolve(result.pop()))
        }
        var rows = []
        miss.pipe(new Ouch(db).view('view/name', {
          limit_skip: true
        }), miss.to.obj((row, _2, cb) => {
          rows.push(row)
          cb()
        }), () => {
          assert.deepEqual(rows, ['a'])
          done()
        })
      })
    })

    it('should read rows', function (done) {
      var result = [{
        rows: ['a']
      }].reverse()
      var db = {
        query: sinon.spy(() => Promise.resolve(result.pop()))
      }
      var rows = []
      miss.pipe(new Ouch(db).view('view/name'), miss.to.obj((row, _2, cb) => {
        rows.push(row)
        cb()
      }), () => {
        assert.deepEqual(rows, ['a'])
        done()
      })
    })

    it('should read multiple rows', function (done) {
      var result = [{
        rows: ['a', 'b']
      }].reverse()
      var db = {
        query: sinon.spy(() => Promise.resolve(result.pop()))
      }
      var rows = []
      miss.pipe(new Ouch(db).view('view/name'), miss.to.obj((row, _2, cb) => {
        rows.push(row)
        cb()
      }), () => {
        assert.deepEqual(rows, ['a', 'b'])
        done()
      })
    })

    it('should read rows in multiple batches', function (done) {
      var result = [{
        rows: ['a']
      }, {
        rows: ['b']
      }].reverse()
      var db = {
        query: sinon.spy(() => Promise.resolve(result.pop()))
      }
      var rows = []
      miss.pipe(new Ouch(db).view('view/name'), miss.to.obj((row, _2, cb) => {
        rows.push(row)
        cb()
      }), () => {
        assert.deepEqual(rows, ['a', 'b'])
        done()
      })
    })
  })
})

var assert = require('chai').assert;
var sinon = require('sinon');
var Ouch = require('../index');
var miss = require('mississippi');
describe('Ouch', function () {
    describe('#sink()', function () {


        it('should call put', function (done) {
            var db = {
                put: sinon.spy(() => Promise.resolve(null))
            }
            miss.pipe(miss.from.obj(["a"]), new Ouch(db).sink(), () => {
                assert.isTrue(db.put.called);
                done();
            });
        });
        it('should pass items to put', function (done) {
            var db = {
                put: sinon.spy(() => Promise.resolve(null))
            }
            miss.pipe(miss.from.obj(["a", "b"]), new Ouch(db).sink(), () => {
                assert.equal(db.put.getCall(0).args[0], "a");
                assert.equal(db.put.getCall(1).args[0], "b");
                done();
            });
        });
        it('should fail when put failed', function (done) {
            var error = new Error();
            var db = {
                put: sinon.spy(() => Promise.reject(error))
            }
            miss.pipe(miss.from.obj(["a", "b"]), new Ouch(db).sink(), (err) => {
                assert.equal(err, error);
                done();
            });
        });

    });
})
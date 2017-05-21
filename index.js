var miss = require('mississippi');
class Ouch {
    constructor(db) {
        this.db = db;
    }
    all(originalOptions) {
        var options = Object.assign({}, originalOptions, {
            include_docs: true,
            skip: 0
        });
        var stream = miss.from.obj((size, next) => {
            options.limit = options.skip + size;
            this.db.allDocs(options).then((result) => {
                if (result.rows.length > 0) {
                    options.startkey = result.rows[result.rows.length - 1].key;
                    options.skip = 1;
                    var last = result.rows.pop()
                    result.rows.forEach((row) => stream.push(row.doc));
                    next(null, last.doc);
                } else {
                    next(null, null);
                }
            }).catch((err) => {
                next(err);
            });
        });
        return stream;
    }
    view(view, originalOptions) {
        var options = Object.assign({}, originalOptions, {
            skip: 0
        });
        var stream = miss.from.obj((size, next) => {
            options.limit = options.skip + size;
            this.db.query(view, options).then((result) => {
                if (result.rows.length > 0) {
                    options.startkey = result.rows[result.rows.length - 1].key;
                    options.skip = 1;
                    var last = result.rows.pop()
                    result.rows.forEach((row) => stream.push(row));
                    next(null, last);
                } else {
                    next(null, null);
                }
            }).catch((err) => {
                next(err);
            });
        });
        return stream;
    }
    sink() {
        return miss.to.obj((chunk, enc, done) => {
            this.db.put(chunk).then(() => done()).catch((err) => done(err));
        })
    }
}

module.exports = Ouch;

var miss = require('mississippi');
class Ouch {
    constructor(db) {
        this.db = db;
    }
    all(originalOtions) {
        var options = Object.assign({}, originalOtions, {
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
}

module.exports = Ouch;

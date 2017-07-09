var miss = require('mississippi')
class Ouch {
  /**
   * Creates Ouch instance.
   * 
   * @param {object} db - a PouchDB database 
   */
  constructor(db) {
    this.db = db
  }
  /**
   * Creates object stream listing all documents in database.
   * 
   * @param {object} originalOptions - options to be passed to allDocs
   */
  all(originalOptions) {
    var options = Object.assign({}, originalOptions, {
      include_docs: true,
      skip: 0
    })
    var stream = miss.from.obj((size, next) => {
      options.limit = options.skip + size
      this.db.allDocs(options).then((result) => {
        options = Object.assign({}, options)
        if (result.rows.length > 0) {
          options.startkey = result.rows[result.rows.length - 1].key
          options.skip = 1
          var last = result.rows.pop()
          result.rows.forEach((row) => stream.push(row.doc))
          next(null, last.doc)
        } else {
          next(null, null)
        }
      }).catch((err) => {
        next(err)
      })
    })
    return stream
  }
  /**
   * Creates object stream listing documents from view.
   * 
   * @param {(string|function)} view - name of persistent view of function for a temporary view
   * @param {object} originalOptions - options to be passed to query
   */
  view(view, originalOptions) {
    var options = Object.assign({}, originalOptions, {
      skip: 0
    })
    if (options.limit_skip) {
      const stream = miss.from.obj((size, next) => {
        options.limit = size
        this.db.query(view, options).then((result) => {
          options = Object.assign({}, options)
          if (result.rows.length > 0) {
            options.skip += result.rows.length
            var last = result.rows.pop()
            result.rows.forEach((row) => stream.push(row))
            next(null, last)
          } else {
            next(null, null)
          }
        }).catch((err) => {
          next(err)
        })
      })
      return stream
    } else {
      const stream = miss.from.obj((size, next) => {
        options.limit = options.skip + size
        this.db.query(view, options).then((result) => {
          options = Object.assign({}, options)
          if (result.rows.length > 0) {
            options.startkey = result.rows[result.rows.length - 1].key
            options.startkey_docid = result.rows[result.rows.length - 1].id
            options.skip = 1
            var last = result.rows.pop()
            result.rows.forEach((row) => stream.push(row))
            next(null, last)
          } else {
            next(null, null)
          }
        }).catch((err) => {
          next(err)
        })
      })
      return stream
    }
  }
  /**
   * Creates object write stream receiving documents and string them in database.    
   */
  sink() {
    return miss.to.obj((chunk, enc, done) => {
      this.db.put(chunk).then(() => done()).catch((err) => done(err))
    })
  }

  /**
   * Creates object write stream receiving documents and string them in database. 
   * 
   * Uses provided function to resolve merge conflicts.
   * @param {mergeCallback} f - merge callback
   */
  merge(f) {
    return miss.to.obj(
      (object, encoding, callback) => {
        var document = f(object)
        this.db.put(document).catch((error) => {
          if (error.name === 'conflict') {
            return this.db.get(document._id).then((existing) => {
              return this.db.put(f(object, existing))
            })
          } else {
            throw error
          }
        }).then(() => callback()).catch((error) => {
          callback(error)
        })
      })
  }
}

module.exports = Ouch
/**
 * Merge callback generating merged document from incoming and existing document.
 * 
 * Must handle the case when existing document is undefined
 * 
 * @callback mergeCallback
 * @param {object} incoming - an incoming document
 * @param {object=} existing - an existing document 
 * @return {object} merged document
 */

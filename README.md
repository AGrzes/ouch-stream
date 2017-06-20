# Ouch Stream [![Build Status](https://travis-ci.org/AGrzes/ouch-stream.svg?branch=master)](https://travis-ci.org/AGrzes/ouch-stream)
Library wrapping [PouchDB](https://pouchdb.com/) with object streams.

## Usage
To use Ouch Stream one have to wrap database object with Ouch instance and then use its methods to create Readable and Writable streams.

    var Ouch = require('ouch-stream');
    var ouch = new Ouch(db);
    ouch.all().pipe(transform).pipe(ouch.sink())

## Reference
### Constructor
Wraps single pouchdb database.

    new Ouch(db)

|Argument| Description|
|---|---|
| db | A PouchDB database |

### Methods
#### all
Returns readable stream of all documents.

    ouch.all(options)

|Argument| Description|
|---|---|
| options | An options object passed to db.all_docs. The following fields are not passed: `include_docs`, `skip`, `limit`, `startkey` |

#### view
Returns readable stream of view results.

    ouch.view(name,options)

|Argument| Description|
|---|---|
| name | A view name |
| options | An options object passed to db.query. The following fields are not passed: `skip`, `limit`, `startkey`. The default pagination is using `startkey` for performance reason, setting `limit_skip` switches to use growing `skip` value. |

To use this method the db object must support query method.

#### sink
Returns writable stream that writes incoming objects into db. 

The operation will fail on any error so it is useful for inserting completely new documents and for updating documents previously fetched from db (so current `_rev` is known). 

    ouch.sink()

#### merge
Returns writable stream that writes incoming objects into db. 

The operation will call the merge function with incoming object to prepare document to store. The operation will call the merge function again with incoming object and current document state if conflict is encountered. It will then retry write with the result of merge function.

    ouch.merge(mergeFunction)    

|Argument| Description|
|---|---|
| mergeFunction | A merge function `(object,current) => document to store`  |

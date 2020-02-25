var Datastore = require('nedb'),
    path = require('path');

var db = {};
db.measures = new Datastore( path.resolve(__dirname,'measures.db') );
db.measures.loadDatabase();

//db.settings.persistence.setAutocompactionInterval(60000);


function _processGet( dbName, req, res ) {
    var tag = req.query.tag,
        label = req.query.label;
    if ( tag ) {
        db[dbName].find( { "tag": tag, "label": label}).sort({ created: -1 }).exec( function(err, result) {
            if ( err ) {
                res.status(500).json( {success: false, error: err} );
            } else {
                res.status(200).json( result );
            }
        } );
    } else {
        res.status(400).json( { success: false, error: "tag or label params not found" } );
    }
    
}

function _processUpdateCreate ( dbName, req, res ) {
    var id = req.params.id;
    if ( id ) {

        db[dbName].update( { "_id": id } , req.body, {"upsert": true}, function(err, affected, affectedDocuments) {
            if (err){
                res.status(500).json( { success: false, error: err } );
            } else {
                res.status(200).json( {affected:affected, affectedDocuments:affectedDocuments} );
            }
        } );
    } else {
        res.status(400).json( { success: false, error: "Id Not found" } );
    }
}

function processNewMeasure (req, res ) {
    var id = req.params.id;
    if ( id ) {

        db['measures'].insert( req.body, function(err, newDoc) {
            if (err){
                res.status(500).json( { success: false, error: err } );
            } else {
                res.status(200).json( newDoc );
            }
        } );
    } else {
        res.status(400).json( { success: false, error: "Id Not found" } );
    }
}

function processUpdateCreateMeasure( req, res ) {
    _processUpdateCreate("measures", req, res);
}

function processGetAllMeasures( req, res ) {
    _processGet("measures", req, res);
}



function nedb ( req, res ) {
    if ( !req.body || !req.body.collection || !req.body.filter || !req.body.method ) {
        res.status(400).json( {success: false, error: "Query params missing"} );
        return;
    }

    if ( req.body.method === "get" ){
        db[req.body.collection].find( req.body.filter , function(err, result) {
            if ( err ) {
                res.status(500).json( {success: false, error: err} );
            } else {
                res.status(200).json( result );
            }
        } );
    } else if ( req.body.method === "delete" ) {
        db[req.body.collection].remove( req.body.filter, { multi: true }, function (err, numRemoved) {
            if ( err ) {
                res.status(500).json( {success: false, error: err} );
            } else {
                res.status(200).json( numRemoved );
            }
        });
    }
}

function processDelete ( req, res ) {
    var id = req.params.id;
    if ( id ) {

        db['measures'].remove({ _id: id }, {}, function (err, numRemoved) {
            if ( err ) {
                res.status(500).json( {success: false, error: err} );
            } else {
                res.status(200).json( {success: true, numRemoved: numRemoved} );
            }
        });

    } else {
        res.status(400).json( { success: false, error: "Id Not found" } );
    }
}

exports.processUpdateCreateMeasure = processUpdateCreateMeasure;
exports.processGetAllMeasures = processGetAllMeasures;
exports.processNewMeasure = processNewMeasure;
exports.processDeleteMeasure = processDeleteMeasure;
exports.processGetMeasure = function( req, res ){
    var id = req.params.id;
    if ( id ) {
        db['measures'].findOne( { "_id": id } , function(err, result) {
            if ( err ) {
                res.status(500).json( {success: false, error: err} );
            } else {
                res.status(200).json( result );
            }
        } );
    } else {
        res.status(400).json( { success: false, error: "Id Not found" } );
    }
};
exports.nedb = nedb;
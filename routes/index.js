var express = require('express');
var router = express.Router();
var db = require('../db.js');
var path = require('path');



//Database
router.get('/measures', db.processGetAllMeasures );
router.post('/measures', db.processNewMeasure );
router.get('/measures/:id', db.processGetMeasure );
router.post('/measures/:id', db.processUpdateCreateMeasure );
router.delete('/measures/:id', db.processDeleteMeasure );

module.exports = router;
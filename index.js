var express = require('express')
    app = express(),
    bodyParser = require('body-parser'),
    port = process.env.PORT || '8200',
    port_unsecure = process.env.PORT_UNSECURE || '8202',
    path = require('path'),
    fs = require('fs'),
    http = require('http'),
    https = require('https');

// Updateing configuration from parameters
var arg = process.argv.slice(2);
arg.forEach( function(a) {
    var key = a.split("=");
    switch( key[0] ) {
      case "auth_port":
        port = key[1];
        break;
      case "comments_port_unsecure":
        port_unsecure = key[1];
        break;
  }
} );

var routes = require('./routes/index.js');
var oneDay = 86400000;

// Config application
app.use(bodyParser.json());

// Set CORS headers: allow all origins, methods,
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    //intercepts OPTIONS method
    if ('OPTIONS' === req.method) {
      //respond with 200
      res.status(200).send();
    }
    else {
    //move on
      next();
    }
});
app.use('/api', routes);
// --------- End Config application


var options = {
    //ca: [fs.readFileSync( "C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\root.pem" )],
    key: fs.readFileSync( "C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\server_key.pem" ),
    cert: fs.readFileSync( "C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\server.pem" ),
};

var server = https.createServer( options, app );
server.listen( port, function() {
   console.log('HTTPS Server listening on port ' + port );
} );

var serverUnsecure = http.createServer( app );
serverUnsecure.listen( port_unsecure, function() {
   console.log('HTTP Server listening on port ' + port_unsecure );
} );
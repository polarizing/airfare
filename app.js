// DEPENDENCIES
// express - web application framework
// fs - read/write file system
// request - HTTP request client
// cheerio - implementation of jQuery for server
// socket.io - sockets
// swig - templating / rendering engine

var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var socketio = require('socket.io');
var swig = require('swig');
var bodyParser = require('body-parser');

// Require routes.
var index = require('./routes/');
var search = require('./routes/search');
var discover = require('./routes/discover');
var api = require('./routes/api');

// Require models.
var models = require("./models")

// Instantiate express.
var app = express();
var server;
var io;

// Configure templating engine.
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
swig.setDefaults({ cache: false});

// Sync with Database and Start Server
models.Query.sync() // force drop table if exists [DEVELOPMENT]
	.then(function() {
		models.Results.sync()
			.then(function() {
				// Tell server to listen on whatever is in environment variable PORT or 3000
				// (for Heroku, AWS deployment)
				server = app.listen(process.env.PORT || 3001, function() {
					console.log('listening on port 3000')
				});
				io = socketio.listen(server);

				// Routing
				app.use('/', index());
				app.use('/search', search(io));
				app.use('/discover',  discover());
				app.use('/api', api());
			})
	})
	.catch(console.error);


// Catch all incoming connections [MW]
app.use(function(req, res, next) {
	console.log(req.method, req.path, res.statusCode);
	next();
})

// Body-Parser
app.use(bodyParser.urlencoded({ extended: true })); // for HTML form submits
app.use(bodyParser.json()); // would be for AJAX requests

// Serving static files in public folder
app.use(express.static(__dirname + '/assets/public'));

// Error handling
app.use(function(err, req, res, next) {
	if (err) console.error('Caught an error', err);
	res.end();
})

//set properties based on environment var MUSICILO_ENV
var configDir = './';
if(!process.env.MUSICILO_ENV){
	console.log("process.env.MUSICILO_ENV variables must be set, exiting");
	return;
}
else{
	console.log("config for env: " + process.env.MUSICILO_ENV + ' with config dir: ' + process.env.MUSICILO_ENV_CONFIG_DIR);
}

if(process.env.MUSICILO_ENV='OPENSHIFT'){
	configDir = process.env.OPENSHIFT_DATA_DIR;
}
else{
	configDir = './'
}
require('dotenv').load(configDir);

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 3000
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'


mongodb_connection_string = process.env.MONGO_URL;

//take advantage of openshift env vars when available:
if(process.env.OPENSHIFT_MONGODB_DB_URL){
    mongodb_connection_string = process.env.OPENSHIFT_MONGODB_DB_URL + "nodejs";
}

// Require keystone
var keystone = require('keystone'),
	handlebars = require('express-handlebars');


// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

var mongoose = require('mongoose');

var options = {
    server: {
        auto_reconnect: true,
        socketOptions : {
            keepAlive: 1
        }
    }
};

//keystone.connect(mongoose);
mongoose.connect(mongodb_connection_string, options);
mongoose.set('debug', true);

keystone.mongoose = mongoose;

mongoose.connection.on('error', function(err){
    console.log("error connecting to mongoose " + err);
});

mongoose.connection.on('open', function() {
    console.log("connection to mongoose opened");
});

mongoose.connection.on('close', function() {
    console.log("connection to mongoose closed");
});

process.on('SIGINT', function() {
    mongoose.connection.close(function () {
        console.log('SIGINT Mongoose connection closed');
        process.exit(0);
    });
});


keystone.init({

	'name': 'musicilo',
	'brand': 'musicilo',
	
	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'hbs',
	
	'custom engine': handlebars.create({
		layoutsDir: 'templates/views/layouts',
		partialsDir: 'templates/views/partials',
		defaultLayout: 'default',
		helpers: new require('./templates/views/helpers')(),
		extname: '.hbs'
	}).engine,
	
	'emails': 'templates/emails',
	
	'auto update': true,
	'session': true,
	'auth': true,
	'user model': 'User',
	'cookie secret': '-q)0od#zKS"|M9NsKTwc;c`-`m7VI?y/}ztgLM4*v;C1Su9s]h{d77"eXT3eH8/n'

});


var path = require('path');
global.APP_ROOT = path.resolve(__dirname);
global.APP_LIB = APP_ROOT + "/lib/";
global.PUBLIC_APP_LIB = APP_ROOT + "/public/js/lib/";
//global.UPLOADS_DIR = "/var/www/uploads/";
global.UPLOADS_DIR  = "/Users/marshallpowell/dev/musicilo2/uploads/";
global.TEMPDIR = '/tmp/';

if(process.env.TMPDIR){
	global.TEMPDIR = process.env.TMPDIR;
}


console.log("****** global.TEMPDIR: " + global.TEMPDIR);

global.FB_CLIENTID = '1558894697697443';
global.FB_CALLBACKURL = 'http://local.cluckoldhen.com:3000/auth/facebook/callback';
global.FB_CLIENTSECRET = '964ee6d698f152d81cc9e8dadaed50e3';
global.BASE_URL = 'http://local.cluckoldhen.com:3000';
global.ENV = 'local';

if(process.env.OPENSHIFT_DATA_DIR){

	global.FFMPEG = process.env.OPENSHIFT_DATA_DIR+'bin/ffmpeg';
    global.UPLOADS_DIR =  process.env.OPENSHIFT_DATA_DIR + "uploads/";
    global.FB_CLIENTID = '1558893454364234';
    global.FB_CALLBACKURL = 'http://nodejs-musicilo.rhcloud.com/auth/facebook/callback';
    global.FB_CLIENTSECRET = '1992cb3d2ab570277129e9f8911b63a4';
    global.BASE_URL = 'http://nodejs-musicilo.rhcloud.com';
	global.ENV = 'openshift';
}

var winston = require('winston');
global.logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ level: 'debug' }),
        new (winston.transports.File)({ filename: '/var/www/coh/cluckoldhen/app.log' })
    ]
});


var coh = require('./lib/coh.js');
keystone.coh = coh;


// Load your project's Models

keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js

keystone.set('locals', {
	_: require('underscore'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable
});

// Load your project's Routes

keystone.set('routes', require('./routes'));


// Start Keystone to connect to your database and initialise the web server

keystone.start();


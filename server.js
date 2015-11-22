
var express = require('express'),
    expressHbs = require('express-handlebars'),
    http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
    winston = require('winston'),
    helpers = require('./templates/views/helpers/index.js'),
    expressSession = require('express-session'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    flash = require('express-flash'),
    lessMiddleware = require('less-middleware');

//set properties based on environment var MUSICILO_ENV
var configDir = './';
if(!process.env.MUSICILO_ENV){
    console.log("process.env.MUSICILO_ENV variables must be set, exiting");
    return;
}

if(process.env.MUSICILO_ENV='OPENSHIFT'){
    configDir = process.env.OPENSHIFT_DATA_DIR;
}
else{
    configDir = './'
}
require('dotenv').load(configDir);

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';


mongodb_connection_string = process.env.MONGO_URL;

//take advantage of openshift env vars when available:
if(process.env.OPENSHIFT_MONGODB_DB_URL){
    mongodb_connection_string = process.env.OPENSHIFT_MONGODB_DB_URL + "nodejs";
}

mongoose.connect(mongodb_connection_string, {
    server: {
        auto_reconnect: true,
        socketOptions : {
            keepAlive: 1
        }
    }
});

mongoose.set('debug', true);

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

global.COOKIE_SECRET = '-q)0od#zKS"|M9NsKTwc;c`-`m7VI?y/}ztgLM4*v;C1Su9s]h{d77"eXT3eH8/n';

var app = express();
app.set('views', __dirname+'/templates/views');
app.engine('hbs', expressHbs({extname:'hbs', defaultLayout:'default.hbs',layoutsDir: __dirname + '/templates/views/layouts', helpers : helpers}));
app.set('view engine', 'hbs');
app.use(cookieParser()); //cookie: { secure: false } set to true above for SSL
app.use(flash());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({strict : false}));
app.use(lessMiddleware(path.join(__dirname, '/public'), {debug : false}));
app.use(express.static(__dirname + '/public'));

app.use(expressSession({
    secret: global.COOKIE_SECRET,
    saveUninitialized: true,
    resave: true,
    cookie: { secure: false }
}));

//TODO replace all globals with properties in the .env
global.APP_ROOT = path.resolve(__dirname);
global.APP_LIB = APP_ROOT + "/lib/";
global.PUBLIC_APP_LIB = APP_ROOT + "/public/js/lib/";
global.UPLOADS_DIR  = "/Users/marshallpowell/dev/musicilo2/uploads/";
global.TEMPDIR = '/tmp/';
global.LOGDIR = "/Users/marshallpowell/dev/musicilo2/logs";

global.FB_CLIENTID = '1558894697697443';
global.FB_CALLBACKURL = 'http://local.cluckoldhen.com:3000/auth/facebook/callback';
global.FB_CLIENTSECRET = '964ee6d698f152d81cc9e8dadaed50e3';
global.BASE_URL = 'http://local.cluckoldhen.com:3000';
global.ENV = 'local';

if(process.env.OPENSHIFT_DATA_DIR){
    global.TEMPDIR = process.env.OPENSHIFT_DATA_DIR + "tmp/";
    global.LOGDIR = process.env.OPENSHIFT_DATA_DIR + "logs/";
    global.FFMPEG = process.env.OPENSHIFT_DATA_DIR+'bin/ffmpeg';
    global.UPLOADS_DIR =  process.env.OPENSHIFT_DATA_DIR + "uploads/";
    global.FB_CLIENTID = '1558893454364234';
    global.FB_CALLBACKURL = 'http://nodejs-musicilo.rhcloud.com/auth/facebook/callback';
    global.FB_CLIENTSECRET = '1992cb3d2ab570277129e9f8911b63a4';
    global.BASE_URL = 'http://nodejs-musicilo.rhcloud.com';


    global.ENV = 'openshift';
}

//todo can this be used globally? log file should be a property
global.logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ level: 'debug' }),
        new (winston.transports.File)({ filename: global.LOGDIR })
    ]
});

/* multer is working correctly now??? so don't need this after all
 if(process.env.TMPDIR){
 global.TEMPDIR = process.env.TMPDIR;
 console.log("****** global.TEMPDIR: " + global.TEMPDIR);

 }
 */


require('./routes')(app);

app.listen(server_port);

app.listen( server_port, server_ip_address, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

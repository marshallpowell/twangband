
var express = require('express'),
    expressHbs = require('express-handlebars'),
    http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
    winston = require('winston'),
    helpers = require('./templates/views/helpers/index.js'),
    expressSession = require('express-session'),
    mongoStore = require('connect-mongo/es5')(expressSession),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    flash = require('express-flash'),
    lessMiddleware = require('less-middleware');

var server_port = 3000;

var mongoUrl=process.env.MONGO_SERVICE_HOST + ':' + process.env.MONGO_SERVICE_PORT + '/' + process.env.MONGO_DB_NAME;
console.log("connect to mongo url " + mongoUrl);


mongoose.connect(mongoUrl, {
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

/*
app.use(expressSession({
    secret: global.COOKIE_SECRET,
    saveUninitialized: true,
    resave: true,
    cookie: { secure: false }
}));
 */

var store = new mongoStore({ mongooseConnection: mongoose.connection });

// Catch errors
store.on('error', function(error) {
    console.log(error);
});

app.use(expressSession({
    secret: global.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    store: store
}));


global.APP_ROOT = path.resolve(__dirname);
global.APP_LIB = APP_ROOT + "/lib/";
global.PUBLIC_APP_LIB = APP_ROOT + "/public/js/lib/";
global.TEMPDIR = '/tmp/';
global.FB_CLIENTID = process.env.FB_CLIENTID;
global.FB_CALLBACKURL = process.env.FB_CALLBACKURL;
global.FB_CLIENTSECRET = process.env.FB_CLIENTSECRET;
global.BASE_URL = process.env.BASE_URL;
global.ENV='local';

global.logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ level: 'debug', handleExceptions: true, humanReadableUnhandledException: true}),
        new (winston.transports.File)({ filename: process.env.LOG_DIR + 'app.log', level: 'debug', handleExceptions: true, humanReadableUnhandledException: true, maxsize : 200000, maxFiles : 10})
    ]
});


require('./routes')(app);
/*
app.listen( server_port, server_ip_address, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});
*/

app.listen( server_port, function() {
    console.log((new Date()) + ' Server is listening on port 3000');
});

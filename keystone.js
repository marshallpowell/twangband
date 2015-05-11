// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load();


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
mongoose.connect('mongodb://localhost/cluckoldhen', options);
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


//keystone.connect(mongoose);

keystone.init({

	'name': 'cluckoldhen',
	'brand': 'cluckoldhen',
	
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




//handlebars.registerPartial('auth', fs.readFileSync('templates/views/layouts/auth.hbs', 'utf8'));


var path = require('path');
global.APP_ROOT = path.resolve(__dirname);
global.APP_LIB = APP_ROOT + "/lib/";
global.PUBLIC_APP_LIB = APP_ROOT + "/public/js/lib/";
global.UPLOADS_DIR = "/var/www/uploads/";

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

// Setup common locals for your emails. The following are required by Keystone's
// default email templates, you may remove them if you're using your own.

keystone.set('email locals', {
	logo_src: '/images/logo-email.gif',
	logo_width: 194,
	logo_height: 76,
	theme: {
		email_bg: '#f9f9f9',
		link_color: '#2697de',
		buttons: {
			color: '#fff',
			background_color: '#2697de',
			border_color: '#1a7cb7'
		}
	}
});

// Setup replacement rules for emails, to automate the handling of differences
// between development a production.

// Be sure to update this rule to include your site's actual domain, and add
// other rules your email templates require.

keystone.set('email rules', [{
	find: '/images/',
	replace: (keystone.get('env') == 'production') ? 'http://www.your-server.com/images/' : 'http://localhost:3000/images/'
}, {
	find: '/keystone/',
	replace: (keystone.get('env') == 'production') ? 'http://www.your-server.com/keystone/' : 'http://localhost:3000/keystone/'
}]);

// Load your project's email test routes

keystone.set('email tests', require('./routes/emails'));

// Configure the navigation bar in Keystone's Admin UI

keystone.set('nav', {
	'posts': ['posts', 'post-categories'],
	'galleries': 'galleries',
	'enquiries': 'enquiries',
	'users': 'users',
	'instruments': ['instruments', 'instrument-categories']
});




// Start Keystone to connect to your database and initialise the web server

keystone.start();


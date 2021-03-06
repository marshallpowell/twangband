/**
 * This file contains the common middleware used by your routes.
 * 
 * Extend or replace these functions as your application requires.
 * 
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */

var _ = require('underscore');
var hbs = require('handlebars');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var fs = require('fs');
var path = require('path');

hbs.registerHelper('json', function(context) {
    return JSON.stringify(context);
});


/**
	Initialises the standard view locals
	
	The included layout depends on the navLinks array to generate
	the navigation in the header, you may wish to change this array
	or replace it with your own templates / logic.
*/

exports.initLocals = function(req, res, next) {

	var locals = res.locals;
    locals.user = req.user;

	locals.navLinks = [
		{ label: 'Our Music',		key: 'songs',		href: '/music' },
        { label: 'Create A Song',		key: 'mixer',		href: '/songMixer' }

	];

	locals.CDN = '/'+(process.env.UPLOADS_BUCKET || 'uploads');

	//TODO may also be able to add local for logLevel here (eg. ?logLevel=DEBUG)

	next();
	
};


/**
	Fetches and clears the flashMessages before a view is rendered
*/

exports.flashMessages = function(req, res, next) {
/* this is not doing anything at the moment....
	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error')
	};

	for(var key in flashMessages){

		if(key == 'error'){

			logger.debug(key + ' IS an array, length: ' + flashMessages[key].length + ', value: ' + req.flash('error'));
			var msg = '';
			for(var i = 0; i < flashMessages[key].length; i++){
				msg += '** ' + flashMessages[key][i] + '<br />\n';
			}

			flashMessages[key] = msg;
			logger.debug('value is: ' + msg);
		}
		else{
			logger.debug(key + ' is not an array');
		}
	}
	
	res.locals.messages = _.any(flashMessages, function(msgs) { return msgs.length; }) ? flashMessages : false;

*/
	next();
	
};

exports.requireHTTPS = function(req, res, next){

    var schema = req.headers['x-forwarded-proto'];

    if (schema === 'https' || global.ENV == 'local') {
        next();
    }
    else {
        // Redirect to https.
        res.redirect('https://' + req.headers.host + req.url);
    }
};


/**
	Prevents people from accessing protected pages when they're not signed in
 */

exports.requireUser = function(req, res, next) {
	
	if (!req.user) {
		req.flash('error', 'Please sign in to access this page.');
		res.redirect('/login');
	} else {
		next();
	}
	
};

/**
 * Brought in from Keystone
 * enables you to specify route paths like routes.views.services (see routes/index.js)
 * @param rel__dirname
 * @returns {importer}
 */
exports.dispatchImporter = function(rel__dirname) {

	function importer(from) {
		var imported = {};
		var joinPath = function() {
			return '.' + path.sep + path.join.apply(path, arguments);
		};

		var fsPath = joinPath(path.relative(process.cwd(), rel__dirname), from);
		fs.readdirSync(fsPath).forEach(function(name) {
			var info = fs.statSync(path.join(fsPath, name));
			if (info.isDirectory()) {
				imported[name] = importer(joinPath(from, name));
			} else {
				// only import files that we can `require`
				var ext = path.extname(name);
				var base = path.basename(name, ext);
				if (require.extensions[ext]) {
					imported[base] = require(path.join(rel__dirname, from, name));
				}
			}
		});

		return imported;
	}

	return importer;

};
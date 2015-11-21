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

	logger.debug("register locals");

	var locals = res.locals;
    locals.user = req.user;

	locals.navLinks = [
		{ label: 'Home',		key: 'home',		href: '/' },
		{ label: 'Songs',		key: 'songs',		href: '/song/user' },
        { label: 'Record',		key: 'mixer',		href: '/songMixer' },
		{ label: 'Contact',		key: 'contact',		href: '/contact' }


	];

	logger.debug("locals.navLinks: " + JSON.stringify(locals.navLinks));
	
	next();
	
};


/**
	Fetches and clears the flashMessages before a view is rendered
*/

exports.flashMessages = function(req, res, next) {

	logger.debug('flash messages error length: ' + req.flash('error').length);

	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error')
	};
	
	res.locals.messages = _.any(flashMessages, function(msgs) { return msgs.length; }) ? flashMessages : false;


	next();
	
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

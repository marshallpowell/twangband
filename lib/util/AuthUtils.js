/**
 * Utility functions for Authentication
 */

    var keystone = require('keystone');
var  crypto = require('crypto');
var passport = require('passport');
var     http = require('http'),
    logger = require(APP_LIB + 'util/Logger').getLogger(__filename),
    req = http.IncomingMessage.prototype,
    res = http.ServerResponse.prototype;
var session = require('express-session');

var AuthUtils = module.exports = {};

AuthUtils.hash = function(str) {
	// force type
	str = '' + str;
	// get the first half
	str = str.substr(0, Math.round(str.length / 2));
	// hash using sha256
	return crypto
	    .createHmac('sha256', keystone.get('cookie secret'))
	    .update(str)
	    .digest('base64')
	    .replace(/\=+$/, '');
};

/**
 * Default a blank email
 */
AuthUtils.defaultEmailIfBlank= function(email, firstName, lastName){
	
	var out = "updateMe@updateMe.nowhere"
    
    if(email){	
    	logger.debug('email was submitted: ' + email);
    	out = email;
    }
    else {
    	
    	out = 'updateMe_' + firstName + '_' + lastName + '@updateMe.nowhere';
    	
    	logger.debug('no email was submitted, defaulting to: ' + out);
    }
	
	return out;
};

AuthUtils.doPassportSignin = function(user) {

    logger.debug('create cookie and sign in for: ' + JSON.stringify(user));

    passport.req.session.regenerate(function() {

        req.user = user;
        passport.req.session.userId = user.id;
        passport.res.locals.user = user;
        var userToken = user.id + ':' + AuthUtils.hash(user.password);
        passport.res.cookie('keystone.uid', userToken, { signed: true, httpOnly: true });
        passport.res.redirect('/');
    });





};
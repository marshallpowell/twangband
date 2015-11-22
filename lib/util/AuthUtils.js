/**
 * Utility functions for Authentication
 */

var crypto = require('crypto'),
 passport = require('passport'),
    http = require('http'),
    logger = require(APP_LIB + 'util/Logger').getLogger(__filename);

var AuthUtils = module.exports = {};


/**
 * Default a blank email
 */
AuthUtils.defaultEmailIfBlank= function(email, firstName, lastName){
	
	var out = "updateMe@updateMe.nowhere";
    
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

AuthUtils.signOut = function(req, res, next) {
    logger.debug('signOut user');

    res.clearCookie('keystone.uid');
    req.user = null;
    res.locals.user = null;

    req.session.regenerate(next);

};
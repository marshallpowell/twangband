/**
 * Utility functions for Authentication
 */
var  crypto = require('crypto');

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
    	console.log('email was submitted: ' + email);
    	out = email;
    }
    else {
    	
    	out = 'updateMe_' + firstName + '_' + lastName + '@updateMe.nowhere';
    	
    	console.log('no email was submitted, defaulting to: ' + out);
    }
	
	return out;
};
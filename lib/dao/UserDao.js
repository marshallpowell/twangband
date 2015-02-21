/**
 * User DAO
 */

var keystone = require('keystone'),
mongoose = require('mongoose'),
authUtils = require(APP_LIB+'util/AuthUtils');


var UserDao = module.exports = {};

UserDao.createSocialUser = function(socialProfile){
	
	mongoose.connect('localhost', 'cluckoldhen');

	mongoose.connection.on('open', function() {
	    // ready to do things, e.g.
	    var User = keystone.list('User');
	    
	    //TODO check to see if email exists first...
	    var email = authUtils.defaultEmailIfBlank(socialProfile.email, socialProfile.firstName, socialProfile.lastName);
	    
		var cohUser = new User.model({
			'name' : {'first_name' : socialProfile.firstName, 'last_name' : socialProfile.lastName}, 'password' : '1234', 'email' : email,
			'fbId' : socialProfile.socialId });
	    cohUser.save();
	    
	    console.log("saved new user: " + JSON.stringify(cohUser));
	    
	    return cohUser;
	});

	 mongoose.connection.close(function () {
		 console.log('Mongoose default connection closed');
		 //process.exit(0);
		 }); 
	
}
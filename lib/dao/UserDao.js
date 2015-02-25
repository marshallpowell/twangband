/**
 * User DAO
 */

var keystone = require('keystone'),
mongoose = require('mongoose'),
authUtils = require(APP_LIB+'util/AuthUtils');


var UserDao = module.exports = {};

UserDao.connect = function(){
    mongoose.connect('localhost', 'cluckoldhen');
}

UserDao.closeDb = function(){
    mongoose.connection.close(function () {
        console.log('Mongoose connection closed');
        //process.exit(0);
    });
}
UserDao.findOrCreateSocialUser = function(socialProfile){

    UserDao.connect();

    mongoose.connection.on('open', function() {
        var User = keystone.list('User');
        console.log('looking for user with fbId: ' + socialProfile.socialId);

        User.findOne({ 'fbId' : socialProfile.socialId }, function (err, existingUser) {
            if (err) {
                console.log('error finding user: ' + err);
            }
            else{

                console.log('found existing user: ' + existingUser.name.first_name);

                return existingUser;
            }


        })
    });


}
UserDao.createSocialUser = function(socialProfile){
	
	UserDao.connect();

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

    UserDao.closeDb();
	
}
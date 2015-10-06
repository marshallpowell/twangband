/**
 * User DAO
 */

var Q = require('q');
var keystone = require('keystone');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var User = User = keystone.list('User'); // keystone.list('User').model same as mongoose.model('User');
var authUtils = require(APP_LIB+'util/AuthUtils');
var dtoMapper = require(APP_LIB + 'util/DtoMapper');
var ObjectId = require('mongoose').Types.ObjectId;
var bcrypt = require('bcrypt');
var crypto = require('crypto');

var UserDao = module.exports = {};


/**
 * Get users contained in array ex. [123, 5678, 34576] (un-used, un-tested)
 * @param userIds
 * @returns {*}
 */
UserDao.getUsersById = function(userIds){

    logger.debug("getUsersById : " + JSON.stringify(userIds));

    var deferred = Q.defer();

    if(!Array.isArray(userIds)){
        deferred.reject('invalid data passed in for user search');
        return deferred.promise;
    }



    User.model.find({'_id': { $in: userIds}}).exec(function (err, existingUsers) {

        if (err) {
            logger.debug(err);
            deferred.reject(err);
        }
        else {
            logger.debug('found existing users: ' + existingUsers);
            var userDtos = [];

            for(var i = 0; i < existingUsers.length; i++){
                userDtos.push(dtoMapper.mapUserModel(existingUsers[i]));
            }

            deferred.resolve(userDtos);
        }
    });

    return deferred.promise;
};

UserDao.findUser = function(searchCriteriaDto){

    logger.debug("search for user with : " + JSON.stringify(searchCriteriaDto));

    var deferred = Q.defer();
    var query = {};

    var criteria = [];
    criteria['firstName'] = 'name.first';
    criteria['lastName'] = 'name.last';
    criteria['email'] = 'email';

    for(key in criteria){

        if(searchCriteriaDto[key]){
            //new RegExp('^'+name+'$', "i")
            query[criteria[key]] = new RegExp('^'+searchCriteriaDto[key]+'$', "i");
        }
    }

    User.model.find(query).exec(function (err, existingUsers) {

        if (err) {
            logger.debug(err);
            deferred.reject(err);
        }
        else {
            logger.debug('found existing user: ' + existingUsers);
            var userDtos = [];

            for(var i = 0; i < existingUsers.length; i++){
                userDtos.push(dtoMapper.mapUserModel(existingUsers[i]));
            }

            deferred.resolve(userDtos);
        }
    });

    return deferred.promise;
}

//55d0e7ba362d156128264e70
UserDao.findUserById = function(id){

    var deferred = Q.defer();
    var query = {};

    query['_id'] = new ObjectId(id);

    User.model.findOne({_id : new ObjectId(id)}).exec(function (err, existingUser) {

        if (err) {
            logger.debug(err);
            deferred.reject(err);
        }
        else {

            if (existingUser) {
                logger.debug('found existing user: ' + existingUser);
                var userDto = dtoMapper.mapUserModel(existingUser);
                deferred.resolve(userDto);

            }
            else {
                deferred.resolve(UserDao.createSocialUser(socialProfile));
            }

        }


    });

    return deferred.promise;
}


UserDao.findOrCreateSocialUser = function(socialProfile){

    logger.debug('looking for user with: ' + socialProfile.socialIdType + " " + socialProfile.socialId);

    var deferred = Q.defer();
    var query = {};

    query[socialProfile.socialIdType] = socialProfile.socialId;

    User.model.findOne(query).exec(function (err, existingUser) {

            if (err) {
                logger.debug(err);
                deferred.reject(err);
            }
            else {

                if (existingUser) {
                    logger.debug('found existing user: ' + existingUser);
                    var userDto = dtoMapper.mapUserModel(existingUser);
                    deferred.resolve(userDto);

                }
                else {
                    var userDto = UserDao.createSocialUser(socialProfile);

                    deferred.resolve(userDto);
                }

            }


    });

    return deferred.promise;


};

UserDao.createSocialUser = function(socialProfile){

    logger.debug('createSocialUser');

    var deferred = Q.defer();
    var email = authUtils.defaultEmailIfBlank(socialProfile.email, socialProfile.firstName, socialProfile.lastName);

    var defaultPassword = (Date.now() / 1000 | 0);
    var newUser = new User.model({
            'name' : {'first' : socialProfile.firstName, 'last' : socialProfile.lastName}, 'password' : defaultPassword, 'email' : email,
            'facebookId' : socialProfile.socialId, 'profilePic' : socialProfile.profilePic });

    newUser.save();

    logger.debug("saved new user: " + JSON.stringify(newUser));

    var userDto = dtoMapper.mapUserModel(newUser);
    userDto.firstLogin = true;
    deferred.resolve(userDto);

    return deferred.promise;


};

UserDao.getUserByPasswordRestToken = function(passwordResetToken) {

    var deferred = Q.defer();
    var query = {};

    query['passwordResetToken'] = passwordResetToken;

    User.model.findOne(query).exec(function (err, existingUser) {

        if (err) {
            logger.debug(err);
            deferred.reject(err);
        }
        else {

            if (existingUser) {

                if(existingUser.passwordResetTokenExpires < Date.now()){
                    deferred.reject('Your token has expired.');
                }
                else{
                    var userDto = dtoMapper.mapUserModel(existingUser);
                    deferred.resolve(userDto);
                }
            }
        }
    });

    return deferred.promise;
};

UserDao.setPasswordResetKey = function(email){

    var deferred = Q.defer();
    var query = {};

    query['email'] = email;

    User.model.findOne(query).exec(function (err, existingUser) {

        if (err) {
            logger.debug(err);
            deferred.reject(err);
        }
        else {

            if (existingUser) {
                logger.debug('found existing user: ' + existingUser);

                crypto.randomBytes(20, function(err, buff){

                    if(err){
                        logger.debug('error generating token ' + err);
                        deferred.reject(err);
                    }
                    else{
                        existingUser.passwordResetToken = buff.toString('hex');
                        existingUser.passwordResetTokenExpires = Date.now() + 3600000;
                        existingUser.save();

                        var userDto = dtoMapper.mapUserModel(existingUser);
                        userDto.passwordResetToken = existingUser.passwordResetToken;
                        userDto.passwordResetTokenExpires = existingUser.passwordResetTokenExpires;
                        deferred.resolve(userDto);
                    }

                })


            }
            else {
                deferred.reject("No user found");
            }

        }


    });

    return deferred.promise;
}

UserDao.authenticate = function(email, password){

    var deferred = Q.defer();
    var query = {};

    query['email'] = email;

    User.model.findOne(query).exec(function (err, existingUser) {

        if (err) {
            logger.debug(err);
            deferred.reject(err);
        }
        else {

            if (existingUser) {
                logger.debug('found existing user: ' + existingUser);

                //check if password matches
                bcrypt.compare(password, existingUser.password, function(err, response){

                    logger.debug("compare response: " + response);
                    if(response === true){
                            var userDto = dtoMapper.mapUserModel(existingUser);
                            deferred.resolve(userDto);
                    }
                    else{
                            deferred.reject("Credentials did not match any users in the system");
                        }

                });


                }

            else {
                deferred.reject("No user found");
            }

        }

    });

    return deferred.promise;

}

UserDao.createUser = function(userDto){

    logger.debug('createUser: ' + userDto.firstName);

    var deferred = Q.defer();

    //for some reason userDto is "undefined" when referenced inside of bcrypt.hash(). So had to create newUser here
    //outside of it, then update the password within and save. phew...
    var newUser = new User.model({
        'name': {'first': userDto.firstName, 'last': userDto.lastName}, 'password': 'updateme', 'email': userDto.email, 'profilePic' : userDto.profilePic, 'tags' : userDto.tags
    });

    bcrypt.hash(userDto.password, 10, function(err, hash) {

        if (err) {
            deferred.reject(err);
        }
        else {
            newUser.password = hash;
            newUser.save();

            logger.debug("saved new user: " + JSON.stringify(newUser));

            var userDto = dtoMapper.mapUserModel(newUser);
            deferred.resolve(userDto);
        }


    });



    return deferred.promise;


};

UserDao.updateProfile = function(userDto){

    logger.debug("enter updateProfile");

    var deferred = Q.defer();
    var query = {};

    query['_id'] = new ObjectId(userDto.id);

    User.model.findOne(query).exec(function (err, user) {

        user.name.first = userDto.firstName;
        user.name.last = userDto.lastName;
        user.email = userDto.email;
        user.tags = userDto.tags;

        if(userDto.profilePic){
            user.profilePic = userDto.profilePic;
        }

        user.save();

        deferred.resolve(userDto);
    });

    return deferred.promise;
};

UserDao.updateUserPassword = function(userId, password){

    logger.debug("enter updateUserPassword for userId: " + userId);
    var deferred = Q.defer();
    var query = {};
    query._id = new ObjectId(userId);

    User.model.findOne(query).exec(function (err, existingUser) {

        if(existingUser){

            logger.debug("password: " + password);

           bcrypt.hash(password, 10, function(err, hash){

               if(err){
                   logger.debug("There was an error: " + err);
                   deferred.reject(err);
               }
               else{
                   logger.debug("updating password with hash: "+hash);
                   existingUser.password = hash;
                   existingUser.save();

                   var userDto = dtoMapper.mapUserModel(existingUser);
                   deferred.resolve(userDto);
               }

           });



        }
        else if(err){
            deferred.reject(err);
        }
    });

    return deferred.promise;
};

UserDao.isUniqueEmail = function(userDto){

    logger.debug("enter isUniqueEmial with userDto.email: " + userDto.email);
    var deferred = Q.defer();
    var query = {};

    query.email = userDto.email;

    if(userDto.id){
       query._id = { $ne: new ObjectId(userDto.id)};
    }

    User.model.findOne(query).exec(function (err, existingUser) {

        if (err) {
            logger.debug(err);
            deferred.reject(err);
        }
        else {

            if (existingUser) {
                logger.debug('found another existing user with matching email');

                deferred.resolve(false);

            }
            else {
                logger.debug('email is unique');
                deferred.resolve(true);
            }

        }


    });

    return deferred.promise;
};
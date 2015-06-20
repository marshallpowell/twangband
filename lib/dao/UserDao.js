/**
 * User DAO
 */

var Q = require('q');
var keystone = require('keystone');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var User = User = keystone.list('User'); // keystone.list('User').model same as mongoose.model('User');
var authUtils = require(APP_LIB+'util/AuthUtils');

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
            deferred.resolve(existingUsers);
        }
    });

    return deferred.promise;
}

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
            deferred.resolve(existingUsers);
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
                    //TODO this should return a DTO object instead of a mongoose schema obj
                    deferred.resolve(existingUser);

                }
                else {
                    deferred.resolve(UserDao.createSocialUser(socialProfile));
                }

            }


    });

    logger.debug("going to return promise");
    return deferred.promise;


};

UserDao.createSocialUser = function(socialProfile){

    logger.debug('createSocialUser');

    var deferred = Q.defer();
    var email = authUtils.defaultEmailIfBlank(socialProfile.email, socialProfile.firstName, socialProfile.lastName);

    var defaultPassword = (Date.now() / 1000 | 0);
    var newUser = new User.model({
            'name' : {'first' : socialProfile.firstName, 'last' : socialProfile.lastName}, 'password' : defaultPassword, 'email' : email,
            'facebookId' : socialProfile.socialId });

    newUser.save();

    logger.debug("saved new user: " + JSON.stringify(newUser));

    deferred.resolve(newUser);

    return deferred.promise;


};
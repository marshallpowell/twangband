/**
 * User DAO
 */

var Q = require('q');
var keystone = require('keystone');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var User = User = keystone.list('User'); // keystone.list('User').model same as mongoose.model('User');
var authUtils = require(APP_LIB+'util/AuthUtils');

var UserDao = module.exports = {};


UserDao.findOrCreateSocialUser = function(socialProfile){

    logger.debug('looking for user with: ' + socialProfile.socialIdType + " " + socialProfile.socialId);

    var deferred = Q.defer();
    var query = {};

    query[socialProfile.socialIdType] = socialProfile.socialId;

    return User.model.findOne(query).exec(function (err, existingUser) {

            if (err) {
                logger.debug(err);
                deferred.reject(err);
            }
            else {

                if (existingUser) {
                    logger.debug('found existing user: ' + existingUser);
                    deferred.resolve(existingUser);
                }
                else {
                    deferred.resolve(UserDao.createSocialUser(socialProfile));
                }

            }

        });
};

UserDao.createSocialUser = function(socialProfile){

    logger.debug('createSocialUser');

    var deferred = Q.defer();
    var email = authUtils.defaultEmailIfBlank(socialProfile.email, socialProfile.firstName, socialProfile.lastName);

    var cohUser = new User.model({
            'name' : {'first' : socialProfile.first, 'last' : socialProfile.lastName}, 'password' : '1234', 'email' : email,
            'facebookId' : socialProfile.socialId });

    cohUser.save();

    logger.debug("saved new user: " + JSON.stringify(cohUser));

    deferred.resolve(cohUser);
    return cohUser;


};
/**
 * New node file
 */
var keystone = require('keystone'),
    passport = require('passport'),
    authUtils = require(APP_LIB + 'util/AuthUtils'),
    logger = require(APP_LIB + 'util/Logger').getLogger(__filename),
    UserDao = require(APP_LIB + 'dao/UserDao'),
    SocialProfile = require(APP_LIB + 'model/SocialProfile'),
    FacebookStrategy = require('passport-facebook').Strategy,
    http = require('http'),
    req = http.IncomingMessage.prototype,
    res = http.ServerResponse.prototype;
var winston = require('winston');


var handleError = function(err){

    console.log("error: " + err);
}

passport.use(new FacebookStrategy({
        clientID: '1558894697697443',
        clientSecret: '964ee6d698f152d81cc9e8dadaed50e3',
        callbackURL: "http://local.cluckoldhen.com:3000/auth/facebook/callback"
    },
    function (accessToken, refreshToken, profile, done) {

        logger.debug('first name: ' + profile._json.first_name + ' last name: ' + profile._json.last_name, "");

        var newUser = new SocialProfile();
        newUser.socialId = profile._json.id;
        newUser.firstName = profile._json.first_name;
        newUser.lastName = profile._json.last_name;
        newUser.email = profile._json.email;
        newUser.socialIdType='facebookId';

        UserDao.findOrCreateSocialUser(newUser).then(authUtils.doPassportSignin, handleError);







    }
));
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



var handleError = function(err){

    logger.debug("error: " + err);
};

var doPassportSignin = function(user) {

    logger.debug('create cookie and sign in for: ' + JSON.stringify(user));

    passport.req.session.regenerate(function() {

        passport.req.login(user, function(err){
            logger.debug("login called: " + err);
           // passport.res.redirect('/');
        });
        //passport.req.user = user;
        //passport.req.session.userId = user.id;
        //passport.res.locals.user = user;
        // var userToken = user.id + ':' + AuthUtils.hash(user.password);
        //passport.res.cookie('keystone.uid', userToken, { signed: true, httpOnly: true });

    });

};


passport.use(new FacebookStrategy({
        clientID: global.FB_CLIENTID,
        clientSecret: global.FB_CLIENTSECRET,
        callbackURL: global.FB_CALLBACKURL
    },
    function (accessToken, refreshToken, profile, done) {

        logger.debug('first name: ' + profile._json.first_name + ' last name: ' + profile._json.last_name, "");

        var newUser = new SocialProfile();
        newUser.socialId = profile._json.id;
        newUser.firstName = profile._json.first_name;
        newUser.lastName = profile._json.last_name;
        newUser.email = profile._json.email;
        newUser.socialIdType='facebookId';

        UserDao.findOrCreateSocialUser(newUser).then( function(user){done(null, user)}, handleError);

        //TODO instead or redirecting in authUtils you could pass this back to the router
        // done();
        //logger.debug("called done()");
       // passport.res.redirect('/');

    }
));
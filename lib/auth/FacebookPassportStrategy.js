/**
 * New node file
 */
var passport = require('passport'),
    authUtils = require(APP_LIB + 'util/AuthUtils'),
    logger = require(APP_LIB + 'util/Logger').getLogger(__filename),
    UserDao = require(APP_LIB + 'dao/UserDao'),
    SocialProfile = require(APP_LIB + 'model/SocialProfile'),
    FacebookStrategy = require('passport-facebook').Strategy,
    http = require('http'),
    https = require('https'),
    req = http.IncomingMessage.prototype,
    res = http.ServerResponse.prototype,
    Q = require('q'),
    path = require('path'),
    url = require('url');



var handleError = function(err){

    logger.debug("error: " + err);
};

var doPassportSignin = function(user) {

    logger.debug('create cookie and sign in for: ' + JSON.stringify(user));

    passport.req.session.regenerate(function() {

        passport.req.login(user, function(err){
            logger.debug("login called: " + err);
        });

    });

};

/**
 * Downloads the user's FB pic as their default profile pic
 * @param user
 */
var downloadUserImage = function(imgUrl, socialType, socialId){

    var options = url.parse(imgUrl);
    var extName = path.extname(options.pathname);
    var deferred = Q.defer();
    var protocol = (options.host === 'http')? http : https;

    protocol.get(options, function(res){
        res.on('data', function (img) {

            //TODO need to write a open shift hook to create this directory if it doesn't exist already
            var fs = require('fs');
            var profilePic = Date.now() + '-'+socialType+'-'+socialId+extName;
            fs.writeFile(process.env.UPLOADS_DIR + "users/profile/"+profilePic, img, function(err) {
                if(err) {
                    logger.debug("error saving social image: " + err);
                    deferred.resolve('undefined.jpg');
                }
                else{
                    logger.debug("successfully saved profilPic: " + profilePic);
                    deferred.resolve(profilePic);
                }

            });
        });

    });

    return deferred.promise;


};
passport.use(new FacebookStrategy({
        clientID: process.env.FB_CLIENTID,
        clientSecret: process.env.FB_CLIENTSECRET,
        callbackURL: process.env.FB_CALLBACKURL,
        profileFields: ['id', 'first_name', 'last_name', 'picture', 'email']
    },
    function (accessToken, refreshToken, profile, done) {

        //ex. profile._json: {"id":"10152587010110952","first_name":"Marshall","gender":"male","last_name":"Powell","link":"https://www.facebook.com/app_scoped_user_id/10152587010110952/","locale":"en_US","name":"Marshall Powell","timezone":-4,"updated_time":"2015-06-05T11:48:58+0000","verified":true}
        // ex. {"id":"10204418391206337","first_name":"Cluck","last_name":"Hen","picture":{"data":{"is_silhouette":false,"url":"https://scontent.xx.fbcdn.net/hprofile-xfl1/v/t1.0-1/p50x50/12799370_10205917227836316_1022039154722152190_n.jpg?oh=a72b95394f18d854e922b0f91ffb1ddb&oe=57972192"}},"email":"cluckoldhen@gmail.com"}

        logger.debug("json profile: " + JSON.stringify(profile._json));

        var newUser = new SocialProfile();
        newUser.socialId = profile._json.id;
        newUser.firstName = profile._json.first_name;
        newUser.lastName = profile._json.last_name;
        newUser.email = profile._json.email;
        newUser.socialIdType='facebookId';
        newUser.imgUrl = profile._json.picture.url;
        newUser.firstLogin=true;

        UserDao.findSocialUser(newUser).then( function(existingUser){
            //for some reason this debug statement kills the signin, making it time out and passport then tries to recall
            //facebook. It may be because the user object is not resolved yet... not sure. but beware of logging an object that is
            //the result of a resolved promise
            //log.bug("found or created user completed: " + JSON.stringify(user));

            if(existingUser){
                done(null, existingUser);
            }
            else{
                done(null, newUser);
            }


        }, handleError);


        return;

        downloadUserImage(profile._json.picture.data.url, newUser.socialIdType, newUser.socialId).then(function(profilePic){

            newUser.profilePic = profilePic;

            //Instead of just creating a new user here, we should redirect them to the profile form to complete, then have them submit the form to create their profile
            //existance of the facebook id should hide the password fields

            UserDao.findOrCreateSocialUser(newUser).then( function(user){
                //for some reason this debug statement kills the signin, making it time out and passport then tries to recall
                //facebook. It may be because the user object is not resolved yet... not sure. but beware of logging an object that is
                //the result of a resolved promise
                //log.bug("found or created user completed: " + JSON.stringify(user));

                done(null, user);

            }, handleError);
        }, handleError);


        //TODO instead or redirecting in authUtils you could pass this back to the router
        // done();
        //log.debug("called done()");
       // passport.res.redirect('/');

    }
));
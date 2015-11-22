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
var downloadUserImage = function(socialType, socialId){

    var deferred = Q.defer();
    var options = {
        host: 'graph.facebook.com',
        port: 80,
        path: '/' + socialId + '/picture?redirect=false'
    };

    http.get(options, function(res) {

        var body = '';

        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function () {

            //get image
            console.log("url data: " + body);

            var urlObj = url.parse(JSON.parse(body).data.url);
            var extName = path.extname(urlObj.pathname);

            options = {
                host: urlObj.hostname,
                path: urlObj.path
            };

            logger.debug("get image with: " + JSON.stringify(options) + " and ext: " + extName);

            var protocol = (urlObj.host === 'http')? http : https;

            protocol.get(options, function(res){
                res.on('data', function (img) {

                    //TODO need to write a open shift hook to create this directory if it doesn't exist already
                    var fs = require('fs');
                    var profilePic = Date.now() + '-'+socialType+'-'+socialId+extName;
                    fs.writeFile(global.UPLOADS_DIR + "users/profile/"+profilePic, img, function(err) {
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
        });

    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
    /*
     example FB pic: https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xfa1/v/t1.0-1/c170.50.620.620/s50x50/562942_10151010347610952_1441639629_n.jpg?oh=0325af843d2666014ad857b3eca68202&oe=55EBD1BC&__gda__=1446010530_3c8b917a9374a212823466beb24cc55b

     url: http://graph.facebook.com/[UID]/picture?redirect=false
     {
     "data": {
     "is_silhouette": false,
     "url": "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xfa1/v/t1.0-1/c170.50.620.620/s50x50/562942_10151010347610952_1441639629_n.jpg?oh=0325af843d2666014ad857b3eca68202&oe=55EBD1BC&__gda__=1446010530_3c8b917a9374a212823466beb24cc55b"
     }
     }

     */
    return deferred.promise;

};
passport.use(new FacebookStrategy({
        clientID: global.FB_CLIENTID,
        clientSecret: global.FB_CLIENTSECRET,
        callbackURL: global.FB_CALLBACKURL
    },
    function (accessToken, refreshToken, profile, done) {

        //ex. profile._json: {"id":"10152587010110952","first_name":"Marshall","gender":"male","last_name":"Powell","link":"https://www.facebook.com/app_scoped_user_id/10152587010110952/","locale":"en_US","name":"Marshall Powell","timezone":-4,"updated_time":"2015-06-05T11:48:58+0000","verified":true}

        logger.debug('first name: ' + profile._json.first_name + ' last name: ' + profile._json.last_name, "");

        logger.debug("json profile: " + JSON.stringify(profile._json));

        var newUser = new SocialProfile();
        newUser.socialId = profile._json.id;
        newUser.firstName = profile._json.first_name;
        newUser.lastName = profile._json.last_name;
        newUser.email = profile._json.email;
        newUser.socialIdType='facebookId';

        downloadUserImage('fb',newUser.socialId).then(function(profilePic){

            newUser.profilePic = profilePic;

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
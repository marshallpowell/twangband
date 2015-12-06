/**
 * Routing logic for controllers
 */
require(APP_LIB + 'auth/FacebookPassportStrategy');

var middleware = require('./middleware'),
    importRoutes = middleware.dispatchImporter(__dirname),
    authUtils = require(APP_LIB + 'util/AuthUtils'),
    passport = require('passport'),
    express = require('express'),
    fs = require('fs'),
    LocalStragey = require('passport-local').Strategy,
    userDao = require(APP_LIB + 'dao/UserDao'),
    multer  = require('multer'),
    uploads = multer({ dest: global.TEMPDIR});
log = require(APP_LIB + 'util/Logger').getLogger(__filename);
// Import Route Controllers
var routes = {
    views: importRoutes('./views'),
    services: importRoutes('./services')
};

var initPassport = function(req, res, next){
    passport.req = req;
    passport.res = res;
    next();
};

var redirectHome = function(req, res, next){

    if(req.user.firstLogin){
        res.redirect("/user/profile");
    }
    else{
        res.locals.user = req.user;
        log.debug("user in redirect home: " + req.user.firstName);
        res.redirect("/");
    }

};

// Setup Route Bindings
exports = module.exports = function(app) {

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(middleware.initLocals);
    app.use(middleware.flashMessages);


    app.use("/uploads", express.static(UPLOADS_DIR));

    app.use(function(req, res, next) {
        //this puts the user obj in the locals scope for the tempates
        res.locals.user = req.user;
        next();
    });

    // Views
    app.get('/', routes.views.index);

    app.all('/login', middleware.requireHTTPS, routes.views.signin);
    app.all('/logout', [authUtils.signOut, routes.views.signin]);
    app.all('/forgot', routes.views.forgot);
    app.all('/reset/', routes.views.reset);
    app.get('/user/profile/', middleware.requireHTTPS, routes.views.userProfile);
    app.post('/user/save', uploads, routes.services.saveProfile);

    app.get('/auth/facebook', passport.authenticate('facebook'));
    app.get('/auth/facebook/callback', [initPassport, passport.authenticate('facebook'), redirectHome]);
    app.post('/auth/local', passport.authenticate('local', {successRedirect : '/', failureRedirect : '/login', failureFlash: true}));

    app.all('/songMixer', middleware.requireHTTPS, routes.views.songMixer);
    app.post('/song/save', uploads, routes.services.saveSong);
    app.post('/song/updateCollaborators', routes.services.updateCollaborators);
    app.all('/song/user/', routes.views.userSongs);

    app.get('/listData', routes.services.listData);
    app.all('/search/', routes.services.search);


    //404's
    app.use(function(req, res, next){

        //serve a default image if the user has no profile image
        if((/^\/uploads\/users\/profile/).test(req.path)){
            console.log("no profile image found");
            var img = fs.readFileSync(APP_ROOT + '/public/img/defaultProfile.jpg');
            res.writeHead(200, {'Content-Type': 'image/jpg' });
            res.end(img, 'binary');
            return;

        }

        res.status(404);

        // respond with html page
        if (req.accepts('html')) {
            res.render('404', { url: req.url });
            return;
        }

        // respond with json
        if (req.accepts('json')) {
            res.send({ error: 'Not found' });
            return;
        }

        // default to plain-text. send()
        res.type('txt').send('Not found');
    });


    passport.serializeUser(function(user, done) {
        log.debug("serializeUser: " + JSON.stringify(user));
        done(null, user);
    });

    passport.deserializeUser(function(user, done) {
        log.debug("deserializeUser");

        done(null, user);
    });

    passport.use('local',new LocalStragey({passReqToCallback : true},function(req, username, password, done)
    {

        userDao.authenticate(username, password).then(function(userDto){
            return done(null, userDto);
        }, function(err){
            log.debug('returning err: ' + err);

            return done(null, false, req.flash('error', err));
        });
    }));

};

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

    log.debug('enter redirectHome');

    if(req.newUser){
        next();
    }
    else{
        res.locals.user = req.user;
        log.debug('existing user, redirect to homepage.');
        res.redirect("/");
        return;
    }

};

var processFacebookLogin = function(req, res, next){

    passport.authenticate('facebook', function(err, user, info) {

        log.debug('facebook has authenticated user: ' + JSON.stringify(user));

        if (err) { return next(err); }

        if (!user) { return res.redirect('/login'); }

        if(user.firstLogin){

            log.debug('new social user, needs to complete profile');
            req.newUser = user;
            next();
        }
        else{
            log.debug('existing social user, redirect to homepage.');
            req.user = user;
            res.locals.user = user;


            req.logIn(user, function(err) {
                if (err) { return next(err); }
                return res.redirect("/");
            });

        }

    })(req, res, next);

};



// Setup Route Bindings
exports = module.exports = function(app) {

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(middleware.initLocals);
    app.use(middleware.flashMessages);

    app.use("/uploads", express.static(process.env.UPLOADS_DIR));

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

    app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));
    app.get('/auth/facebook/callback', [initPassport, processFacebookLogin, routes.views.userProfile]);
    app.post('/auth/local', passport.authenticate('local', {successRedirect : '/', failureRedirect : '/login', failureFlash: true}));

    app.all('/songMixer', middleware.requireHTTPS, routes.views.songMixer);
    app.post('/song/save', uploads, routes.services.saveSong);
    app.post('/song/updateCollaborators', routes.services.updateCollaborators);
    app.all('/music/', routes.views.userSongs);

    app.get('/listData', routes.services.listData);
    app.all('/search/', routes.services.search);


    //404's
    app.use(function(req, res, next){

        //serve a default image if the user has no profile image
        if((/^\/uploads\/users\/profile/).test(req.path)){

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
        done(null, user);
    });

    passport.deserializeUser(function(user, done) {
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

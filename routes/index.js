/**
 * Routing logic for controllers
 */

var keystone = require('keystone'),
    middleware = require('./middleware'),
    importRoutes = keystone.importer(__dirname),
    authUtils = require(APP_LIB + 'util/AuthUtils'),
    passport = require('passport'),
    express = require('express'),
    expressSession = require('express-session'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    LocalStragey = require('passport-local').Strategy,
    userDao = require(APP_LIB + 'dao/UserDao'),
    flash = require('express-flash'),
    multer  = require('multer');

keystone.import('models');

require(APP_LIB + 'auth/FacebookPassportStrategy');

var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);

// Common Middleware - this doesn't seem to get the req.user
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Import Route Controllers
var routes = {
    views: importRoutes('./views'),
    services: importRoutes('./services')
};

var locals;
var initPassport = function(req, res, next){
    locals = res.locals;
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
        logger.debug("user in redirect home: " + req.user.firstName);
        res.redirect("/");
    }

}

// Setup Route Bindings
exports = module.exports = function(app) {
    app.use(express.static('public'));
    app.use(cookieParser());
    app.use(flash());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());

    app.use(expressSession({
        secret: 'keyboard cat',
        saveUninitialized: true,
        resave: true,
        cookie: { secure: false }
    }));

    //cookie: { secure: false } set to true above for SSL

    app.use(passport.initialize());
    app.use(passport.session());

    var uploads = multer({ dest: '/tmp/'});


    var userProfileUploads = multer({ dest: '/tmp/' });

    app.use("/uploads", express.static(UPLOADS_DIR));

    app.use(function(req, res, next) {
        //this puts the user obj in the locals scope for the tempates
        res.locals.user = req.user;
        next();
    });


    // Views
    app.get('/', routes.views.index);
    app.get('/blog/:category?', routes.views.blog);
    app.get('/blog/post/:post', routes.views.post);
    app.get('/gallery', routes.views.gallery);
    app.all('/contact', routes.views.contact);

    app.all('/login', routes.views.signinCoh);
    app.all('/logout', [authUtils.signOut, routes.views.signinCoh]);
    app.all('/forgot', routes.views.forgot);
    app.all('/reset/', routes.views.reset);

    app.get('/auth/facebook', passport.authenticate('facebook'));
    app.get('/auth/facebook/callback', [initPassport, passport.authenticate('facebook'), redirectHome]);

    app.post('/auth/local', passport.authenticate('local', {successRedirect : '/', failureRedirect : '/login'}));


    app.all('/songMixer', routes.views.songMixer);
    app.all('/mixer', routes.views.mixer);
    app.post('/song/save', uploads, routes.services.saveSong);
    app.post('/song/updateCollaborators', routes.services.updateCollaborators);
   // app.all('/song/show',routes.services.getSong);
    app.all('/song/user/', routes.views.userSongs);
   // app.post('/song/remove',routes.services.removeSong);
    app.all('/search/', routes.services.search);

    app.get('/user/profile/', uploads, routes.views.userProfile);

    app.post('/user/save', routes.services.saveProfile);

    app.get('/listData', routes.services.listData);



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
        logger.debug("serializeUser: " + JSON.stringify(user));
        done(null, user);
    });

    passport.deserializeUser(function(user, done) {
        logger.debug("deserializeUser");

        done(null, user);
    });

    passport.use(new LocalStragey(function(username, password, done){

        userDao.authenticate(username, password).then(function(userDto){
            return done(null, userDto);
        }, function(err){
            return done(err);
        });
    }));





};

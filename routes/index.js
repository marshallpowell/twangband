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
    multer  = require('multer');

keystone.import('models');

require(APP_LIB + 'auth/FacebookPassportStrategy');

var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);



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
    res.redirect("/");
}

// Setup Route Bindings
exports = module.exports = function(app) {

    app.use(express.static('public'));
    app.use(cookieParser());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());

    app.use(expressSession({
        secret: 'keyboard cat',

        cookie: { secure: false }
    }))

    //cookie: { secure: false } set to true above for SSL

    app.use(passport.initialize());
    app.use(passport.session());

    var uploads = multer({ dest: './uploads/'});

    app.use("/uploads", express.static(UPLOADS_DIR));

    // Views
    app.get('/', routes.views.index);
    app.get('/blog/:category?', routes.views.blog);
    app.get('/blog/post/:post', routes.views.post);
    app.get('/gallery', routes.views.gallery);
    app.all('/contact', routes.views.contact);
    app.all('/login', routes.views.signinCoh);
    app.all('/logout', [authUtils.signOut, routes.views.signinCoh]);

    app.get('/auth/facebook', passport.authenticate('facebook'));
    app.get('/auth/facebook/callback', [initPassport, passport.authenticate('facebook'), redirectHome]);

    app.all('/songMixer', routes.views.songMixer);
    app.all('/mixer', routes.views.mixer);
    app.post('/song/save', uploads, routes.services.saveSong);
   // app.all('/song/show',routes.services.getSong);
    app.all('/song/user/', routes.views.userSongs);
   // app.post('/song/remove',routes.services.removeSong);


    passport.serializeUser(function(user, done) {
        logger.debug("serializeUser: " + JSON.stringify(user));
        done(null, user);
    });

    passport.deserializeUser(function(user, done) {
        logger.debug("deserializeUser");
        done(null, user);
    });

    // NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
    // app.get('/protected', middleware.requireUser, routes.views.protected);

    //MT5 code below//
    var fs = require("fs");
    var TRACKS_PATH = '/var/www/coh/cluckoldhen/public/multitrack/';
    // routing
    app.get('/track', function (req, res) {
        console.log("in track");
        function sendTracks(trackList) {
            if (!trackList)
                return res.send(404, 'No track found');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(trackList));
            res.end();
        }

        getTracks(sendTracks);
        //
    });

// routing
    app.get('/track/:id', function (req, res) {
        var id = req.params.id;

        function sendTrack(track) {
            if (!track)
                return res.send(404, 'Track not found with id "' + id + '"');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(track));
            res.end();
        }

        getTrack(id, sendTrack);

    });



    function getTracks(callback) {
        getFiles(TRACKS_PATH, callback);
    }


    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    function isASoundFile(fileName) {
        if(endsWith(fileName, ".mp3")) return true;
        if(endsWith(fileName, ".ogg")) return true;
        if(endsWith(fileName, ".wav")) return true;
        return false;
    }

    function getTrack(id, callback) {
        //console.log("id = " + id);
        if(!id) return;

        getFiles(TRACKS_PATH + id, function(fileNames) {
            if(! fileNames) {
                callback(null);
                return;
            }

            var track = {
                id: id,
                instruments: []
            };
            fileNames.sort();
            for (var i = 0; i < fileNames.length; i++) {
                // filter files that are not sound files
                if(!isASoundFile(fileNames[i])) continue;

                var instrument = fileNames[i].match(/(.*)\.[^.]+$/, '')[1];
                track.instruments.push({
                    name: instrument,
                    sound: fileNames[i]
                });
            }
            callback(track);
        })
    }

    function getFiles(dirName, callback) {
        fs.readdir(dirName, function(error, directoryObject) {
            if(directoryObject !== undefined) {
                directoryObject.sort();
            }
            callback(directoryObject);
        });
    }
};

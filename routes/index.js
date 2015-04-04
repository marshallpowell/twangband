/**
 * This file is where you define your application routes and controllers.
 *
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre('routes') and pre('render') events.
 *
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 *
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 *
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 *
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */

var keystone = require('keystone'),
    middleware = require('./middleware'),
    importRoutes = keystone.importer(__dirname),
    authUtils = require(APP_LIB + 'util/AuthUtils'),
    passport = require('passport');
keystone.import('models');

require(APP_LIB + 'auth/FacebookPassportStrategy');

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);



// Import Route Controllers
var routes = {
    views: importRoutes('./views')
};

var initPassport = function(req, res, next){

    passport.req = req;
    passport.res = res;
    next();
};

// Setup Route Bindings
exports = module.exports = function(app) {

    app.configure(function() {
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(app.router);
    });

    // Views
    app.get('/', routes.views.index);
    app.get('/blog/:category?', routes.views.blog);
    app.get('/blog/post/:post', routes.views.post);
    app.get('/gallery', routes.views.gallery);
    app.all('/contact', routes.views.contact);
    app.all('/login', routes.views.signinCoh);
    app.all('/logout', [authUtils.signOut, routes.views.signinCoh]);

    app.get('/auth/facebook', passport.authenticate('facebook'));
    app.get('/auth/facebook/callback', [initPassport, passport.authenticate('facebook')]);

    app.all('/songMixer', routes.views.songMixer);
    app.all('/mixer', routes.views.mixer);

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

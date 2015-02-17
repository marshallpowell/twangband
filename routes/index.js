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
	importRoutes = keystone.importer(__dirname);

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

var passport = require('passport')
, FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
  clientID: '1558894697697443',
  clientSecret: '964ee6d698f152d81cc9e8dadaed50e3',
  callbackURL: "http://local.cluckoldhen.com:3000/auth/facebook/callback"
},
function(accessToken, refreshToken, profile, done) {
	
	console.log('first name: ' + profile._json.first_name + ' last name: ' + profile._json.last_name);
	
	var User = new keystone.List('User');


	console.log('user list: ' + User);
	var newuser = User.model({});
	/*
	'name' : {'first_name' : profile._json.first_name, 'last_name' : profile._json.last_name},
	'fbId' : profile._json.id
	});
	
	console.log('first name: ' + profile._json.first_name + ' last name: ' + profile._json.last_name);
	
	newuser.save(function(err) {
	    console.log('error saving user: ' + err);
	});
	
	/*
	var url = 'mongodb://localhost:27017/cluckoldhen';
	MongoClient.connect(url, function(err, db) {
	
		var collection = db.collection('users');
		console.log('inserting user: ' + user.email)
		collection.insert(user, function(err, result) {

			console.log('error: ' + err);

		});
		
	});
	
  User.findOrCreate(res, function(err, user) {
    if (err) { return done(err); }
    done(null, user);
  });
  
  *  _json: 
   { id: '10152587010110952',
     first_name: 'Marshall',
     gender: 'male',
     last_name: 'Powell',
     link: 'https://www.facebook.com/app_scoped_user_id/10152587010110952/',
     locale: 'en_US',
     name: 'Marshall Powell',
     timezone: -5,
     updated_time: '2013-01-13T03:25:51+0000',
     verified: true } }

  *
  */
}
));

// Import Route Controllers
var routes = {
	views: importRoutes('./views')
};

// Setup Route Bindings
exports = module.exports = function(app) {
	
	// Views
	app.get('/', routes.views.index);
	app.get('/blog/:category?', routes.views.blog);
	app.get('/blog/post/:post', routes.views.post);
	app.get('/gallery', routes.views.gallery);
	app.all('/contact', routes.views.contact);
	app.all('/signin', routes.views.signin);
	app.all('/signinCoh', routes.views.signinCoh);
	//app.all('/facebook', routes.views.facebook);
	
	app.get('/auth/facebook', passport.authenticate('facebook'));
	app.get('/auth/facebook/callback', 
			  passport.authenticate('facebook', { successRedirect: '/',
			                                      failureRedirect: '/signinCoh?auth=fail' }));
	
	// NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
	// app.get('/protected', middleware.requireUser, routes.views.protected);
	
};

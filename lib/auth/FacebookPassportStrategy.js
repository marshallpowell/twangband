/**
 * New node file
 */
var keystone = require('keystone'),
  passport = require('passport'),
  authUtils = require(APP_LIB+'util/AuthUtils'),
  mongoose = require('mongoose'),
  UserDao = require(APP_LIB+'dao/UserDao'),
  SocialProfile = require(APP_LIB+'model/SocialProfile'),
 FacebookStrategy = require('passport-facebook').Strategy;



var http = require('http')
, req = http.IncomingMessage.prototype,
res = http.ServerResponse.prototype;





passport.use(new FacebookStrategy({
  clientID: '1558894697697443',
  clientSecret: '964ee6d698f152d81cc9e8dadaed50e3',
  callbackURL: "http://local.cluckoldhen.com:3000/auth/facebook/callback"
},
function(accessToken, refreshToken, profile, done) {
	
	console.log('first name: ' + profile._json.first_name + ' last name: ' + profile._json.last_name);
	
	var newUser = new SocialProfile();
	newUser.socialId = profile._json.id;
	newUser.firstName = profile._json.first_name;
	newUser.lastName = profile._json.last_name;
	newUser.email = profile._json.email;
	
	cohUser = UserDao.createSocialUser(newUser);
	
	req.user = cohUser;
	
	passport.res.redirect('/');

}
));
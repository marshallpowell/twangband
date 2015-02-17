var keystone = require('keystone');
	session = keystone.session;

exports = module.exports = function(req, res) {
	var view = new keystone.View(req, res),
	locals = res.locals;
	
	var passport = require('passport')
	  , FacebookStrategy = require('passport-facebook').Strategy;

	passport.use(new FacebookStrategy({
	    clientID: '1558894697697443',
	    clientSecret: '964ee6d698f152d81cc9e8dadaed50e3',
	    callbackURL: "http://local.cluckoldhen.com:3000/facebook?fb_callback=1"
	  },
	  function(accessToken, refreshToken, profile, done) {
	    User.findOrCreate(res, function(err, user) {
	      if (err) { return done(err); }
	      done(null, user);
	    });
	  }
	));
	
	if(req.query.fb_callback){
			console.log('facebook callback');
		  passport.authenticate('facebook', { successRedirect: '/',
            failureRedirect: '/signinCoh?auth=failed' });
	}
	else{
		console.log('facebook login');
		passport.authenticate('facebook');
	}


};


var keystone = require('keystone');
	session = keystone.session;

exports = module.exports = function(req, res) {
	var view = new keystone.View(req, res),
	locals = res.locals;
	var renderView = function() {

        if(req.session.userId){
            console.log("user id: " + req.session.userId);
        }
        else{
            console.log("user id was null");
        }
		locals.csrf_token_value= keystone.security.csrf.getToken(req, res);
		locals.csrf_token_key= keystone.security.csrf.TOKEN_KEY;
		locals.csrf_query= '&' + keystone.security.csrf.TOKEN_KEY + '=' + keystone.security.csrf.getToken(req, res);
		locals.layout = 'auth';
		locals.flash = req.flash;
		
		console.log(locals.flash);
		view.render('signinCoh', locals);
	};

	// If a form was submitted, process the login attempt
	if (req.method === 'POST') {

		if (!keystone.security.csrf.validate(req)) {
			console.log("here i am in csrf");
			req.flash('error', 'There was an error with your request, please try again.');
			return renderView();
		}
		
		if (!req.body.email || !req.body.password) {
			console.log('here i am ');
			req.flash('error', 'Please enter your email address and password.');
			
			return renderView();
		}

		var onSuccess = function(user) {

			if (req.query.from && req.query.from.match(/^(?!http|\/\/|javascript).+/)) {
				res.redirect(req.query.from);
			} else if ('string' === typeof keystone.get('signinCoh redirect')) {
				res.redirect(keystone.get('signin redirect'));
			} else if ('function' === typeof keystone.get('signinCoh redirect')) {
				keystone.get('signinCoh redirect')(user, req, res);
			} else {
				res.redirect('/keystone');
			}

		};

		var onFail = function() {
			
			req.flash('error', 'Sorry, that email and password combo are not valid.');
			
			renderView();
		};

		session.signin(req.body, req, res, onSuccess, onFail);

	}

	else if(req.query.signout){
		
		session.signout(req, res, function(){
			console.log('signing out....');
		});
		
		req.flash('error', 'You have been signed out');
		
		res.redirect('login');
	}
	else {
		renderView();
	}

};

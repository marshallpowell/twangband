exports = module.exports = function(req, res) {


	// locals.section is used to set the currently selected
	// item in the header navigation.
	res.locals.section = 'home';
	
	// Render the view
	res.render('index');
	
};

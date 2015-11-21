
exports = module.exports = function(req, res) {
	res.locals.layout = 'auth';
	res.render('signinCoh');
};

var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var userDao = require(APP_LIB + 'dao/UserDao');

exports = module.exports = function(req, res) {

    logger.debug("enter userSongs with user id: " + JSON.stringify(req.user));

        locals = res.locals;

    // locals.section is used to set the currently selected
    // item in the header navigation.
    locals.section = 'songs';

    //if not logged in don't show errors

    if(!req.user){
        res.render('userProfile');
        return;
    }

//55d0e7ba362d156128264e70
    //req.user.id
    userDao.findUserById(req.user.id).then(
        function(user){
            logger.debug("got songs: " + JSON.stringify(user));
            locals['user'] = user;
            // Render the view
            res.render('userProfile');
        },
        function(err){
            logger.debug("error retrieving songs: " + err);
            // Render the view
            res.render('userProfile');
        });

};

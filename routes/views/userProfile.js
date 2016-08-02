var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var userDao = require(APP_LIB + 'dao/UserDao');
var AppConstants = require(global.PUBLIC_APP_LIB+'util/AppConstants.js');

exports = module.exports = function(req, res) {

    log.debug("enter userProfile with user id: " + JSON.stringify(req.user));

        locals = res.locals;

    // locals.section is used to set the currently selected
    // item in the header navigation.
    locals.section = 'profile';

    //if not logged in don't show errors

    if(req.newUser){
        log.debug("new user being created: " + JSON.stringify(req.newUser));
        locals['user'] = req.newUser;
        res.render('userProfile');
        return;
    }
    else if(!req.user){
        res.render('userProfile');
        return;
    }
    else{

        userDao.findUserById(req.user.id).then(
            function(user){
                log.debug("found user:  " + JSON.stringify(user));
                locals['user'] = user;

                if(user.loginType != AppConstants.LOGIN_TYPES.TB){
                    locals['socialUser'] = true;
                }
                // Render the view
                res.render('userProfile');
            },
            function(err){
                log.debug("error retrieving songs: " + err);
                // Render the view
                res.render('userProfile');
            });
    }






};

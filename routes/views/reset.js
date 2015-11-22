var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var userDao = require(APP_LIB + 'dao/UserDao');


exports = module.exports = function(req, res) {

    res.locals.forgotPassword = true;

    if(req.method === 'GET' && req.query.token){

        logger.debug("looking up user with token: " + req.query.token);

        userDao.getUserByPasswordRestToken(req.query.token).then(function(user){

            req.session.uid = user.id;

            res.render('reset');

        },function(err){
            logger.debug("error finding user with token: " + err);
            req.flash('error', err);
            res.render('reset');

        });
    }

    else if(req.method === 'POST'){

        if(req.body.currentPassword && req.user){

            req.flash('error', 'Need to implement');
            //res.flash('success', 'Password reset was successful');
            res.render('reset');
        }
        else if(req.session.uid){

            logger.debug("****going to update password for user ID: " + req.session.uid);

            userDao.updateUserPassword(req.session.uid, req.body.newPassword).then(function(user){
                req.flash('success', 'Password reset was successful.');
                res.redirect('/login');
            },function(err){

            });

        }
        else{
            req.flash('error', 'There was an error processing your request');
            res.render('reset');
        }



    }

};

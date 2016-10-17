var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var userDao = require(APP_LIB + 'dao/UserDao');
var userValidation = require(global.PUBLIC_APP_LIB + 'validation/UserValidation.js');


exports = module.exports = function(req, res) {

    var updatePassword = function(userId, password){

        userDao.updateUserPassword(userId, password).then(function(user){


            if(req.user && user){
                req.flash('success', 'Password reset was successful.');
                res.render('reset');
            }
            else if(user){
                req.flash('success', 'Password reset was successful. You will now be redirected to login');
                res.locals.redirectToLogin = true;
                res.render('reset');
            }
            else{
                log.error('password could not be updated for userId: ' + userId);
                req.flash('error', 'Sorry, there was an error processing your request');
                res.render('reset');
            }


        },function(err){
            log.error('error updating password: ' + err);
            req.flash('error', 'error updating password: ' + err);
            res.render('reset');
        });
    };


    //SHOW FORM OPTIONS
    if(req.method === 'GET'){

        if(req.query.token) {

            log.debug("looking up user with token: " + req.query.token);

            userDao.getUserByPasswordRestToken(req.query.token).then(function (user) {

                req.session.uid = user.id;

                res.render('reset');

            }, function (err) {
                log.debug("error finding user with token: " + err);
                req.flash('error', err);
                res.render('reset');

            });

        }
        else if(req.user){
            log.debug("authenticated user wants to update their password");
            res.locals.updatePassword = true;
            res.render('reset');
        }
        else{
            req.flash('error', 'You must login before you can reset your password, or you must initiate a forgot password request.');
            res.locals.redirectToLogin = true;
            res.render('reset');
        }
    }
    //Process form submissions
    else if(req.method === 'POST'){

        if(req.user){
            res.locals.updatePassword = true;
        }

        //first make sure new passwords are valid
        var errors = userValidation.validatePassword(req.body.newPassword);

        if(req.body.newPassword != req.body.confirmPassword){
            errors.push('Your passwords did not match');
        }

        if(errors.length){
            log.debug('errors in password validation');
            req.flash('error', errors);
            for(var i = 0; i < errors.length; i++){
              //  req.flash('error', errors[i]);
            }
            res.render('reset');
            return;
        }

        //logged in user is updating password
        if(req.body.currentPassword && req.user){

            log.debug('attempt to validate current password, and update to new password');

            userDao.authenticate(req.user.email, req.body.currentPassword).then(function(userDto){
                log.debug('auth succeeded, updating password...');
                updatePassword(req.user.id, req.body.newPassword);

            },function(err){
                log.debug('error: ' + err);
                req.flash('error', err);
                res.render('reset');
            });

        }
        //user reseting password based on email token request
        else if(req.session.uid){

            log.debug("updating password for a forgot request with session id: " + req.session.uid);
            updatePassword(req.session.uid, req.body.newPassword);
        }
        else{
            log.debug('invalid params to update password.');
            req.flash('error', 'There was an error processing your request');
            res.render('reset');
        }

    }
    //Redirect to homepage
    else{
        res.redirect('/');
    }

};



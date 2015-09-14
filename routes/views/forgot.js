var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var userDao = require(APP_LIB + 'dao/UserDao');


exports = module.exports = function(req, res) {


    if(req.method === 'POST' && req.body.email){
        logger.debug("looking up user with email: " + req.body.email);

        userDao.setPasswordResetKey(req.body.email).then(function(user){

            var nodemailer = require('nodemailer');
            var transporter = nodemailer.createTransport({
                service : 'gmail',
                auth : {
                    user : 'musicilo.info@gmail.com',
                    pass : 'r0under@gm'
                }
            });
            transporter.sendMail({
                from: 'musicilo.info@gmail.com',
                to: 'marshallpowell@gmail.com',
                subject: 'reset password request',
                text: 'Copy this URL into your browser to reset your password: ' + global.BASE_URL + '/reset?token=' + user.passwordResetToken
            });

            req.flash('success','We have sent you a reset URL to your email address');

            res.render('forgot');

        }, function(err){
            logger.debug('error sending email: ' + err);
            req.flash('error','Sorry, we could not find any user with that address.');

            res.render('forgot');
        });

    }
    else{
        res.render('forgot');
    }




};

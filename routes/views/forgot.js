var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var userDao = require(APP_LIB + 'dao/UserDao');


exports = module.exports = function(req, res) {


    if(req.method === 'POST' && req.body.email){
        logger.debug("looking up user with email: " + req.body.email);

        userDao.setPasswordResetKey(req.body.email).then(function(user){

            var nodemailer = require('nodemailer');
            var xoauth2 = require('xoauth2');
            /*
            var transporter = nodemailer.createTransport({
                service : 'gmail',
                auth : {
                    user : 'musicilo.info@gmail.com',
                    pass : 'r0under@gm'
                }
            });


             var transporter = nodemailer.createTransport("SMTP", {
             service: "Gmail",
             auth: {
             XOAuth2: {
             user: "marshall@twangband.com", // Your gmail address. Not @developer.gserviceaccount.com
             clientId: "9937874421683-3s15c2fl022dmhn8lnfnoi2mjmet183o.apps.googleusercontent.com",
             clientSecret: "OGlVAD8sZO0ZBARUGT-7aAX3",
             refreshToken: "1/Mh6GiQBhWvemtOuWbh_VUZDfV0anbpbN-6uL_letgh8"
             }
             }
             });
            */

            //TODO extract this to its own service, put variables into secrets ENV vars, change this to a mail service like sendGrid or mailGun
            //so that you don't have to use marshall@twangband.com as the reply-to (alt, create another account for do-not-reply)
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    xoauth2: xoauth2.createXOAuth2Generator({
                        user: 'do-not-reply@twangband.com',
                        clientId: '937874421683-3s15c2fl022dmhn8lnfnoi2mjmet183o.apps.googleusercontent.com',
                        clientSecret: 'OGlVAD8sZO0ZBARUGT-7aAX3',
                        refreshToken: '1/Mh6GiQBhWvemtOuWbh_VUZDfV0anbpbN-6uL_letgh8'
                       // accessToken: '{cached access token}'
                    })
                }
            });



            transporter.sendMail({
                from: 'do-not-reply@twangband.com',
                to: req.body.email,
                subject: 'reset password request',
                text: 'Copy this URL into your browser to reset your password: ' + global.BASE_URL + '/reset?token=' + user.passwordResetToken
            }, function(err){
                logger.error('There was an error sending out your email: ' + err);

                //req.flash('error','Sorry, there was an error sending to your email. Please try back later');
                //res.render('forgot');
                return;

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

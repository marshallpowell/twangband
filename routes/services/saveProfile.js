var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var userDao = require(APP_LIB + 'dao/UserDao');
var userValidation = require(global.PUBLIC_APP_LIB+'validation/UserValidation.js');

var mv = require('mv');
var path = require('path');

exports = module.exports = function(req, res) {

    log.debug("enter saveProfile with user: " + req.body.user);

    //add new track data into the song
    var profilePic = null;
    for (var key in req.files) {
        log.debug("uploaded file is: " + req.files[key].name);

        profilePic = req.files[key].name;
    }

    var data = {};
    data.errors = [];

    if(!req.body.user){
       data.errors.push("There was an error processing your submission");
        res.json(data);
    }
    var userDto = JSON.parse(req.body.user);
    userDto.profilePic = Date.now()+ '-'+profilePic;


    if(req.user){
        log.debug("update existing user");
        //update existing user

        //email must be unique

        //if social user

        //else if not social user ... more validation?
    }
    //create user
    else{

        log.debug("create new user");

        //basic validation
        data.errors = userValidation.validateUser(userDto);

        if(data.errors.length){
            res.json(data);
        }
        //ensure email is unique
        userDao.isUniqueEmail(userDto).then(function(isUnique){

            if(isUnique){
               log.debug('email is good, create user for: ' + JSON.stringify(userDto));
                userDao.createUser(userDto).then(function(newuserDto){

                    log.debug("created user now check for profile pic");

                    if(profilePic != null){
                        log.debug("image uploaded : " + profilePic);

                        mv('/tmp/'+profilePic, global.UPLOADS_DIR+'users/profile/'+newuserDto.profilePic, function(err) {
                            if(err){
                                log.debug('error uploading file: ' + err);
                            }

                        });

                    }
                    else{
                        log.debug("no image uploaded");
                    }

                    data.user = newuserDto;
                    res.json(data);

                }, function(err){
                    log.debug("error saving new user: " + err);
                    data.errors.push("There was an error creating your profile, please try back later");

                    res.json(data);
                })

            }
            else{
                data.errors.push('That email already exists within our system. Please use a different one');
                res.json(data);
            }
        });


    }
}

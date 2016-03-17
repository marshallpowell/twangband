var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var userDao = require(APP_LIB + 'dao/UserDao');
var userValidation = require(global.PUBLIC_APP_LIB+'validation/UserValidation.js');
var Q = require('q');
var mv = require('mv');
var path = require('path');

var uploadPic = function(profilePic, userDto){

    log.debug("enter uploadPic");

    if (profilePic != null) {

        log.debug("image uploaded : " + profilePic);

        mv(global.TEMPDIR + profilePic, process.env.UPLOADS_DIR + 'users/profile/' + userDto.profilePic, function (err) {
            if (err) {
                log.debug('error uploading file: ' + err);
            }
        });
    }
    else {
        log.debug("no image uploaded");
    }
};

var createUser = function(userDto, profilePic){

    var deferred = Q.defer();
    var data = {};
    data.errors = [];

    userDao.createUser(userDto).then(function (userDto) {

        uploadPic(profilePic, userDto);
        data.user = userDto;
        deferred.resolve(data);

    }, function (err) {
        log.error("error saving new user: " + err);
        data.errors.push("There was an error creating your profile, please try back later");
        deferred.resolve(data);

    });

    return deferred.promise;
};


var createSocialUser = function(userDto, profilePic){

    var deferred = Q.defer();
    var data = {};
    data.errors = [];

    userDao.createSocialUser(userDto).then(function (userDto) {

        uploadPic(profilePic, userDto);
        data.user = userDto;

        deferred.resolve(data);

    }, function (err) {
        log.error("error saving new user: " + err);
        data.errors.push("There was an error creating your profile, please try back later");
        deferred.resolve(data);

    });

    return deferred.promise;
};

exports = module.exports = function(req, res) {

    log.debug("enter saveProfile with user: " + req.body.user);

    var data = {};
    data.errors = [];

    if(!req.body.user){
       data.errors.push("There was an error processing your submission");
        res.json(data);
    }

    var userDto = JSON.parse(req.body.user);

    data.errors = userValidation.validateUser(userDto);

    if(data.errors.length){
        res.json(data);
        return;
    }


    var profilePic = null;
    for (var key in req.files) {
        log.debug("uploaded file is: " + req.files[key].name);
        profilePic = req.files[key].name;
        userDto.profilePic = Date.now()+ '-'+profilePic;
    }



    if(req.user){
        log.debug("update existing user");

        userDao.isUniqueEmail(userDto).then(function (isUnique) {

            if (isUnique) {
                logger.debug("email is unique");

                userDao.updateProfile(userDto).then(function(updatedUser){
                    uploadPic(profilePic, userDto);
                    data.user = updatedUser;
                    res.json(data);
                });

            }
            else{
                logger.debug("email is NOT unique");
                data.errors.push("The email address " + userDto.email + " is already being used by another user");
                res.json(data);
            }


        });

    }
    //create user
    else {

        log.debug("create new user");

        //ensure email is unique
        userDao.isUniqueEmail(userDto).then(function (isUnique) {

            if (isUnique) {
                log.debug('email is good, create user for: ' + JSON.stringify(userDto));

                if(userDto.socialId){
                    createSocialUser(userDto).then(function(data){
                        log.debug('returning user data');
                        res.json(data);
                    });
                }
                else{
                    createUser(userDto).then(function(data){
                        res.json(data);
                    });
                }


            }
            else {
                data.errors.push('That email already exists within our system. Please use a different one');
                res.json(data);
            }
        });

    }
};

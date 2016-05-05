var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var userDao = require(APP_LIB + 'dao/UserDao');
var userValidation = require(global.PUBLIC_APP_LIB + 'validation/UserValidation.js');
var tagValidation = require(global.PUBLIC_APP_LIB + 'validation/TagValidation.js');
var Q = require('q');
var mv = require('mv');
var path = require('path');
var sharp = require('sharp');

var errorHandler = function (err) {

};

var uploadPic = function (profilePic, userDto) {

    log.debug("enter uploadPic");

    var deferred = Q.defer();

    if (profilePic != null) {

        log.debug("image uploaded : " + global.TEMPDIR + profilePic);

        var image = sharp(global.TEMPDIR + profilePic);
        image.metadata().then(function (metadata) {

            log.debug('image metadata: ' + JSON.stringify(metadata));

            var width;
            var height;
            var format = sharp.format.jpeg.id;
            var imgName = (userDto.profilePic)? userDto.profilePic.split(".")[0] : profilePic.split(".")[0];


            if (metadata.width > metadata.height) {

                width = (metadata.width > 300) ? 300 : metadata.width;
            }
            else {
                height = (metadata.height > 300) ? 300 : metadata.height;
            }

            if (metadata.format == sharp.format.png.id || metadata.format == 'gif') {
                format = sharp.format.png.id;
            }

            imgName = imgName + '.' + format;

            image
                .resize(width, height)
                .toFormat(format)
                .withMetadata()
                .toFile(process.env.UPLOADS_DIR + 'users/profile/' + imgName);

            deferred.resolve(imgName);

        }).catch(function (err) {
            log.debug('exception thrown when updating user: ' + err);
            deferred.reject('There was an error with your upload: ' + err);
        });


        /*
         STILL NEED TO REMOVE TEMP IMAGE
         mv(global.TEMPDIR + profilePic, process.env.UPLOADS_DIR + 'users/profile/' + userDto.profilePic, function (err) {
         if (err) {
         log.debug('error uploading file: ' + err);
         }
         });
         */
    }
    else {
        log.debug("no image uploaded");
        deferred.resolve(userDto.profilePic);
    }

    return deferred.promise;
};

var createUser = function (userDto, profilePic) {

    log.debug("enter createUser");
    log.debug("profilePic: " + profilePic);

    var deferred = Q.defer();
    var data = {};
    data.errors = [];

    uploadPic(profilePic, userDto).then(function (imgName) {

        userDto.profilePic = imgName;
        userDao.createUser(userDto).then(function (userDto) {


                data.user = userDto;
                userDto.profilePic = imgName;
                log.debug('userDto new profile pic: ' + imgName);
                deferred.resolve(data);
            },
            function (err) {
                log.error("error saving new user: " + err);
                data.errors.push("There was an error creating your profile, please try back later");
                deferred.resolve(data);
            }
        );


    }, function (err) {

        log.error("error with image upload for new user: " + err);
        data.errors.push("There was an error with your image: " + err);
        deferred.resolve(data);
    });

    return deferred.promise;
};


var createSocialUser = function (userDto, profilePic) {

    var deferred = Q.defer();
    var data = {};
    data.errors = [];

    uploadPic(profilePic, userDto).then(function (imgName) {

        userDto.profilePic = imgName;
        userDao.createSocialUser(userDto).then(function (userDto) {

            uploadPic(profilePic, userDto);
            data.user = userDto;

            deferred.resolve(data);

        }, function (err) {
            log.error("error saving new user: " + err);
            data.errors.push("There was an error creating your profile, please try back later");
            deferred.resolve(data);

        });


    }, function (err) {

        log.error("error with image upload for new social user: " + err);
        data.errors.push("There was an error with your image: " + err);
        deferred.resolve(data);
    });

    return deferred.promise;
};

exports = module.exports = function (req, res) {

    log.debug("enter saveProfile with user: " + req.body.user);

    var data = {};
    data.errors = [];

    if (!req.body.user) {
        data.errors.push("There was an error processing your submission");
        res.json(data);
    }

    var userDto = JSON.parse(req.body.user);

    data.errors = userValidation.validateUser(userDto);
    data.errors = data.errors.concat(tagValidation.validate(userDto.tags));

    if (data.errors.length) {
        res.json(data);
        return;
    }


    var profilePic = null;
    for (var key in req.files) {
        log.debug("uploaded file is: " + req.files[key].name);
        profilePic = req.files[key].name;
    }

    var updateSession = function(userDto){
        log.debug('update session');
        req.login(userDto, function(err){
            log.debug('req login had a fail: ' + err);
        });
    };

    if (req.user) {



        log.debug("update existing user");

        userDao.isUniqueEmail(userDto).then(function (isUnique) {

            if (isUnique) {
                logger.debug("email is unique");

                uploadPic(profilePic, userDto).then(function (imgName) {

                    userDto.profilePic = imgName;
                    userDao.updateProfile(userDto).then(function (updatedUser) {
                        data.user = updatedUser;
                        updateSession(updatedUser);
                        res.json(data);
                    });

                }, function (err) {
                    data.errors.push(err);
                    res.json(data);
                });

            }
            else {
                logger.debug("email is NOT unique");
                data.errors.push("The email address " + userDto.email + " is already being used by another user");
                res.json(data);
            }


        }).catch(function (err) {
            log.debug('exception thrown when updating user: ' + err);
            res.json({error: err});
        });

    }
    //create user
    else {

        log.debug("create new user");

        //ensure email is unique
        userDao.isUniqueEmail(userDto).then(function (isUnique) {

            if (isUnique) {
                log.debug('email is good, create user for: ' + JSON.stringify(userDto));

                if (userDto.socialId) {
                    createSocialUser(userDto, profilePic).then(function (data) {
                        log.debug('returning user data');
                        updateSession(data.user);
                        res.json(data);
                    });
                }
                else {
                    createUser(userDto, profilePic).then(function (data) {
                        updateSession(data.user);
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

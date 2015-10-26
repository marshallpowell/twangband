var keystone = require('keystone');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var trackDao = require(APP_LIB + 'dao/TrackDao');
var songDao = require(APP_LIB + 'dao/SongDao');
var userDao = require(APP_LIB + 'dao/UserDao');
var mv = require('mv');

exports = module.exports = function(req, res) {

    logger.debug("enter search with criteria: " + req.body.searchCriteria);

    var searchDto = JSON.parse(req.body.searchCriteria);

    var searchResults = {};
    searchResults.data=[]


    if(searchDto.type=='SONG'){
        logger.debug("search type is for a song");
        trackDao.searchTracks(searchDto).then( function(tracks){

            logger.debug("found tracks list size: " + tracks.length);
            res.json(tracks);

        }, handleError);

    }
    else if(searchDto.type=='USER'){

        logger.debug("search type is for a user");


        userDao.findUser(searchDto).then( function(users){

            logger.debug("found users list size: " + users.length);

            res.json(users);

            done(null, users)

        }, handleError);



    }
    else if(searchDto.type=='USER_IDS'){

        logger.debug("search type is for a user");


        userDao.getUsersById(searchDto.userIds).then( function(users){
            logger.debug('getting ready to write users');
            res.json(users);
        }, handleError);
    }


    //map the request data and uploaded file info to the DTO.

    var handleError = function(err){
        res.json(err);
        logger.debug("error: " + err);
    };
};


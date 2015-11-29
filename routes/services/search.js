var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var trackDao = require(APP_LIB + 'dao/TrackDao');
var userDao = require(APP_LIB + 'dao/UserDao');

exports = module.exports = function(req, res) {

    logger.debug("enter search with criteria: " + JSON.stringify(req.body));
    var searchDto = req.body;

    var searchResults = {};
    searchResults.data=[];


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

        logger.debug("search type is for a user ids");


        userDao.getUsersById(searchDto.userIds).then( function(users){
            logger.debug('getting ready to write users: ' + JSON.stringify(users));
            res.json(users);
        }, handleError);
    }


    //map the request data and uploaded file info to the DTO.

    var handleError = function(err){
        res.json(err);
        logger.debug("error: " + err);
    };
};


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

    //call dao's save the song and songTracks
    if(searchDto.type=='SONG'){
        logger.debug("search type is for a song");
        //songDao.createOrUpdateSong(songDto);
    }
    else if(searchDto.type=='USER'){

        logger.debug("search type is for a user");


        userDao.findUser(searchDto).then( function(users){

            for(var i = 0; i < users.length; i++){
                searchResults.data.push({'name' : users[i].name.first + ' ' + users[i].name.last, 'id' : users[i]._id});
            }
            logger.debug('getting ready to write json results: ' + JSON.stringify(searchResults));
            //res.writeHead(200, { 'Content-Type': 'application/json' });

            searchResults.data = JSON.stringify(searchResults.data);
            res.json(searchResults);

            done(null, users)

        }, handleError);



    }
    else if(searchDto.type=='USER_IDS'){

        logger.debug("search type is for a user");


        userDao.getUsersById(searchDto.userIds).then( function(users){


            logger.debug('getting ready to write users');
            data.users = users;
            res.json(data);
        }, handleError);
    }


    //map the request data and uploaded file info to the DTO.

    var handleError = function(err){
        res.json(err);
        logger.debug("error: " + err);
    };
};


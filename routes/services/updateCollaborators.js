var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var songDao = require(APP_LIB + 'dao/SongDao');
var mv = require('mv');

exports = module.exports = function(req, res) {


    logger.debug("enter addSongCollaborator: ");
    var data = {};
    data.errors = [];

    var collaboratorDto = JSON.parse(req.body.collaborator);

    logger.debug("songId: " + req.body.songId);
   // songDao.createOrUpdateSong(songDto);

    if(req.body.action == "ADD"){
        logger.debug("action is ADD");

        songDao.addOrRemoveCollaborators(req.body.songId,collaboratorDto).then(function(songDto){

            userDao.findUserById(collaboratorDto.id).then(function(userDto){
                data.user = userDto;
                res.json(data);

            },function(err){
                data.errors.push(err);
                res.json(data);
            })

        },function(err){
            data.errors.push(err);
            res.json(data);
        });
    }
    else{
        logger.debug("other action called");
    }


};



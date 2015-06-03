var keystone = require('keystone');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var songDao = require(APP_LIB + 'dao/SongDao');
var mv = require('mv');

exports = module.exports = function(req, res) {


    logger.debug("enter addSongCollaborator: ");

    var collaboratorDto = JSON.parse(req.body.collaborator);

    logger.debug("songId: " + req.body.songId);
   // songDao.createOrUpdateSong(songDto);

    if(req.body.action == "ADD"){
        logger.debug("action is ADD");

        songDao.addOrRemoveCollaborators(req.body.songId,collaboratorDto);
    }
    else{
        logger.debug("other action called");
    }
    //map the request data and uploaded file info to the DTO.
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write({name : "marshall"});
    res.end();

};



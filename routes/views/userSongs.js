var keystone = require('keystone');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var trackDao = require(APP_LIB + 'dao/TrackDao');
var songDao = require(APP_LIB + 'dao/SongDao');

exports = module.exports = function(req, res) {

    logger.debug("enter userSongs with user id: " + JSON.stringify(req.user));
    var view = new keystone.View(req, res),
        locals = res.locals;

    // locals.section is used to set the currently selected
    // item in the header navigation.
    locals.section = 'songs';

    //if not logged in don't show errors
    if(!req.user){
        view.render('userSongs');
        return;
    }


    songDao.findUserSongs(req.user.id).then(
        function(songs){
            logger.debug("got songs: " + songs.length);
            locals['songs'] = songs;
            // Render the view

            songDao.findUserCollaboratorSongs(req.user.id).then(
                function(songs){
                    logger.debug("got collaborator songs: " + songs.length);
                    locals['collaboratedSongs'] = songs;
                    // Render the view
                     view.render('userSongs');
                },
                function(err){
                    logger.debug("error retrieving songs: " + err);
                    // Render the view
                    // view.render('userSongs');
                }
            );
    },
        function(err){
            logger.debug("error retrieving songs: " + err);
            // Render the view
            view.render('userSongs');
        });

};

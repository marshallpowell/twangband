var keystone = require('keystone');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var trackDao = require(APP_LIB + 'dao/TrackDao');
var songDao = require(APP_LIB + 'dao/SongDao');

exports = module.exports = function(req, res) {

    logger.debug("enter userSongs with user id: " + req.user._id);
    var view = new keystone.View(req, res),
        locals = res.locals;

    // locals.section is used to set the currently selected
    // item in the header navigation.
    locals.section = 'home';

    songDao.findUserSongs(req.user._id).then(
        function(songs){
            logger.debug("got songs: " + songs.length);
            locals['songs'] = songs;
            // Render the view
            view.render('userSongs');
    },
        function(err){
            logger.debug("error retrieving songs: " + err);
            // Render the view
            view.render('userSongs');
        });





};

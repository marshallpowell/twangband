var keystone = require('keystone');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var songDao = require(APP_LIB + 'dao/SongDao');

exports = module.exports = function(req, res) {

    var view = new keystone.View(req, res),
        locals = res.locals;

    // Set locals
    locals.section = 'mixer';

    if(req.query.song) {
        songDao.getSong(req.query.song).then(
            function (song) {
                logger.debug("rendering with song " + song.name);
                locals['songJSON'] = JSON.stringify(song);

                // Render the view
                view.render('songMixer');
            },
            function (err) {
                logger.debug("error retrieving songs: " + err);
                // Render the view
                view.render('songMixer');
            });
    }
    else{

        view.render('songMixer');
    }

};

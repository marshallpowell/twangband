var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var songDao = require(APP_LIB + 'dao/SongDao');

exports = module.exports = function(req, res) {

    var locals = res.locals;

    // Set locals
    locals.section = 'mixer';

    if(req.query.song) {
        songDao.getSong(req.query.song).then(
            function (song) {
                logger.debug("rendering with song " + song.name);
                locals['songJSON'] = JSON.stringify(song);

                // Render the view
                res.render('songMixer');
            },
            function (err) {
                logger.debug("error retrieving songs: " + err);
                // Render the view
                res.render('songMixer');
            });
    }
    else{

        res.render('songMixer');
    }

};

var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var songDao = require(APP_LIB + 'dao/SongDao');
var disqusUtil = require(APP_LIB + 'util/DisqusUtil');

exports = module.exports = function(req, res) {

    var locals = res.locals;

    // Set locals
    locals.section = 'mixer';


    if(req.query.song) {
        songDao.getSong(req.query.song).then(
            function (song) {
                logger.debug("rendering with song " + song.name);
                locals['songJSON'] = JSON.stringify(song);

                if(req.user){
                    locals['disqusAuth'] = disqusUtil.getSignonKey(req.user);
                    locals['DISQUS_API_PUBLIC_KEY'] = process.env.DISQUS_API_PUBLIC_KEY;
                    locals['BASE_URL'] = process.env.BASE_URL;
                    locals['disqusTopicId'] = 'song='+song.id;
                    locals['pageUrl'] = process.env.BASE_URL + '/songMixer?'+locals['disqusTopicId'];
                }

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

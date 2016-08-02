var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var songDao = require(APP_LIB + 'dao/SongDao');
var likeContentDao = require(APP_LIB + 'dao/LikeContentDao');
var disqusUtil = require(APP_LIB + 'util/DisqusUtil');

exports = module.exports = function(req, res) {

    var locals = res.locals;

    if (!req.user) {

        req.flash('error', 'You must be logged in to view this page');
        res.render('signin');
        return;
    }

    // Set locals
    locals.section = 'mixer';
    var songDto;


    if(req.query.song) {
        songDao.getSong(req.query.song).then(
            function (song) {

                songDto = song;
                locals['songJSON'] = JSON.stringify(song);
                locals['songId'] = song.id;

                if(req.user){
                    locals['disqusAuth'] = disqusUtil.getSignonKey(req.user);
                    locals['DISQUS_API_PUBLIC_KEY'] = process.env.DISQUS_API_PUBLIC_KEY;
                    locals['BASE_URL'] = process.env.BASE_URL;
                    locals['disqusTopicId'] = 'song='+song.id;
                    locals['pageUrl'] = process.env.BASE_URL + '/songMixer?'+locals['disqusTopicId'];
                }

            },
            function (err) {
                logger.err("error retrieving songs: " + err);
                // Render the view
                res.render('songMixer');
            }).then(function(){

                logger.debug('enter then with song: ' + JSON.stringify(songDto));
                var likeContentDto = {};
                likeContentDto.entityType='song';
                likeContentDto.entityId=songDto.id;

                if(req.user){
                    logger.debug('user: ' + JSON.stringify(req.user));
                    likeContentDto.userId=req.user.id;
                }

                logger.debug('query for likes');
                likeContentDao.getEntityLikes(likeContentDto).then(function(likeContentDtoResponse){
                    logger.debug('song like: ' + JSON.stringify(likeContentDtoResponse));
                    locals['likeContentDto'] = likeContentDtoResponse;
                    // Render the view
                    logger.debug("rendering with song " + songDto.name);
                    res.render('songMixer');
                }, function(err){
                    logger.error('error getting likes: ' + err);
                    res.render('songMixer');
                });

            }).catch(function(err){
                logger.error('exception thrown when getting song: ' + err);
                res.render('songMixer');
            });
    }
    else{

        res.render('songMixer');
    }

};

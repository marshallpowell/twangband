var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var likeContentDao = require(APP_LIB + 'dao/LikeContentDao');
var userDao = require(APP_LIB + 'dao/UserDao');

exports = module.exports = function(req, res) {

    log.debug("enter like with: " + JSON.stringify(req.body));
    var likeDto = req.body;

    var data = {};
    data.errors=[];
    data.result={};


    likeContentDao.toggleLike(likeDto).then(function(likeContentDto){
        log.debug('return likeContentDto: ' + JSON.stringify(likeContentDto));
        data.result = likeContentDto;
        res.json(data);
    }, function(err){
        log.error('error thrown when liking content: ' + err);
        data.errors.push(err);
        res.json(data);
    }).catch(function (err) {
        log.error('exception thrown when calling like: ' + err);
        data.errors.push(err);
        res.json(data);
    });

};
var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var likeContentDao = require(APP_LIB + 'dao/LikeContentDao');
var userDao = require(APP_LIB + 'dao/UserDao');

exports = module.exports = function(req, res) {

    if(!req.query.type || !req.query.id){
        res.json({});
        return;
    }


    var data = {};
    data.errors=[];
    data.result={};

    if(req.query.showUsers){
        likeContentDao.getUserList(req.query.type, req.query.id).then(function(userList){
            log.debug('return user list: ' + JSON.stringify(userList));
            data.result = userList;
            res.json(data);
        }, function(err){
            log.error('error thrown when retrieving user list: ' + err);
            data.errors.push(err);
            res.json(data);
        }).catch(function (err) {
            log.error('error thrown when retrieving user list: ' + err);
            data.errors.push(err);
            res.json(data);
        });
    }
    else{

        var likeDto = {};
        likeDto.entityId = req.query.id;
        likeDto.entityType = req.query.type;
        if(req.user){
            likeDto.userId = req.user.id;
        }

        likeContentDao.getEntityLikes(likeDto).then(function(likeContentDto){
            log.debug('return likeDto: ' + JSON.stringify(likeContentDto));
            data.result = likeContentDto;
            res.json(data);
        }, function(err){
            log.error('error thrown when retrieving like content: ' + err);
            data.errors.push(err);
            res.json(data);
        }).catch(function (err) {
            log.error('error thrown when retrieving like content: ' + err);
            data.errors.push(err);
            res.json(data);
        });
    }



};
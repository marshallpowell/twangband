var Q = require('q');
var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var userDao = require(APP_LIB + 'dao/UserDao');
var ObjectId = require('mongoose').Types.ObjectId;
var dtoMapper = require(APP_LIB + 'util/DtoMapper');//test


var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var LikeSchema = new Schema({

    creator: {type: Schema.Types.ObjectId, ref: 'User', index: true},
    entity: {type: Schema.Types.ObjectId, index: true},
    entityType: {type: String, required: true},
    dateCreated: {type: Date, default: Date.now}

});

var LikeModel = mongoose.model('Like', LikeSchema);

var LikeContentDao = module.exports = {};

LikeContentDao.getUserList = function (entityType, entityId) {

    log.debug('enter getEntityLikes with entityId: ' + entityId + ' entityType: ' + entityType);

    var deferred = Q.defer();

    var entityId = new ObjectId(entityId);

    LikeModel.find({entity: entityId, entityType: entityType}, 'creator -_id').exec(function (err, results) {

        if (err) {
            log.error('error thrown retrieving userIds: ' + err);
            deferred.refject('error thrown retrieving userIds: ' + err);
        }
        else {

            log.debug('returned results: ' + JSON.stringify(results));
            var userIds = [];

            for (var i = 0; i < results.length; i++) {
                userIds.push(results[i].creator);
            }

            userDao.getUsersById(userIds).then(function (users) {
                deferred.resolve(users);
            }, function (err) {
                deferred.reject(err);
            });

        }

    });

    return deferred.promise;
};


LikeContentDao.getUserLikesByType = function (user, entityType, offset, limit) {

    log.debug('enter getUserLikes with userId: ' + user.id + " and entityType: " + entityType);

    var deferred = Q.defer();

    LikeModel.find({creator: new ObjectId(user.id), entityType: entityType})
        .exec(function (err, content) {

            if (err) {
                log.error('error finding likeContent: ' + err);
                deferred.reject(err);
            }
            else {

                var entityIds = [];

                for(var i = 0; i < content.length; i++){
                    entityIds.push(content[i].entity);
                }

                log.debug('returning entityIds: ' + JSON.stringify(entityIds));
                deferred.resolve(entityIds);

            }
        });


    return deferred.promise;

};

LikeContentDao.getEntityLikes = function (likeContentDto) {

    log.debug('enter getEntityLikes with: ' + JSON.stringify(likeContentDto));

    var deferred = Q.defer();

    var entityId = new ObjectId(likeContentDto.entityId);

    var query = {};

    LikeModel.count({entityType: likeContentDto.entityType, entity: entityId})
        .exec(function (err, count) {

            if (err) {
                deferred.reject(err);
            }
            else {
                likeContentDto.count = count;

                if (likeContentDto.userId) {
                    var userId = new ObjectId(likeContentDto.userId);
                    LikeModel.findOne({creator: userId, entityType: likeContentDto.entityType, entity: entityId})
                        .exec(function (err, content) {

                            if (err) {
                                log.error('error finding likeContent: ' + err);
                                deferred.reject(err);
                            }
                            else {

                                if (content == null) {
                                    likeContentDto.like = false;
                                }
                                else {
                                    likeContentDto.like = true;
                                    likeContentDto.dateCreated = content.dateCreated;
                                }

                                log.debug('returning like info: ' + JSON.stringify(likeContentDto));
                                deferred.resolve(likeContentDto);

                            }
                        });

                }
                else {
                    deferred.resolve(likeContentDto);
                }
            }

        });

    return deferred.promise;

};

LikeContentDao.toggleLike = function (likeContentDto) {

    log.debug('enter toggleLike with userId: ' + likeContentDto.userId + ' like: ' + likeContentDto.like + ' entityId: ' + likeContentDto.entityId + ' entityType:' + likeContentDto.entityType);
    var deferred = Q.defer();
    var userId = new ObjectId(likeContentDto.userId);
    var entityId = new ObjectId(likeContentDto.entityId);


    LikeModel.findOne({creator: userId, entityType: likeContentDto.entityType, entity: entityId})
        .exec(function (err, content) {

            if (err) {
                log.error('error finding likeContent: ' + err);
                deferred.reject(err);
            }
            else {
                log.debug('search for liked content: ' + JSON.stringify(content));

                if (likeContentDto.like && content == null) {

                    //user is liking a new song/track
                    var likeContent = new LikeModel({
                        'creator': userId,
                        'entity': entityId,
                        'entityType': likeContentDto.entityType
                    });

                    likeContent.save(function (err, content) {

                        LikeModel.count({entityType: likeContentDto.entityType, entity: entityId})
                            .exec(function (err, count) {

                                if (err) {
                                    deferred.reject(err);
                                }
                                else {
                                    var likeDto = dtoMapper.mapLikeContentModel(content, count);
                                    log.debug('returning like info: ' + JSON.stringify(likeDto));
                                    deferred.resolve(likeDto);
                                }

                            });

                    });
                }
                else if (!likeContentDto.like && content != null) {

                    //user wants to unlike a previously liked song/track
                    log.debug('unlike');
                    LikeModel.remove({_id: content._id}, function (err) {
                        if (err) {
                            log.error(err);
                            deferred.reject(err);
                        }
                        else {
                            likeContentDto.like = false;
                            likeContentDto.count--;
                            deferred.resolve(likeContentDto);
                        }
                    });


                }
                else {
                    //error
                    log.error('bad request for liking content');
                    deferred.reject('Bad request for liking content');
                }

            }
        });


    return deferred.promise;
};
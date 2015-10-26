

var Q = require('q');
var keystone = require('keystone');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var User = keystone.list('users'); // keystone.list('User').model same as mongoose.model('User');
var Track = keystone.list('tracks');
var authUtils = require(APP_LIB+'util/AuthUtils');
var dtoMapper = require(APP_LIB + 'util/DtoMapper');

var TrackDao = module.exports = {};

TrackDao.searchTracks = function(searchCriteriaDto){

    logger.debug('enter searchTracks');

    var deferred = Q.defer();
    var query = {};

    if(searchCriteriaDto.matchCriteria == 'ANY'){
       query = { tags: { $in: searchCriteriaDto.tags } }
    }
    else{
        query = { tags: { $all: searchCriteriaDto.tags } }
    }


    Track.model.find(query).exec(function (err, tracks) {

        if (err) {
            logger.debug(err);
            deferred.reject(err);
        }
        else {

            logger.debug('found this many tracks: ' + tracks.length);

            var trackDtos=[];

            for(var i = 0; i < tracks.length; i++){
                trackDtos.push(dtoMapper.mapTrackModel(tracks[i]));
            }

            deferred.resolve(trackDtos);

        }
    });

    return deferred.promise;
};

TrackDao.createOrUpdateTrack = function(trackDto){

    logger.debug('looking for track with id: ' + trackDto.id);

    var deferred = Q.defer();
    var track = null;

    if(trackDto.id != null){
        //update track
        logger.debug("updating track");
    }
    else{
        //create new track
        logger.debug("creating track with trackDto: " + JSON.stringify(trackDto));

        track = new Track.model({
            'name' : trackDto.name, 'creator' : trackDto.creatorId, 'encoding' : trackDto.encoding, 'size' : trackDto.size, 'mimetype' : trackDto.mimetype, 'fileName' : trackDto.fileName, 'tags' : trackDto.tags});

        track.save(function (err){
            if(err){
                logger.debug("error saving new track: " + err);
                deferred.reject(err);
            }
            else{
                deferred.resolve(track);
            }

        });

    }


};
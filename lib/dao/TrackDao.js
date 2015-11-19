

var Q = require('q');
var keystone = require('keystone');
var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var User = keystone.list('users'); // keystone.list('User').model same as mongoose.model('User');
//var Track = keystone.list('tracks');
var authUtils = require(APP_LIB+'util/AuthUtils');
var dtoMapper = require(APP_LIB + 'util/DtoMapper');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var TrackSchema = new Schema({

    name: { type: String, required: true, index: true },
    fileName: { type: String, required: true, initial: false},
    creator: {type: Schema.Types.ObjectId, ref: 'User', index: true},
    mimetype: { type: String, required: true, initial: false},
    encoding: { type: String, required: true, initial: false},
    size: { type: Number, required: true, initial: false},
    dateCreated: {type: Date, default: Date.now},
    isPublic: {type: Boolean, default:true},
    tags: [String]
});

var Track = mongoose.model('Track', TrackSchema);

var TrackDao = module.exports = {};

/**
 * Searches for a track based on criteria
 * @param searchCriteriaDto
 * @returns {*|promise}
 */
TrackDao.searchTracks = function(searchCriteriaDto){

    log.debug('enter searchTracks');

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
            log.debug(err);
            deferred.reject(err);
        }
        else {

            log.debug('found this many tracks: ' + tracks.length);

            var trackDtos=[];

            for(var i = 0; i < tracks.length; i++){
                trackDtos.push(dtoMapper.mapTrackModel(tracks[i]));
            }

            deferred.resolve(trackDtos);

        }
    });

    return deferred.promise;
};

/**
 * Currently only saves new tracks
 * @param trackDto
 * @returns {*|promise}
 */
TrackDao.createOrUpdateTrack = function(trackDto){

    log.debug('looking for track with id: ' + trackDto.id);

    var deferred = Q.defer();
    var Track = mongoose.model('Track', TrackSchema);

    if(trackDto.id != null){
        //update track
        log.debug("updating track");
    }
    else{
        //create new track
        log.debug("creating track with trackDto: " + JSON.stringify(trackDto));

        var track = new Track({
            'name' : trackDto.name, 'creator' : trackDto.creatorId, 'encoding' : trackDto.encoding, 'size' : trackDto.size, 'mimetype' : trackDto.mimetype, 'fileName' : trackDto.fileName, 'tags' : trackDto.tags});

        track.save(function (err, track){
            if(err){
                log.debug("error saving new track: " + err);
                deferred.reject(err);
            }
            else{
                var trackDto = dtoMapper.mapTrackModel(track);
                log.debug('saved track succesfully saved track');
                deferred.resolve(trackDto);
            }

        });

    }

    return deferred.promise;

};
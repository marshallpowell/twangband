

var Q = require('q');
var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var User = require(APP_LIB + 'dao/UserDao').User;
var ObjectId = require('mongoose').Types.ObjectId;
var dtoMapper = require(APP_LIB + 'util/DtoMapper');
var songDao = require(APP_LIB + 'dao/SongDao');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var TrackSchema = new Schema({

    name: { type: String, required: true, index: true },
    description: { type: String, required: false, index: false },
    fileName: { type: String, required: true, initial: false},
    creator: {type: Schema.Types.ObjectId, ref: 'User', index: true},

    formatName: { type: String, required: true, initial: false},
    duration: { type: Number, required: true, initial: false},
    bitRate: { type: Number, required: true, initial: false},
    codecName: { type: String, required: true, initial: false},
    codecType: { type: String, required: true, initial: false},
    sampleFormat: { type: String, required: true, initial: false},
    sampleRate: { type: Number, required: true, initial: false},
    numberOfChannels: { type: Number, required: true, initial: false},
    channelLayout: { type: String, required: true, initial: false},

    size: { type: Number, required: true, initial: false},
    dateCreated: {type: Date, default: Date.now},
    lastUpdated: {type: Date, default: Date.now},
    lastUpdatedBy : {type: Schema.Types.ObjectId, ref: 'User', index: true},
    isPublic: {type: Boolean, default:true},
    removed : {type: Boolean, default:false},
    tags: [String]
});


var Track = mongoose.model('Track', TrackSchema);

var TrackDao = module.exports = {};


TrackDao.removeTracks = function(trackDtos){

    log.debug("enter removeTracks, size: " + trackDtos.length);
    //first query for references of tracks on songs

    for(var i = 0; i < trackDtos.length; i++){

        songDao.findSongTracksByOriginalTrackId(trackDtos[i]).then(function(songDtos){

            if(songDtos.length === 0){

                //TODO if no references found, you can safely remove the track, and the .ogg file
                //should i soft delete and keep the track for a short period?
                //set to private along with a delete date?
                log.debug("no references found, deleting track, and .ogg file now");

                var query = {_id: new ObjectId(trackDtos[i].id)};

                Track.findOne(query).exec(function (err, track) {

                    if (err) {
                        log.debug(err);

                    }
                    else {

                        log.debug('found this many tracks: ' + tracks.length);
                        track.removed=true;
                        track.isPublic=false;
                        track.lastUpdatedBy = new ObjectId(trackDtos._currentUser.id);
                        track.lastUPdatedDate = new Date();
                        track.save();

                    }
                });
            }
            else{

            }
        })
    }


};

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
 * Used to get the trackDtos for a song
 * @param trackIds - array of mongo ObjectId()
 * @returns {*|promise}
 */
TrackDao.getListOfTracksById = function(trackIds){

    log.debug("enter getListOfTracks");
    var Track = mongoose.model('Track', TrackSchema);
    var deferred = Q.defer();
    var query = {_id: {$in: trackIds}};

    Track.find(query).exec(function (err, tracks) {

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
        log.debug("updating track: " +  + JSON.stringify(trackDto));

        var query = {};

        query["_id"] = mongoose.Types.ObjectId(trackDto.id);

        Track.findOne(query)
            .exec(function (err, track) {

                if (err) {
                    logger.debug(err);
                    deferred.reject(err);
                }
                else {
                    logger.debug('found track: ' + JSON.stringify(track));

                    track.name = trackDto.name;
                    track.description = trackDto.description;
                    track.tags = trackDto.tags;
                    track.lastUpdatedBy = trackDto._currentUser.id;
                    track.lastUpdated = new Date();

                    track.save(function (err, track){
                        if(err){
                            log.debug("error saving new track: " + err);
                            deferred.reject(err);
                        }
                        else{
                            var trackDto = dtoMapper.mapTrackModel(track);
                            log.debug('updated track successfully');
                            deferred.resolve(trackDto);
                        }

                    });

                }

            });


    }
    else{
        //create new track
        log.debug("creating new track with trackDto: " + JSON.stringify(trackDto));

        var track = new Track({
            'name' : trackDto.name,
            'description' : trackDto.description,
            'creator' : new ObjectId(trackDto._currentUser.id),
            'encoding' : trackDto.encoding,
            'size' : trackDto.size,
            'mimetype' : trackDto.mimetype,
            'fileName' : trackDto.fileName,
            'tags' : trackDto.tags,
            'formatName' : trackDto.formatName,
            'duration' : trackDto.duration,
            'bitRate' : trackDto.bitRate,
            'codecName' : trackDto.codecName,
            'codecType' : trackDto.codecType,
            'sampleFormat' : trackDto.sampleFormat,
            'sampleRate' : trackDto.sampleRate,
            'numberOfChannels' : trackDto.numberOfChannels,
            'channelLayout' : trackDto.channelLayout
        });

        track.save(function (err, track){
            if(err){
                log.debug("error saving new track: " + err);
                deferred.reject(err);
            }
            else{
                var trackDto = dtoMapper.mapTrackModel(track);
                log.debug("********** track id is " + trackDto.id);
                log.debug('saved track successfully saved track');
                deferred.resolve(trackDto);
            }

        });

    }



    return deferred.promise;

};


var Q = require('q');
var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var User = require(APP_LIB + 'dao/UserDao').User;
var ObjectId = require('mongoose').Types.ObjectId;
var dtoMapper = require(APP_LIB + 'util/DtoMapper');
var songDao = require(APP_LIB + 'dao/SongDao');
var _ = require('underscore');
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
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
    tags: [String],
    songKeywords: [String],
    songIds : [Schema.Types.ObjectId]
});


TrackSchema.index(
    {
        name: "text",
        description: "text",
        tags: "text",
        songKeywords : "text"
    },
    {
        weights: {
            name: 10,
            description: 8,
            tags:6,
            songKeywords: 4
        },
        name: "TrackSearchIndex"
    }
);

TrackSchema.plugin(mongoosePaginate);


var Track = mongoose.model('Track', TrackSchema);

var TrackDao = module.exports = {};


TrackDao.removeTracks = function(trackDtos, songId){

    log.debug("enter removeTracks, size: " + trackDtos.length);
    //first query for references of tracks on songs

    for(var i = 0; i < trackDtos.length; i++){

        TrackDao.updateSearch(trackDtos[i], songId);

        //TODO i think this should only be done on the tracks page.
        /*
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
        });
        */
    }


};

TrackDao.findUserTracks = function (userDto, offset, limit) {

    log.debug('entered findUserTracks');

    var options ={};
    options['offset'] = offset || 0;
    options['limit'] = limit || 10;
    options['sort'] = {dateCreated: 'desc'};


    var Track = mongoose.model('Track', TrackSchema);
    var deferred = Q.defer();
    var query = {};
    query["creator"] = userDto.id;

    Track.paginate(query, options, function (err, results) {

        if (err) {
            logger.debug(err);
            deferred.reject(err);
        }
        else {
            logger.debug('found tracks: ' + results.docs.length);
            var dtos = [];
            for(var i = 0; i < results.docs.length; i++){
                dtos.push(dtoMapper.mapTrackModel(results.docs[i]));
            }

            deferred.resolve(dtos);

        }

    });

    return deferred.promise;
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
 *
 * @param keywords
 * @param offset
 * @param limit
 */
TrackDao.searchTracksByKeywords = function(keywords, offset, limit){

    log.debug('entered searchTracksByKeywords with keywords: ' + keywords);

    var Track = mongoose.model('Track', TrackSchema);
    var deferred = Q.defer();
    var query = {};

    var options ={};
    options['offset'] = offset || 0;
    options['limit'] = limit || 10;
    options['fields'] = '_id, songIds';
    query['$text'] = { $search: keywords };

    Track.paginate(query, options, function (err, results) {

        if (err) {
            deferred.reject(err);
        }
        else {

            log.debug('found tracks: ' + results.docs.length);
            var trackDtos=[];
            for(var i = 0; i < results.docs.length; i++){
                trackDtos.push(dtoMapper.mapTrackModel(results.docs[i]));
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

            log.debug('tracks: ' + JSON.stringify(trackDtos));
            deferred.resolve(trackDtos);

        }
    });

    return deferred.promise;

};

TrackDao.updateSearch = function(trackDto, unlinkFromSongId){
    log.debug('enter updateSearch with track.id: ' + trackDto.id);

    var Track = mongoose.model('Track', TrackSchema);
    var deferred = Q.defer();
    var query = {};

    query["_id"] = mongoose.Types.ObjectId(trackDto.id);


    Track.findOne(query)
        .exec(function (err, track) {

            var songKeywords = (track.songKeywords) ? track.songKeywords : [];
            var songIds = [];

            if(track.songIds){

                for(var i = 0; i < track.songIds.length; i++){
                    if(track.songIds[i]){
                        songIds.push(track.songIds[i].toString());
                    }

                }
            }

            songIds = _.uniq(songIds.concat(trackDto.songIds));

            if(unlinkFromSongId){
                log.debug("*****************************************");

                for(var i = 0; i < songIds.length; i++){
                    if(songIds[i] == unlinkFromSongId){
                        songIds.splice(i,1);
                    }
                }
            }

            track.songIds = songIds;
            track.songKeywords = _.uniq(songKeywords.concat(trackDto.songKeywords));

            track.save(function (err, track){
                if(err){
                    log.debug("error saving track search data: " + err);
                    deferred.reject(err);
                }
                else{
                    var trackDto = dtoMapper.mapTrackModel(track);
                    log.debug('updated track search criteria successfully');
                    deferred.resolve(trackDto);
                }

            });
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
                    track.isPublic = trackDto.isPublic;
                    track.lastUpdatedBy = trackDto._currentUser.id;
                    track.lastUpdated = new Date();

                    if(trackDto.songIds){
                        track.songKeywords = _.union(track.songKeywords, trackDto.songKeywords);
                        track.songIds = _.union(track.songIds, trackDto.songIds);
                    }


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

        var creatorId = (trackDto._currentUser.id)? trackDto._currentUser.id : trackDto.creatorId;
        var songKeywords = (trackDto.songKeywords)? trackDto.songKeywords : [];
        var songIds = (trackDto.songIds)? trackDto.songIds : [];

        log.debug('creator id: ' + creatorId);

        var track = new Track({
            'name' : trackDto.name,
            'description' : trackDto.description,
            'creator' : new ObjectId(creatorId),
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
            'channelLayout' : trackDto.channelLayout,
            'songKeywords' : songKeywords,
            'songIds' : songIds
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
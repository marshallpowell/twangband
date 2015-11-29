/**
 * Song DAO
 */

var Q = require('q');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var ObjectId = require('mongoose').Types.ObjectId;
var dtoMapper = require(APP_LIB + 'util/DtoMapper');
var trackDao = require(APP_LIB + 'dao/TrackDao');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SongCollaboratorSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User', index: true},
    roles: [{type : String}],
    dateCreated: {type: Date, default: Date.now},
    lastUpdated: {type: Date, default: Date.now}

});

var SongTrackSchema = new Schema({
    name: {type: String, required: true, index: true, initial: false},
    description: {type: String, required: false, index: false, initial: false},
    volume: {type: Number, default: 5},
    gain: {type: Number, default: 0},
    position: {type: Number, default: 0},
    muted: {type: Boolean, default: false},
    fileName: {type: String, required: false, index: true, initial: false},
    originalTrackId : {type: Schema.Types.ObjectId, ref: 'Track', index: true},
    dateCreated: {type: Date, default: Date.now},
    creator: {type: Schema.Types.ObjectId, ref: 'User', index: true},
    isPublic: {type: Boolean, default:true},
    tags: [String]
});

var SongSchema = new Schema({
    name: {type: String, required: true, index: true, initial: false},
    description: {type: String, required: false, index: false, initial: false},
    creator: {type: Schema.Types.ObjectId, ref: 'User', index: true},
    songTracks: [SongTrackSchema],
    collaborators : [SongCollaboratorSchema],
    dateCreated: {type: Date, default: Date.now},
    lastUpdatedBy: {type: Schema.Types.ObjectId, ref: 'User', index: true},
    lastUpdatedDate: {type: Date, default: Date.now},
    deleted: Boolean,
    isPublic: {type: Boolean, default:true},
    tags: [String]
});

var SongDao = module.exports = {};

/**
 * @deprecated - I think this method can be removed. Need to remove service too. All saving is done through song.
 * @param songId
 * @param collaboratorDto
 * @returns {*}
 */
SongDao.addOrRemoveCollaborators = function(songId, collaboratorDto){

    logger.debug("entered addOrRemove with song id: " + songId + " and collaborator: " + JSON.stringify(collaboratorDto));

    var Song = mongoose.model('Song', SongSchema);
    var deferred = Q.defer();

    Song.findOne({_id : new ObjectId(songId)})
        .exec(function (err, song) {

            if (err) {
                logger.debug(err);
                deferred.reject(err);
            }
            else {
                logger.debug('found song: ' + JSON.stringify(song));

                for(var i = 0; i < song.collaborators.length; i++){
                    if(collaboratorDto.id == song.collaborators[i].user){
                        logger.debug("user with same ID already exists as collaborator");
                        deferred.reject("User already exists as a collaborator");
                        return deferred.promise;
                    }
                }

                song.collaborators.push( {
                    user : new ObjectId(collaboratorDto.id),
                    roles : collaboratorDto.roles
                });

                song.save(function(err, song) {

                    if (err) {
                        logger.debug(err);
                        deferred.reject(err);
                    }
                    else{
                        var dto = dtoMapper.mapSongModel(song);
                        deferred.resolve(dto);
                    }
                });
            }
        });

    return deferred.promise;
};

/**
 * Creates a new song or updates a song based on the songDto passed in
 * @param songDto
 * @returns {*}
 */
SongDao.createOrUpdateSong = function (songDto) {

    logger.debug("entered findOrCreateSong with songDto: " + JSON.stringify(songDto));

    var Song = mongoose.model('Song', SongSchema);
    var deferred = Q.defer();

    var songTracks = [];

    for (var i = 0; i < songDto.tracks.length; i++) {
        logger.debug("adding in track: " + JSON.stringify(songDto.tracks[i]));
        songTracks.push({
            'name': songDto.tracks[i].name,
            'description': songDto.tracks[i].description,
            'tags': songDto.tracks[i].tags,
            'volume': songDto.tracks[i].volume,
            'gain': songDto.tracks[i].gain,
            'position': songDto.tracks[i].position,
            'muted': songDto.tracks[i].muted,
            'creator': ObjectId(songDto.tracks[i].creatorId),
            'fileName': songDto.tracks[i].fileName,
            'originalTrackId' : songDto.tracks[i].originalTrackId,
            'isPublic' : songDto.tracks[i].isPublic
        });
    }

    if (songDto.id != null) {
        //update track
        logger.debug("updating song");

        Song.findOne({_id : new ObjectId(songDto.id)})
            .exec(function (err, song) {

                if (err) {
                    logger.debug(err);
                    deferred.reject(err);
                }
                else {
                    logger.debug('found song: ' + JSON.stringify(song));
                    song.name = (songDto.name || 'newSong');
                    song.description = songDto.description;
                    song.isPublic = songDto.isPublic;
                    song.tags = songDto.tags;
                    song.lastUpdatedBy = new ObjectId(songDto.creatorId);
                    song.lastUpdated = Date.now;
                    song.songTracks = songTracks;

                    //if dto has collaborators
                    if(songDto.collaborators.length){

                        logger.debug("attempt adding: " + songDto.collaborators.length + " collaborators");
                        //create map of current collaborators on song
                        var collaboratorMap = {};
                        for(var i = 0; i < song.collaborators.length; i++){
                            collaboratorMap[song.collaborators[i].user] = song.collaborators[i];
                        }

                        var collaboratorIds = Object.keys(collaboratorMap);

                        //check if the collaborator exists, if not add to song
                        for(var i = 0; i < songDto.collaborators.length; i++){
                            if(collaboratorIds.indexOf(songDto.collaborators[i].id) < 0){

                                logger.debug("adding collaborator: " + songDto.collaborators[i].id);
                                song.collaborators.push( {
                                    user : new ObjectId(songDto.collaborators[i].id),
                                    roles : songDto.collaborators[i].roles
                                });
                            }
                        }

                    }

                    song.save(function(err, song) {

                        if (err) {
                            logger.debug(err);
                            deferred.reject(err);
                        }
                        else{
                            var dto = dtoMapper.mapSongModel(song);
                            deferred.resolve(dto);
                        }
                    });
                }
            });

    }
    else {
        //create new track
        logger.debug("creating song");
        var newSong = new Song({
            'name': (songDto.name || 'newSong'),
            'description' : songDto.description,
            'tags' : songDto.tags,
            'creator': new ObjectId(songDto.creatorId),
            'songTracks': songTracks
        });

        newSong.save(function (err, song) {

            if (err) {
                logger.debug("error saving new song: " + err);
                deferred.reject(err);
            }
            else {
                logger.debug("successfully saved song");
                var songDto = dtoMapper.mapSongModel(song);
                deferred.resolve(songDto);
            }

        });
    }


    return deferred.promise;
};

/**
 *
 * @param userId a user's object ID
 */
SongDao.findUserSongs = function (userId) {

    logger.debug('entered findUserSongs with userId: ' + userId);

    var Song = mongoose.model('Song', SongSchema);
    var deferred = Q.defer();
    var query = {};

    query["creator"] = userId;

    return Song.find(query, function (err, songs) {

        if (err) {
            logger.debug(err);
            deferred.reject(err);
        }
        else {
            logger.debug('found songs: ' + songs.length);
            var dtos = [];
            for(var i = 0; i < songs.length; i++){
                dtos.push(dtoMapper.mapSongModel(songs[i]));
            }
            deferred.resolve(dtos);

        }

    }).exec();

    return deferred.promise;
};

/**
 *
 * @param userId a user's object ID
 */
SongDao.findUserCollaboratorSongs = function (userId) {

    logger.debug('entered findUserSongs with userId: ' + userId);

    var Song = mongoose.model('Song', SongSchema);
    var deferred = Q.defer();
    var query = {};

    query["user"] = userId;

    //User.find().elemMatch("boxes", {"a":"foo","b":"bar"})

    return Song.find().elemMatch("collaborators",query, function (err, songs) {

        if (err) {
            logger.debug(err);
            deferred.reject(err);
        }
        else {
            logger.debug('found songs: ' + songs.length);
            var dtos = [];
            for(var i = 0; i < songs.length; i++){
                dtos.push(dtoMapper.mapSongModel(songs[i]));
            }
            deferred.resolve(dtos);

        }

    }).exec();

    return deferred.promise;
};

/**
 * Get a song by id
 * @param songId
 */
SongDao.getSong = function (songId) {

    logger.debug('entered getSong with songId: ' + songId);

    var Song = mongoose.model('Song', SongSchema);
    var deferred = Q.defer();
    var query = {};

    query["_id"] = mongoose.Types.ObjectId(songId);

    Song.findOne(query)
            .exec(function (err, song) {

        if (err) {
            logger.debug(err);
            deferred.reject(err);
        }
        else {
            logger.debug('found song: ' + JSON.stringify(song));
            var dto = dtoMapper.mapSongModel(song);

            SongDao.addTracksToSong(dto).then(function(songDto){
                deferred.resolve(dto);
            },function(err){
                deferred.reject(err);
            });
        }

    });

    return deferred.promise;
};

/**
 * TODO - Don't believe this is used anywhere
 * @param songId
 * @param user
 */
SongDao.canAddTrack = function (songId, user) {

    SongDao.getSong(songId).then(function(song){
        if(user.id == song.creatorId){
            return true;
        }
        else if(song.collaborators.length > 0){
            for(var i = 0; i < song.collaborators.length; i++){
                if(user.id == song.collaborators[i]._id){

                }
            }
        }
    });
};

/**
 * Associate the original track dto's with the song tracks
 * @param songDto
 */
SongDao.addTracksToSong = function(songDto){

    //execute one query with all the track ids
    var deferred = Q.defer();
    var ids=[];
    var trackRefs={};

    for(var i = 0; i < songDto.tracks.length; i++){
        ids.push(new ObjectId(songDto.tracks[i].originalTrackId));
        trackRefs[songDto.tracks[i].originalTrackId] = songDto.tracks[i];
    }

    trackDao.getListOfTracksById(ids).then(function(trackDtos){

        //associate the results with each song track
        for(var i = 0; i < trackDtos.length; i++){
            trackRefs[trackDtos[i].id].originalTrackDto = trackDtos[i];
        }

        deferred.resolve(songDto);
    },function(err){
        deferred.reject(err);
    });

    return deferred.promise;

};
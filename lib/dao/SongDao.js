/**
 * Song DAO
 */

var Q = require('q');
var keystone = require('keystone');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var ObjectId = require('mongoose').Types.ObjectId;
var dtoMapper = require(APP_LIB + 'util/DtoMapper');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SongTrackSchema = new Schema({
    name: {type: String, required: true, index: true, initial: false},
    volume: {type: Number, default: 5},
    gain: {type: Number, default: 0},
    position: {type: Number, default: 0},
    muted: {type: Boolean, default: false},
    fileName: {type: String, required: true, index: true, initial: false},
    dateCreated: {type: Date, default: Date.now},
    creator: {type: Schema.Types.ObjectId, ref: 'User', index: true}
});

var SongSchema = new Schema({
    name: {type: String, required: true, index: true, initial: false},
    creator: {type: Schema.Types.ObjectId, ref: 'User', index: true},
    songTracks: [SongTrackSchema],
    dateCreated: {type: Date, default: Date.now},
    lastUpdatedBy: {type: Schema.Types.ObjectId, ref: 'User', index: true},
    lastUpdatedDate: {type: Date, default: Date.now},
    deleted: Boolean
});

var SongDao = module.exports = {};

SongDao.createOrUpdateSong = function (songDto) {

    logger.debug("entered findOrCreateSong with songDto: " + JSON.stringify(songDto));

    var Song = mongoose.model('Song', SongSchema);
    var deferred = Q.defer();

    var songTracks = [];

    for (var i = 0; i < songDto.tracks.length; i++) {
        logger.debug("adding in track: " + songDto.tracks[i].name + " with file name: " + songDto.tracks[i].fileName);
        songTracks.push({
            'name': songDto.tracks[i].name,
            'volume': songDto.tracks[i].volume,
            'gain': songDto.tracks[i].gain,
            'position': songDto.tracks[i].position,
            'muted': songDto.tracks[i].muted,
            'creator': new ObjectId(songDto.tracks[i].creatorId),
            'fileName': songDto.tracks[i].fileName
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
                    song.lastUpdatedBy = new ObjectId(songDto.creatorId);
                    song.lastUpdated = Date.now;
                    song.songTracks = songTracks;
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
}

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
}

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
            deferred.resolve(dto);

        }

    });

    return deferred.promise;
}
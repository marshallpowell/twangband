/**
 * Song DAO
 */

var Q = require('q');
var keystone = require('keystone');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SongTrackSchema = new Schema ({
    name: { type: String, required: true, index: true, initial: false },
    volume: { type: Number, default: 5},
    gain: { type: Number, default: 0},
    position: { type: Number, default: 0},
    muted: { type: Boolean, default: false},
    fileName: {type: String, required: true, index: true, initial: false},
    dateCreated: { type: Date, default: Date.now }
});

var SongSchema = new Schema({
    name: { type: String, required: true, index: true, initial: false },
    creator: {type: Schema.Types.ObjectId, ref: 'User', index: true},
    songTracks:   [SongTrackSchema],
    dateCreated: { type: Date, default: Date.now },
    deleted: Boolean
});

var SongDao = module.exports = {};

SongDao.createOrUpdateSong = function(songDto){

    logger.debug("entered findOrCreateSong with songDto: " + JSON.stringify(songDto));

    var Song = mongoose.model('Song', SongSchema);
    var deferred = Q.defer();

    if(songDto.id != null){
        //update track
        logger.debug("updating song");
    }
    else{
        //create new track
        logger.debug("creating song");

        var songTracks = [];

        for(var i = 0; i < songDto.tracks.length; i++){
            songTracks.push({
                'name' : songDto.tracks[i].name,
                'volume' : songDto.tracks[i].volume,
                'gain' : songDto.tracks[i].gain,
                'position' : songDto.tracks[i].position,
                'muted' : songDto.tracks[i].muted,
                'creator' : songDto.tracks[i].creator.id,
                'fileName' : songDto.tracks[i].fileName
            });
        }

        var newSong = new Song({'name' : (songDto.name || 'newSong'), 'creator' : songDto.creator._id, 'songTracks' : songTracks});

        newSong.save(function (err){

            if(err){
                logger.debug("error saving new song: " + err);
                deferred.reject(err);
            }
            else{
                logger.debug("successfully saved song");
                deferred.resolve(newSong);
            }

        });

    }

    return deferred.promise;
}

/**
 *
 * @param userId a user's object ID
 */
SongDao.findUserSongs = function(userId){

    logger.debug('entered findUserSongs with userId: ' + userId);

    var Song = mongoose.model('Song', SongSchema);
    var deferred = Q.defer();
    var query = {};

    query["creator"] = userId;

    return Song.find(query,function (err, songs) {

        if (err) {
            logger.debug(err);
            deferred.reject(err);
        }
        else {
            logger.debug('found songs: ' + songs.length);
            deferred.resolve(songs);

        }

    }).exec();

    return deferred.promise;
}

/**
 * Get a song by id
 * @param songId
 */
SongDao.getSong = function(songId){

    logger.debug('entered getSong with songId: ' + songId);

    var Song = mongoose.model('Song', SongSchema);
    var deferred = Q.defer();
    var query = {};

    query["_id"] = mongoose.Types.ObjectId(songId);

    return Song.findOne(query,function (err, song) {

        if (err) {
            logger.debug(err);
            deferred.reject(err);
        }
        else {
            logger.debug('found song: ' + JSON.stringify(song));
            deferred.resolve(song);

        }

    }).exec();

    return deferred.promise;
}
/**
 * Song DAO
 */

var Q = require('q');
var keystone = require('keystone');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);

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
    lastUpdated: {type: Date, default: Date.now}
});

var SongCollaboratorSchema = new Schema({
    collaborator: {type: Schema.Types.ObjectId, ref: 'User', index: true},
    roles : [String],
    invitationAccepted : {type: Boolean, default: false},
    dateCreated: {type: Date, default: Date.now},
    lastUpdated: {type: Date, default: Date.now}

});

var SongSchema = new Schema({
    name: {type: String, required: true, index: true, initial: false},
    creator: {type: Schema.Types.ObjectId, ref: 'User', index: true},
    collaborators: [SongCollaboratorSchema],
    songTracks: [SongTrackSchema],
    dateCreated: {type: Date, default: Date.now},
    deleted: Boolean
});

var SongDao = module.exports = {};

SongDao.createOrUpdateSong = function (songDto) {

    logger.debug("entered findOrCreateSong with songDto: " + JSON.stringify(songDto));

    var Song = mongoose.model('Song', SongSchema);
    var deferred = Q.defer();

    var songTracks = [];

    for (var i = 0; i < songDto.tracks.length; i++) {
        logger.debug("track fileName: " + songDto.tracks[i].fileName);
        songTracks.push({
            'name': songDto.tracks[i].name,
            'volume': songDto.tracks[i].volume,
            'gain': songDto.tracks[i].gain,
            'position': songDto.tracks[i].position,
            'muted': songDto.tracks[i].muted,
            'fileName': songDto.tracks[i].fileName
        });
    }

    var newSong = {};

    if (songDto.id != null) {
        //update track
        logger.debug("updating song with id: " + songDto.id);

        Song.findOne({_id: songDto.id}, function (err, doc) {

            if (err) {
                deferred.reject(err);
                return deferred.promise;
            }

            doc.name = (songDto.name || 'newSong');
            doc.songTracks = songTracks;
            doc.lastUpdated = Date.now;
            doc.save(function (err) {
                if (err) {
                    deferred.reject(err);
                }
                else {
                    deferred.resolve(doc);
                }
            });
        });

    }
    else {
        logger.debug("creating song");
        newSong = new Song({
            'name': (songDto.name || 'newSong'),
            'creator': songDto.creator._id,
            'songTracks': songTracks
        });

        newSong.save(function (err) {

            if (err) {
                logger.debug("error saving new song: " + err);
                deferred.reject(err);
            }
            else {
                logger.debug("successfully saved song");
                deferred.resolve(newSong);
            }

        });
    }


    return deferred.promise;
}

SongDao.addOrRemoveCollaborators = function(songId, collaboratorDto){

    var Song = mongoose.model('Song', SongSchema);
    var deferred = Q.defer();

    Song.findOne({_id: songId}, function (err, doc) {

        if (err) {
            deferred.reject(err);
            return deferred.promise;
        }

        doc.collaborators.push({
            'collaborator': collaboratorDto.id,
            'roles': collaboratorDto.roles,
            'invitationAccepted' : collaboratorDto.invitationAccepted,
            'lastUpdated': Date.now()
        });

        doc.save(function (err) {
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(doc);
            }
        });
    });
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
            deferred.resolve(songs);

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

    return Song.findOne(query, function (err, song) {

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


var Q = require('q');
var keystone = require('keystone');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var User = keystone.list('users'); // keystone.list('User').model same as mongoose.model('User');
var Track = keystone.list('tracks');
var authUtils = require(APP_LIB+'util/AuthUtils');

var TrackDao = module.exports = {};


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
            'name' : trackDto.name, 'creator' : '54cae45f87bde10e2d57926d', 'encoding' : trackDto.encoding, 'size' : trackDto.size, 'mimetype' : trackDto.mimetype, 'fileName' : trackDto.fileName});

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

}
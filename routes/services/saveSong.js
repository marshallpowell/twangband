var keystone = require('keystone');
var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var songDao = require(APP_LIB + 'dao/SongDao');
var TrackService = require(APP_LIB + 'service/TrackService');

exports = module.exports = function(req, res) {

    //TODO need to do some error catching here (ensure song is wav, not over size limit or too short etc...)
    //thorough error handling should be done upfront to ensure no errors are encountered with persistence in mongo

    //log.debug("saving song tracks : " + JSON.stringify(req.files));
    //log.debug("req.session.id: " + JSON.stringify(req.user));
    //log.debug("req session: " + JSON.stringify(req.session));
    //log.debug("req JSON body.song: " + req.body.song);
    log.debug("enter saveSong with songDto: " + JSON.stringify(req.body.song));

    var songDto = JSON.parse(req.body.song);
    songDto.creatorId = req.user.id;

    //log.debug("saving songDto name: " + songDto.name);
    //log.debug("saving songDto tracks: " + songDto.tracks);
    //log.debug("saving songDto length: " + songDto.tracks.length);


    TrackService.saveNewTracks(req.files, songDto, req.user).then(songDao.createOrUpdateSong).then(function(savedSongDto) {
        log.debug('saved track and song, now respond');
        res.json(savedSongDto);
    },function(err){
        log.debug('error saving song: ' + err);
        res.json({error : err});
    });

};


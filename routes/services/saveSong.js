var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var songDao = require(APP_LIB + 'dao/SongDao');
var trackService = require(APP_LIB + 'service/TrackService');
var validationUtil = require(global.PUBLIC_APP_LIB+'validation/ValidationUtil.js');
var tagValidation = require(global.PUBLIC_APP_LIB+'validation/TagValidation.js');
var songValidation = require(global.PUBLIC_APP_LIB+'validation/SongValidation.js');

exports = module.exports = function (req, res) {

    //TODO need to do some error catching here (ensure song is wav, not over size limit or too short etc...)
    //thorough error handling should be done upfront to ensure no errors are encountered with persistence in mongo

    //log.debug("saving song tracks : " + JSON.stringify(req.files));
    //log.debug("req.session.id: " + JSON.stringify(req.user));
    //log.debug("req session: " + JSON.stringify(req.session));
    //log.debug("req JSON body.song: " + req.body.song);
    log.debug("enter saveSong with songDto: " + JSON.stringify(req.body.song));

    var songDto = JSON.parse(req.body.song);
    songDto.name = validationUtil.escapeHtml(songDto.name);
    songDto.description = validationUtil.escapeHtml(songDto.description);

    var errors = songValidation.validate(songDto);
    errors = errors.concat(tagValidation.validate(songDto.tags));

    if(errors.length){
        log.debug('validation failed when saving song: ' + JSON.stringify(errors));
        res.json({error: errors});
        return;
    }

    //songDto.creatorId = req.user.id;
    songDto._currentUser = req.user;

    log.debug("********************************************* current user: " + JSON.stringify(req.user));

    for(var i = 0; i < songDto.tracks.length; i++){

        if(songDto.tracks[i].originalTrackDto !== undefined){
            songDto.tracks[i].originalTrackDto._currentUser = req.user;
        }

        songDto.tracks[i]._currentUser = req.user;

    }

    //log.debug("saving songDto name: " + songDto.name);
    //log.debug("saving songDto tracks: " + songDto.tracks);
    //log.debug("saving songDto length: " + songDto.tracks.length);


    trackService.updateSongTracks(songDto, req.user)
        .then(songDao.createOrUpdateSong)
        .then(function (savedSongDto) {
            log.debug('saved track and song, now respond');
            res.json(savedSongDto);
        }, function (err) {
            log.debug('error saving song: ' + err);
            res.json({error: err});
        }).catch(function (err) {
            log.debug('exception thrown when saving song: ' + err);
            res.json({error: err});
        });

};


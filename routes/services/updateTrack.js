var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var trackDao = require(APP_LIB + 'dao/TrackDao');
var validationUtil = require(global.PUBLIC_APP_LIB+'validation/ValidationUtil.js');
var trackValidation = require(global.PUBLIC_APP_LIB+'validation/TrackValidation.js');
var tagValidation = require(global.PUBLIC_APP_LIB+'validation/TagValidation.js');

exports = module.exports = function (req, res) {

    log.debug("enter saveTrack with trackDto: " + JSON.stringify(req.body.track));
    var trackDto = JSON.parse(req.body.track);
    var data = {};
    data.errors = [];
    data.errors = data.errors.concat(trackValidation.validate(trackDto));
    data.errors = data.errors.concat(tagValidation.validate(trackDto.tags));

    if(data.errors.length){
        res.json(data);
        return;
    }


    trackDto.name = validationUtil.escapeHtml(trackDto.name);
    trackDto.description = validationUtil.escapeHtml(trackDto.description);
    trackDto._currentUser = req.user;

    trackDao.createOrUpdateTrack(trackDto).then(function(savedTrackDto){
        log.debug('success updating track');
        data.track = savedTrackDto;
        res.json(data);
        return;

    }, function (err) {
        log.error('error saving track: ' + err);
        data.errors.push(err);
        res.json(data);
        return;

    }).catch(function (err) {
        log.error('exception thrown when saving track: ' + err);
        data.errors.push(err);
        res.json(data);
        return;

    });
};
var keystone = require('keystone');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);
var trackDao = require(APP_LIB + 'dao/TrackDao');
var songDao = require(APP_LIB + 'dao/SongDao');
var mv = require('mv');

exports = module.exports = function(req, res) {

    //TODO need to do some error catching here (ensure song is wav, not over size limit or too short etc...)
    //thorough error handling should be done upfront to ensure no errors are encountered with persistence in mongo

    logger.debug("saving song tracks : " + JSON.stringify(req.files));
    logger.debug("req.session.id: " + JSON.stringify(req.user));
    logger.debug("req session: " + JSON.stringify(req.session));
    logger.debug("req JSON body.song: " + req.body.song);
    logger.debug("req JSON song: " + JSON.stringify(req.body.song));

    var songDto = JSON.parse(req.body.song);
    songDto.creatorId = req.user._id;

    logger.debug("saving songDto name: " + songDto.name);
    logger.debug("saving songDto tracks: " + songDto.tracks);
    logger.debug("saving songDto length: " + songDto.tracks.length);


    //add new track data into the song
    for (var key in req.files) {

        var index = parseInt(req.files[key].fieldname.replace("newTrack_", ""));

        //TODO move track to new location or ideally fix multer
        mv('/tmp/'+req.files[key].name, global.UPLOADS_DIR+req.files[key].name, function(err) {
            if(err){
                logger.debug('error uploading file: ' + err);
            }
        });
        //TODO Convert .wav into an MP3


        logger.debug("trackDto before save: " + JSON.stringify(songDto.tracks[index]));

        songDto.tracks[index].fileName = req.files[key].name;
        songDto.tracks[index].size = req.files[key].size;
        songDto.tracks[index].encoding = req.files[key].encoding;
        songDto.tracks[index].mimetype = req.files[key].mimetype;
        songDto.tracks[index].creatorId = req.user._id;

        //save the track
        trackDao.createOrUpdateTrack(songDto.tracks[index]);
    }

    //call dao's save the song and songTracks
    songDao.createOrUpdateSong(songDto);
//TODO return better json response
    //map the request data and uploaded file info to the DTO.
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write({name : "marshall"});
    res.end();

};


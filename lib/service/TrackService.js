var sys = require('sys');
var exec = require('child_process').exec;
var mv = require('mv');
var http = require('http');
var trackDao = require(APP_LIB + 'dao/TrackDao');
var dtoMapper = require(APP_LIB + 'util/DtoMapper');
var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var TrackService = module.exports = {};
var Q = require('q');
var fs = require('fs');


TrackService.createSongFromTracks = function(tracks){


};

/**
 *
 * @param trackName - name of the track to be compressed in the uploads dir
 * @returns {*|promise}
 */
TrackService.callCompressTrack = function(trackName){

    log.debug('enter callCompressTrack');

    if(global.ENV != 'local'){
        return TrackService.compressTrack(trackName);
    }

    var deferred = Q.defer();

    var options = {
        host: process.env.FFMPEG_SERVICE_URL,
        port: process.env.FFMPEG_SERVICE_PORT,
        path: '/compressTrack?track='+trackName,
        method: 'GET'
    };

    log.debug('started compressing '+trackName+ " at: " + new Date().getTime());

    http.request(options, function(res) {
        log.debug('STATUS: ' + res.statusCode);
        log.debug('HEADERS: ' + JSON.stringify(res.headers));
        var jsonResponse='';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            jsonResponse += chunk;
            log.debug('BODY: ' + chunk);

        });
        res.on('end', function(){
            log.debug('=== finished compressing '+trackName+ " at: " + new Date().getTime() + "json response: " + jsonResponse);
            var trackData = JSON.parse(jsonResponse);

            var audioDataDto = dtoMapper.mapFFProbeData(trackData);

            deferred.resolve(audioDataDto);
            TrackService.deleteTrackFile(global.UPLOADS_DIR+trackName);
        })
    }).end();

    return deferred.promise;

};

/**
 * Removes the track from the uploads directory.
 * @param trackName
 */
TrackService.deleteTrackFile = function(pathToTrack){

    fs.unlink(pathToTrack, function (err) {
        if (err) {
            log.debug('error: ' + err);
            log.error('error deleteing track: ' + err);
        }
        else{
            log.debug('succesfully deleted: '+pathToTrack)
        }


    });


};
/**
 *
 * @param trackName
 * @returns {*|promise}
 */
TrackService.compressTrack = function(trackName){

    log.debug('enter compressTrack with trackName:' + trackName);

    var deferred = Q.defer();
    var strippedName = trackName.replace('.wav','');
    var ogg = trackName.replace('.wav', '')+'.ogg';

    var cmd = global.FFMPEG+' -nostdin -i '+global.UPLOADS_DIR+trackName + ' -acodec libvorbis '+global.UPLOADS_DIR+ogg;
    var ffprobeCmd = 'ffprobe -v quiet -print_format json -show_format -show_streams '+global.UPLOADS_DIR+ogg;

    log.debug('=== start compressing '+trackName+ " at: " + new Date().getTime());
    var child = exec(cmd, {timeout: '30000'}, function (error, stdout, stderr) {
        log.debug('=== finished compressing '+trackName+ " at: " + new Date().getTime());

        if (error !== null) {
            log.debug('exec error: ' + error);
            log.debug('stderr: ' + stderr);
            deferred.reject(error);

        }
        else{

            exec(ffprobeCmd, {timeout: '6000'}, function (error, stdout, stderr) {

                if (error !== null) {
                    log.debug('exec error: ' + error);
                    deferred.reject(error);

                }
                else{
                    var data = JSON.parse(stdout);
                    data.name = ogg;
                    deferred.resolve(data);
                    TrackService.deleteTrackFile(global.UPLOADS_DIR+trackName);
                }

            });


        }

    });



    return deferred.promise;

};

/**
 * moves the wav file to the upload dir, compresses the file into ogg and then deletes the wav
 * @param file -- a wav file that is on the request
 * @returns {*|promise}
 */
TrackService.uploadTrack = function(file){
    log.debug('enter uploadTrack with file: '+file.name);
    var deferred = Q.defer();

    mv(global.TEMPDIR+file.name, global.UPLOADS_DIR+file.name, function(err) {

        if(err){
            logger.debug('error uploading file: ' + err);
            deferred.reject(err);
        }
        else{

            //call the compress service
            logger.debug('uploaded track successfully');
            deferred.resolve(file.name)
        }
    });

    return deferred.promise;
};

/**
 * Saves updated tracks (should this simply be done in parallel with saving new tracks)
 * @param songDto
 * @returns {*|promise}
 */
TrackService.updateExistingTracks = function(songDto){

    log.debug('enter updateExistingTracks');
    var deferred = Q.defer();

    //update any track Dto's, if the user is the creator
    for (var i = 0; i < songDto.tracks.length; i++) {

        log.debug("looking to update track: " + JSON.stringify(songDto.tracks[i].originalTrackDto));

        if (!(songDto.tracks[i].originalTrackDto === undefined)) {

            if(songDto.tracks[i].originalTrackDto.creatorId == songDto._currentUser.id){

                trackDao.createOrUpdateTrack(songDto.tracks[i].originalTrackDto);
            }
            else{
                log.debug('***88*******' +songDto.tracks[i].originalTrackDto.creatorId +" != "+ songDto._currentUser.id);
            }

        }
        else{
            log.debug("didn't match criteria for updates user id: " +  + songDto._currentUser.id );
        }

    }

    deferred.resolve(songDto);
    return deferred.promise;
};
/**
 *
 * @param reqFiles - new uploaded wav files
 * @param songDto - the song these tracks belong to
 * @param userDto - the user who created the tracks
 * @returns {*|promise}
 */
TrackService.saveNewTracks = function(reqFiles, songDto, userDto){

    log.debug('enter saveNewTracks');
    var deferred = Q.defer();
    var counter = 0;
    var fileArrayLength = Object.keys(reqFiles).length;

    if(fileArrayLength==0){
        log.debug('no new tracks to save');
        deferred.resolve(songDto);
        return deferred.promise;
    }


    //add new track data into the song
    for (var key in reqFiles) {

        var index = parseInt(reqFiles[key].fieldname.replace("newTrack_", ""));
        ++counter;

        TrackService.uploadTrack(reqFiles[key]).then(TrackService.callCompressTrack).then(function(mediaDataDto){

                log.debug("compressed track name: " + mediaDataDto.fileName + ' counter is: '+ counter);

            //TODO need to get real track info after compression, or just remove attributes

            songDto.tracks[index].fileName = mediaDataDto.fileName;
            songDto.tracks[index].size = mediaDataDto.size;
            songDto.tracks[index].formatName = mediaDataDto.formatName;
            songDto.tracks[index].startTime = mediaDataDto.startTime;
            songDto.tracks[index].duration = mediaDataDto.duration;
            songDto.tracks[index].bitRate = mediaDataDto.bitRate;
            songDto.tracks[index].codecName = mediaDataDto.codecName;
            songDto.tracks[index].codecType = mediaDataDto.codecType;
            songDto.tracks[index].sampleFormat = mediaDataDto.sampleFormat;
            songDto.tracks[index].sampleRate = mediaDataDto.sampleRate;
            songDto.tracks[index].numberOfChannels = mediaDataDto.numberOfChannels;
            songDto.tracks[index].channelLayout = mediaDataDto.channelLayout;

log.debug("new track to save: " + JSON.stringify(songDto.tracks[index]));
                //save the track
                trackDao.createOrUpdateTrack(songDto.tracks[index]).then(function(trackDto){
log.debug("***** setting originalTrackId  to " + trackDto.id);
                    songDto.tracks[index].originalTrackId = trackDto.id;
                    songDto.tracks[index].creatorId = userDto.id;

                    if(counter == fileArrayLength){
                        log.debug('should be done with tracks...');
                        deferred.resolve(songDto);
                    }

                },function(err){ deferred.reject(err);});


            },function(err){
                console.debug("error: " + err);
                deferred.reject(err);
            }
        );


    }

    return deferred.promise;

};


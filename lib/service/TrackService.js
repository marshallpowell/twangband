
var exec = require('child_process').exec;
var mv = require('mv');
var http = require('http');
var trackDao = require(APP_LIB + 'dao/TrackDao');
var dtoMapper = require(APP_LIB + 'util/DtoMapper');
var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var textSanitizerUtil = require(APP_LIB + 'util/TextSanitizerUtil');

var TrackService = module.exports = {};
var Q = require('q');
var fs = require('fs');
var _ = require('underscore');
var crypto = require('crypto');



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
 * runs:
 * ffmpeg cmd: ffmpeg -nostdin -ss 0.03272108843537415 \
 * -i /Users/marshallpowell/dev/musicilo2/uploads/572be7a97650f6a5eeecc1aa_570535e8c69f32903665acb1_20160505083913.wav \
 * -c:a libfdk_aac -vbr 3 /Users/marshallpowell/dev/musicilo2/uploads/572be7a97650f6a5eeecc1aa_570535e8c69f32903665acb1_20160505083913.m4a
 *
 * ffprobeCmd:
 * ffprobe -v quiet -print_format json -show_format -show_streams /Users/marshallpowell/dev/musicilo2/uploads/572be7a97650f6a5eeecc1aa_570535e8c69f32903665acb1_20160505083913.m4a
 *
 * mapFFProbeData: {"streams":[{"index":0,"codec_name":"aac","codec_long_name":"AAC (Advanced Audio Coding)","profile":"LC","codec_type":"audio","codec_time_base":"1/44100","codec_tag_string":"mp4a","codec_tag":"0x6134706d","sample_fmt":"fltp","sample_rate":"44100","channels":1,"channel_layout":"mono","bits_per_sample":0,"r_frame_rate":"0/0","avg_frame_rate":"0/0","time_base":"1/44100","start_pts":-2048,"start_time":"-0.046440","duration_ts":2142813,"duration":"48.589864","bit_rate":"78109","max_bit_rate":"78109","nb_frames":"2093","disposition":{"default":1,"dub":0,"original":0,"comment":0,"lyrics":0,"karaoke":0,"forced":0,"hearing_impaired":0,"visual_impaired":0,"clean_effects":0,"attached_pic":0},"tags":{"language":"und","handler_name":"SoundHandler"}}],"format":{"filename":"/Users/marshallpowell/dev/musicilo2/uploads/572be7a97650f6a5eeecc1aa_570535e8c69f32903665acb1_20160505083913.m4a","nb_streams":1,"nb_programs":0,"format_name":"mov,mp4,m4a,3gp,3g2,mj2","format_long_name":"QuickTime / MOV","start_time":"-0.046440","duration":"48.590000","size":"483537","bit_rate":"79610","probe_score":100,"tags":{"major_brand":"M4A ","minor_version":"512","compatible_brands":"isomiso2","encoder":"Lavf57.25.100"}},"name":"572be7a97650f6a5eeecc1aa_570535e8c69f32903665acb1_20160505083913.m4a"}


 * @param trackName
 * @returns {*|promise}
 */
TrackService.compressTrack = function(trackName, latency){

    log.debug('enter compressTrack with trackName:' + trackName);

    var deferred = Q.defer();
    var strippedName = trackName.replace('.wav','');
    //var ogg = trackName.replace('.wav', '')+'.ogg';
    var ogg = trackName.replace('.wav', '')+'.m4a';

    var latencyOption='';

    if(latency){
        latency = parseFloat(latency);

        if(latency == NaN){
            latency = 0.0808390022675737; //not sure if this will ever get called
        }
        latency += .075;//0.1188390022675737;//0022675737; (.048 diff)
        latencyOption= '-ss '+latency + ' '; //my machine latency: 0.0708390022675737
    }
    //var cmd = 'ffmpeg -nostdin '+latencyOption+'-i '+process.env.UPLOADS_DIR+trackName + ' -acodec libvorbis -qscale:a 5 '+process.env.UPLOADS_DIR+ogg;
    var cmd = 'ffmpeg -nostdin '+latencyOption+'-i '+process.env.UPLOADS_DIR+trackName + ' -c:a libfdk_aac -b:a 128k -vbr 3 '+process.env.UPLOADS_DIR+ogg;

    var ffprobeCmd = 'ffprobe -v quiet -print_format json -show_format -show_streams '+process.env.UPLOADS_DIR+ogg;

    log.debug('ffmpeg cmd: ' + cmd);
    log.debug('ffprobeCmd: ' + ffprobeCmd);
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

                    var trackData = JSON.parse(stdout);
                    trackData.name = ogg;
                    var audioDataDto = dtoMapper.mapFFProbeData(trackData);
                    deferred.resolve(audioDataDto);
                    TrackService.deleteTrackFile(process.env.UPLOADS_DIR+trackName);
                }

            });


        }

    });



    return deferred.promise;

};



/**
 * Merges tracks into a mixed song
 * @param trackDtos
 */
TrackService.mergeTracks=function(trackDtos){

    log.debug('enter mergeTracks');

    var deferred = Q.defer();
    var current_date = (new Date()).valueOf().toString();
    //var songFileName = crypto.createHash('sha1').update(current_date+Math.random().toString()).digest('hex')+'.ogg';
    var songFileName = crypto.createHash('sha1').update(current_date+Math.random().toString()).digest('hex')+'.m4a';
    log.debug('songFileName: '+songFileName);

    //var sortedTracks = _.sortBy(trackDtos, 'duration' ).reverse();
    var data = {};
    data.tracks=trackDtos;
    data.name=songFileName;

    //start ffmpeg

    var inputTracksCmd='';
    var inputFilterCmd='';
    var labelsCmd='';
    var trackDuration;
    var duration=0;
    for(var i = 0; i < data.tracks.length; i++){

        var label = '[track'+i+']';
        inputTracksCmd += ' -i '+process.env.UPLOADS_DIR+data.tracks[i].originalTrackDto.fileName;

        inputFilterCmd += '[' +i+':a]volume='+data.tracks[i].volume+label+';';
        labelsCmd += label;
        trackDuration = data.tracks[i].originalTrackDto.duration;
        duration = (trackDuration > duration) ? trackDuration : duration;
    }

    /*
     ffmpeg  -i track1.m4a -i track2.m4a -i /Users/marshallpowell/dev/musicilo2/uploads/572748cc28c2ba6b154d9dce_570535e8c69f32903665acb1_20160502104553.m4a  -filter_complex "[0:a]volume=1[track0];[1:a]volume=0.03[track1];[2:a]volume=1[track2]; [track0][track1][track2] amix=inputs=3" -t 9.331 /Users/marshallpowell/dev/musicilo2/uploads/95e81be89f1a4793f6d0c39c10e3e7d5224533bd.m4a
     */


    var ffmpegMergeCMD = 'ffmpeg ' +inputTracksCmd+'  -filter_complex "'+inputFilterCmd+' '+labelsCmd+' amix=inputs='+data.tracks.length+'" -t '+duration +' '+process.env.UPLOADS_DIR+data.name;
    log.debug('ffmpegMergeCMD: ' + ffmpegMergeCMD);
    var ffprobeCmd = 'ffprobe -v quiet -print_format json -show_format -show_streams '+process.env.UPLOADS_DIR+data.name;

    var child = exec(ffmpegMergeCMD, {timeout: '12000'}, function (error, stdout, stderr) {

       log.debug('finished ogg');
       log.debug('stdout: ' + stdout);
       log.debug('stderr: ' + stderr);

        if (error !== null) {
           log.debug('exec error: ' + error);
            res.json({'error' : error});

        }
        else{
            exec(ffprobeCmd, {timeout: '6000'}, function (error, stdout, stderr) {

                if (error !== null) {
                   log.debug('exec error: ' + error);
                    deferred.reject(error);

                }
                else{
                    log.debug("ffprobe command successfull: " + stdout);
                    var data = JSON.parse(stdout);
                    data.name=songFileName;
                    var audioDataDto = dtoMapper.mapFFProbeData(data);
                    deferred.resolve(audioDataDto);
                }

            });

        }

    });
    //end ffmpeg


    return deferred.promise;
};

TrackService.handleError = function(error){
  log.debug('handleError: ' + JSON.stringify(error));
    throw error;
};

TrackService.removeTracks=function(trackDtos, songDto){
    log.debug("enter removeTracks");
    trackDao.removeTracks(trackDtos, songDto.id);
};



/**
 *
 * @param songDto - the song these tracks belong to
 * @param userDto - the user who created the tracks
 * @returns {*|promise}
 */
TrackService.updateSongTracks = function(songDto, userDto){

    log.debug('enter updateSongTracks');
    var deferred = Q.defer();

    var tracksToRemove = [];
    var tracksToKeep = [];


    for (var i = 0; i < songDto.tracks.length; i++) {

        if (songDto.tracks[i].removed) {
            tracksToRemove.push(songDto.tracks[i].originalTrackDto);
        }
        else{
            tracksToKeep.push(songDto.tracks[i]);
        }
    }

    for (var i = 0; i < tracksToKeep.length; i++) {
        var trackDto = tracksToKeep[i].originalTrackDto;
        TrackService.updateTrackSearch(trackDto, songDto);
    }


    var updatedTracksSize = (songDto.tracks.length - tracksToRemove.length);

    //if removed tracks then remove
    if(tracksToRemove.length > 0){

        //TODO should only remove track if the dao remove was successful
        log.debug("we have tracks to remove");

        TrackService.removeTracks(tracksToRemove, songDto);
    }
    //if no new files and tracks.size > 0 then re-mix
    if(updatedTracksSize > 0){
        //merge and return
        log.debug("no new tracks added, but tracks were removed, need to re-mix");
        TrackService.mergeTracks(tracksToKeep).then(function (mediaDataDto) {
            dtoMapper.mapMediaMetaData(songDto, mediaDataDto);
            deferred.resolve(songDto);
        });

        return deferred.promise;
    }
    else if(updatedTracksSize == 0){
        //remove song fileName
        log.debug("all tracks were removed, remove the song file");
        songDto.fileName='';
        deferred.resolve(songDto);
        return deferred.promise;
    }


    return deferred.promise;

};

/**
 * adds or updates a track and updates the track search
 * @param trackDto
 * @param songDto (optional)
 */
TrackService.createOrUpdateTrack = function(trackDto, songDto){

    var deferred = Q.defer();

    if(songDto){

        trackDto.songIds = [];
        trackDto.songIds.push(songDto.id);
        trackDto.songKeywords = [];
        trackDto.songKeywords = trackDto.songKeywords.concat(textSanitizerUtil.getKeywords(songDto.name));
        trackDto.songKeywords = trackDto.songKeywords.concat(textSanitizerUtil.getKeywords(songDto.description));
        trackDto.songKeywords = trackDto.songKeywords.concat(songDto.tags);

    }

    trackDao.createOrUpdateTrack(trackDto).then(function(savedTrackDto){

        log.debug('success updating track');
        deferred.resolve(savedTrackDto);

        if(songDto){
            TrackService.updateTrackSearch(savedTrackDto, songDto);
        }


    }, function (err) {
        log.error('error saving track: ' + err);

        deferred.error(err);

    }).catch(function (err) {
        log.error('exception thrown when saving track: ' + err);
        deferred.error(err);

    });

    return deferred.promise;
};

/**
 * updates the track search data with trackDto info
 * @param trackDto
 */
TrackService.updateTrackSearch = function(trackDto, songDto){

    log.debug('enter updateTrackSearch');

    if(songDto){

        trackDto.songIds = [];
        trackDto.songIds.push(songDto.id);
        trackDto.songKeywords = [];
        trackDto.songKeywords = trackDto.songKeywords.concat(textSanitizerUtil.getKeywords(songDto.name));
        trackDto.songKeywords = trackDto.songKeywords.concat(textSanitizerUtil.getKeywords(songDto.description));
        trackDto.songKeywords = trackDto.songKeywords.concat(songDto.tags);

        trackDao.updateSearch(trackDto);
    }

};




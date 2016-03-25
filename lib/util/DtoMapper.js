/**
 * Created by mpowell on 6/3/2015.
 */

var DtoMapper = module.exports = {};
var SongDto = require(global.PUBLIC_APP_LIB+'models/SongDto.js');
var UserDto = require(global.PUBLIC_APP_LIB+'models/UserDto.js');
var SongTrackDto = require(global.PUBLIC_APP_LIB+'models/SongTrackDto.js');
var TrackDto = require(global.PUBLIC_APP_LIB+'models/TrackDto.js');
var SongCollaboratorDto = require(global.PUBLIC_APP_LIB+'models/SongCollaboratorDto.js');
var MediaDataDto = require(global.PUBLIC_APP_LIB+'models/MediaDataDto.js');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);

DtoMapper.mapTrackModel=function(track){

    var dto = new TrackDto();

    if(track==null){
        return dto;
    }

    dto.id = track._id;
    dto.uiId = '_uiId_'+dto.id;
    dto.name = track.name || 'track';
    dto.description = track.description || '';
    dto.creatorId = track.creator;
    dto.dateCreated = track.dateCreated;
    dto.fileName = track.fileName;
    dto.tags= track.tags;

    dto.formatName = track.formatName;
    dto.duration = track.duration;
    dto.size = track.size;
    dto.bitRate = track.bitRate;
    dto.codecName = track.codecName;
    dto.codecType = track.codecType;
    dto.sampleFormat = track.sampleFormat;
    dto.sampleRate = track.sampleRate;
    dto.numberOfChannels = track.numberOfChannels;
    dto.channelLayout = track.channelLayout;

    return dto;
};
/**
 * TODO consider adding a second argument for the tracks that are associated with the song.
 * Maps a Song Model into a DTO
 * @param song
 * @returns {*}
 */
DtoMapper.mapSongModel=function(song){

    var dto = new SongDto();

    if(song==null){
        return dto;
    }

    //log.debug("mapping song " + JSON.stringify(song));

    dto.name = song.name;
    dto.fileName = song.fileName;
    dto.description = song.description  || '';
    dto.isPublic = song.isPublic;
    dto.tags = (song.tags != null)? song.tags : [];
    dto.id = song._id;
    dto.creatorId = song.creator;
    dto.dateCreated = song.dateCreated;
    dto.lastUpdated = song.lastUpdated;
    dto.tracks = [];

    dto.formatName = song.formatName;
    dto.duration = song.duration;
    dto.size = song.size;
    dto.bitRate = song.bitRate;
    dto.codecName = song.codecName;
    dto.codecType = song.codecType;
    dto.sampleFormat = song.sampleFormat;
    dto.sampleRate = song.sampleRate;
    dto.numberOfChannels = song.numberOfChannels;
    dto.channelLayout = song.channelLayout;
    
    for(var i = 0; i < song.songTracks.length; i++){

        var songTrackDto = new SongTrackDto();
        songTrackDto.uiId = '_uiId_'+song.songTracks[i].originalTrackId;
        songTrackDto.originalTrackId = song.songTracks[i].originalTrackId;
        songTrackDto.originalTrackCreatorId = (song.songTracks[i].originalTrackCreatorId) ? song.songTracks[i].originalTrackCreatorId : 0;
        songTrackDto.name = song.songTracks[i].name  || 'track';
        songTrackDto.isPublic = song.songTracks[i].isPublic;
        //songTrackDto.fileName = song.songTracks[i].fileName;
        songTrackDto.volume = song.songTracks[i].volume;
        songTrackDto.gain = song.songTracks[i].gain;
        songTrackDto.position = song.songTracks[i].position;
        songTrackDto.description = song.songTracks[i].description  || '';
        songTrackDto.dateCreated = song.songTracks[i].dateCreated;
        songTrackDto.lastUpdated = song.songTracks[i].lastUpdated;
        songTrackDto.updatedById = song.songTracks[i].updatedBy;
        songTrackDto.creatorId = song.songTracks[i].creator;
        songTrackDto.tags = song.songTracks[i].tags || [];

        dto.tracks.push(songTrackDto);
    }


    for(var i = 0; i < song.collaborators.length; i++){
        var collaboratorDto = new SongCollaboratorDto();
        collaboratorDto.id = song.collaborators[i].user;
        collaboratorDto.roles = song.collaborators[i].roles;
        collaboratorDto.invitationAccepted = song.collaborators[i].invitationAccepted;
        collaboratorDto.dateCreated = song.collaborators[i].dateCreated;
        collaboratorDto.lastUpdated = song.collaborators[i].lastUpdated;
        dto.collaborators.push(collaboratorDto);
    }

    dto.allTags = song.allTags || [];
    dto.allMusicians = song.allMusicians;

    logger.debug("finished mapping song DTO " + JSON.stringify(dto));
    return dto;

};

DtoMapper.mapFFProbeData = function(probeData){

    logger.debug("enter mapFFProbeData: " + JSON.stringify(probeData));

    var dto = new MediaDataDto();
    dto.fileName = probeData.name;
    dto.formatName = probeData.format.format_name;
    dto.duration = probeData.format.duration;
    dto.size = probeData.format.size;
    dto.bitRate = probeData.format.bit_rate;

    dto.codecName = probeData.streams[0].codec_name;
    dto.codecType = probeData.streams[0].codec_type;
    dto.sampleFormat = probeData.streams[0].sample_fmt;
    dto.sampleRate = probeData.streams[0].sample_rate;
    dto.numberOfChannels = probeData.streams[0].channels;
    dto.channelLayout = probeData.streams[0].channel_layout;

    logger.debug("AuditoDataDto mapped: " + JSON.stringify(dto));

    return dto;

    /*
     "streams": [
     {
     "index": 0,
     "codec_name": "vorbis",
     "codec_type": "audio",
     "codec_time_base": "1/44100",
     "codec_tag_string": "[0][0][0][0]",
     "codec_tag": "0x0000",
     "sample_fmt": "fltp",
     "sample_rate": "44100",
     "channels": 2,
     "channel_layout": "stereo",
     "bits_per_sample": 0,
     "r_frame_rate": "0/0",
     "avg_frame_rate": "0/0",
     "time_base": "1/44100",
     "start_pts": 0,
     "start_time": "0.000000",
     "duration_ts": 69632,
     "duration": "1.578957",
     "bit_rate": "112000",
     "disposition": {
     "default": 0,
     "dub": 0,
     "original": 0,
     "comment": 0,
     "lyrics": 0,
     "karaoke": 0,
     "forced": 0,
     "hearing_impaired": 0,
     "visual_impaired": 0,
     "clean_effects": 0,
     "attached_pic": 0
     },
     "tags": {
     "ENCODER": "Lavc56.60.100 libvorbis"
     }
     }
     ],
     "format": {
     "filename": "/tmp/workdir/uploads/5f6ff1be6bedc781da48bc7d8ec8be21.ogg",
     "nb_streams": 1,
     "nb_programs": 0,
     "format_name": "ogg",
     "start_time": "0.000000",
     "duration": "1.578957",
     "size": "20684",
     "bit_rate": "104798",
     "probe_score": 100
     },
     "name": "5f6ff1be6bedc781da48bc7d8ec8be21.ogg"
     */
};

/**
 * @param targetDto (songDto or trackDto)
 * @param mediaDataDto
 */
DtoMapper.mapMediaMetaData=function(targetDto, mediaDataDto){

    logger.debug("enter mapMediaMetaData: " + JSON.stringify(mediaDataDto));
    targetDto.fileName = mediaDataDto.fileName;
    targetDto.size = mediaDataDto.size;
    targetDto.formatName = mediaDataDto.formatName;
    targetDto.startTime = mediaDataDto.startTime;
    targetDto.duration = mediaDataDto.duration;
    targetDto.bitRate = mediaDataDto.bitRate;
    targetDto.codecName = mediaDataDto.codecName;
    targetDto.codecType = mediaDataDto.codecType;
    targetDto.sampleFormat = mediaDataDto.sampleFormat;
    targetDto.sampleRate = mediaDataDto.sampleRate;
    targetDto.numberOfChannels = mediaDataDto.numberOfChannels;
    targetDto.channelLayout = mediaDataDto.channelLayout;

    return targetDto;
};

/**
 * creates a UserDto from a user schema
 * @param user
 * @returns {UserDto}
 */
DtoMapper.mapUserModel=function(user){

    var userDto = new UserDto();

    if(user == null){
        return userDto;
    }

    userDto.firstName = user.firstName;
    userDto.lastName = user.lastName;
    userDto.email = user.email;
    userDto.id = user._id;
    userDto.profilePic = user.profilePic;
    userDto.instruments = user.instruments;
    userDto.tags = user.tags;

    return userDto;
};


/**
 * Created by mpowell on 6/3/2015.
 */

var DtoMapper = module.exports = {};
var SongDto = require(global.PUBLIC_APP_LIB+'models/SongDto.js');
var SongTrackDto = require(global.PUBLIC_APP_LIB+'models/SongTrackDto.js');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);

/**
 * Maps a Song Model into a DTO
 * @param song
 * @returns {*}
 */
DtoMapper.mapSongModel=function(song){

    logger.debug("mapping song " + song.name);
    var dto = new SongDto();
    dto.name = song.name;
    dto.id = song._id;
    dto.creatorId = song.creator._id;
    dto.dateCreated = song.dateCreated;
    dto.lastUpdated = song.lastUpdated;
    dto.tracks = [];
    
    for(var i = 0; i < song.songTracks.length; i++){
        logger.debug("mapping song track" + song.songTracks[i].name);
        var songTrackDto = new SongTrackDto();
        songTrackDto.name = song.songTracks[i].name;
        songTrackDto.fileName = song.songTracks[i].fileName;
        songTrackDto.volume = song.songTracks[i].volume;
        songTrackDto.gain = song.songTracks[i].gain;
        songTrackDto.position = song.songTracks[i].position;
        songTrackDto.description = song.songTracks[i].description;
        songTrackDto.dateCreated = song.songTracks[i].dateCreated;
        songTrackDto.lastUpdated = song.songTracks[i].lastUpdated;
        songTrackDto.updatedById = song.songTracks[i].updatedBy;
        songTrackDto.creatorId = song.songTracks[i].creator._id;
        dto.tracks.push(songTrackDto);
    }

    return dto;

}
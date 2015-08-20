/**
 * Created by mpowell on 6/3/2015.
 */

var DtoMapper = module.exports = {};
var SongDto = require(global.PUBLIC_APP_LIB+'models/SongDto.js');
var UserDto = require(global.PUBLIC_APP_LIB+'models/UserDto.js');
var SongTrackDto = require(global.PUBLIC_APP_LIB+'models/SongTrackDto.js');
var SongCollaboratorDto = require(global.PUBLIC_APP_LIB+'models/SongCollaboratorDto.js');
var logger = require(APP_LIB + 'util/Logger').getLogger(__filename);

/**
 * Maps a Song Model into a DTO
 * @param song
 * @returns {*}
 */
DtoMapper.mapSongModel=function(song){

    logger.debug("mapping song " + JSON.stringify(song));

    var dto = new SongDto();
    dto.name = song.name;
    dto.description = song.description;
    dto.id = song._id;
    dto.creatorId = song.creator;
    dto.dateCreated = song.dateCreated;
    dto.lastUpdated = song.lastUpdated;
    dto.tracks = [];
    
    for(var i = 0; i < song.songTracks.length; i++){

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
        songTrackDto.creatorId = song.songTracks[i].creator;

        logger.debug("mapping song track " + JSON.stringify(songTrackDto) + " from " + JSON.stringify(song.songTracks[i]));
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

    return dto;

}

/**
 * creates a UserDto from a user schema
 * @param user
 * @returns {UserDto}
 */
DtoMapper.mapUserModel=function(user){

    logger.debug("mapping user: " + JSON.stringify(user));

    var userDto = new UserDto();
    userDto.firstName = user.name.first;
    userDto.lastName = user.name.last;
    userDto.email = user.email;
    userDto.id = user._id;
    userDto.instruments = user.instruments;

    return userDto;
}
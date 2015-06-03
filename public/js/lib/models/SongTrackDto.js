/**
 * Created by mpowell on 4/16/2015.
 */

/**
 * DTO is used to represent the track within a SongDTO
 * This captures the actual Track - TrackDto
 * And captures the Track's attributes within the song
 */
var method = SongTrackDto.prototype;

function SongTrackDto(){

    this.name;
    this.trackDto;
    this.volume;
    this.gain;
    this.position;
    this.loop;
    this.description;
    this.dateCreated;
    this.lastUpdated;
    this.updatedById;
    this.creatorId;
    this.delete;
}

if(module.exports) {
    module.exports = SongTrackDto;
}
/**
 * Created by mpowell on 4/16/2015.
 */

/**
 *
 * DTO is used to represent the track within a SongDTO
 * This captures the actual Track - TrackDto
 * And captures the Track's attributes within the song
 */
var method = SongTrackDto.prototype;

function SongTrackDto(){

    this.name='';
    this.originalTrackId=null;
    this.originalTrackDto={};
    this.volume=10;
    this.gain=9;
    this.position;
    this.loop;
    this.description;
    this.dateCreated;
    this.lastUpdated;
    this.updatedById;
    this.creatorId;
    this.removed;
    this.tags=[];

    this._currentUser;
}

try{module.exports = SongTrackDto;} catch(err){}
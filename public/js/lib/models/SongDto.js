/**
 * Created by mpowell on 6/4/2015.
 */

var method = SongDto.prototype;

function SongDto(){
    
    this.name;
    this.description;
    this.id=null;
    this.tracks = [];
    this.collaborators = [];
    this.creatorId;
    this.dateCreated;
    this.lastUpdatedBy;
    this.lastUpdated;
    this.delete; //TODO
    this.isPublic=true;
    this.tags=[];

    this._currentUser; //_ = transient

}

try{module.exports = SongDto;} catch(err){}


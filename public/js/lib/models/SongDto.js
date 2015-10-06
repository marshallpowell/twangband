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
    this.lastUpdated;
    this.delete; //TODO
    this.isPublic=true;
    this.tags=[];

}

try{module.exports = SongDto;} catch(err){}


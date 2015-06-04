/**
 * Created by mpowell on 6/4/2015.
 */

var method = SongDto.prototype;

function SongDto(){
    this.name;
    this.description;
    this.id=null;
    this.tracks = [];
    this.creatorId;
    this.dateCreated;
    this.lastUpdated;
    this.delete; //TODO

}

if(module.exports) {
    module.exports = SongDto;
}


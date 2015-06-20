
var method = SongCollaboratorDto.prototype;

function SongCollaboratorDto(){
    this.id;
    this.roles=[];
    this.invitationAccepted=false;
    this.dateCreated;
    this.lastUpdated;

    this.imgUrl=null;


}

try{module.exports = SongCollaboratorDto;} catch(err){}

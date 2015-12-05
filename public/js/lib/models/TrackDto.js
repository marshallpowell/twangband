
var method = TrackDto.prototype;

function TrackDto(){

    this.id=null;
    this.name;
    this.description;
    this.blobData;
    this.creatorId;
    this.dateCreated;
    this.viewOrder;
    this.tags=[];

    //transient properties
    this.uiId;
    this.trackMixer;
    this.removed;
    this._currentUser={};

    //from View Track
    this.peaks;
    this.volume = 1;
    this.panning;
    this.muted = false;
    this.solo = false;

    //properties from a newly uploaded track
    this.mimetype;
    this.encoding;
    this.size;
    this.fileName;




}

try{module.exports = TrackDto;} catch(err){}

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
    this.removed; //TODO
    this.isPublic=true;
    this.tags=[];
    this.allTags=[];
    this.allMusicians=[];

    this._currentUser; //_ = transient

    //media info
    this.fileName;
    this.size;
    this.formatName;
    this.startTime;
    this.duration;
    this.bitRate;
    this.codecName;
    this.codecType;
    this.sampleFormat;
    this.sampleRate;
    this.numberOfChannels;
    this.channelLayout;

}

try{module.exports = SongDto;} catch(err){}
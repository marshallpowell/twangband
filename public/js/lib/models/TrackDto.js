
var method = TrackDto.prototype;

function TrackDto(){

    this.id=null;
    this.name='';
    this.description='';
    this.blobData;
    this.creatorId;
    this.dateCreated;
    this.viewOrder;
    this.isPublic=true;
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

try{module.exports = TrackDto;} catch(err){}

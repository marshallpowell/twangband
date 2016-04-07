
var method = TrackDto.prototype;

function TrackDto(){

    this.id=null;
    this.name='';
    this.description='';
    this.blobData;
    this.creatorId;
    this.dateCreated;

    this.isPublic=true;
    this.tags=[];
    this.songIds=[];

    //transient properties
    this.uiId;
    this.trackMixer;
    this.removed;
    this._currentUser={};

    //from View Track
    //TODO these properties should probably be removed as they are only set on the SongTrack
    this.viewOrder;
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

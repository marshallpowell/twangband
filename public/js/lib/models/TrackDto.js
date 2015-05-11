
function TrackDto(){

    this.id=null;
    this.name;
    this.blobData;
    this.creator;
    this.dateCreated;
    this.viewOrder;

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
    this.delete; //TODO

}

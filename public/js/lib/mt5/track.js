//TODO fix this to just take in a trackDto, or just use track DTO
function Track(songName, trackDto) {

    this.creatorId = trackDto.creatorId
    // name of the track : bass, guitar, voice, etc.
    this.name = trackDto.name;
    // url of the track in the form http://.../track/track_name
    this.fieldName = trackDto.fileName;
    // decoded audio buffer
    this.decodedBuffer;
    // peaks for drawing the sample
    this.peaks;
    // current volume
    this.volume = 1;
    // current left/right panning
    this.panning;
    // muted / non muted state
    this.muted = false;
    // solo mode ?
    this.solo = false;

    // the web audio nodes that compose this track
    this.sampleNode;
    // volume for this track
    this.volumeNode;
}

function LocalTrack(name) {
    // name of the track : bass, guitar, voice, etc.
    this.name = 'newrecording';
    // url of the track in the form http://.../track/track_name
    this.url = "local/"+name;
    // decoded audio buffer
    this.decodedBuffer;
    // peaks for drawing the sample
    this.peaks;
    // current volume
    this.volume = 1;
    // current left/right panning
    this.panning;
    // muted / non muted state
    this.muted = false;
    // solo mode ?
    this.solo = false;

    // the web audio nodes that compose this track
    this.sampleNode;
    // volume for this track
    this.volumeNode;

    //new attribute for new tracks WAV data to persisist
    this.blob;

    this.type = "audio/wav";
}

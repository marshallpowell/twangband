var method = RecordingDto.prototype;

function RecordingDto(userId, songId, latency){
    this.userId = userId;
    this.songId = songId;
    this.latency = latency;
}

try{module.exports = RecordingDto;} catch(err){}

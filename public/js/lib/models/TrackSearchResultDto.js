var method = TrackSearchResultDto.prototype;

function TrackSearchResultDto(){

    this.track;
    this.musicians=[];
    this.tags=[];
    this.creator;
    this.songs=[];//SmallSongSearchResultDto


}

try{module.exports = TrackSearchResultDto;} catch(err){}
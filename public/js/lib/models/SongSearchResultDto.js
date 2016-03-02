var method = SongSearchResultDto.prototype;

function SongSearchResultDto(){

    this.song;
    this.musicians=[];
    this.tags=[];
    this.creator;


}

try{module.exports = SongSearchResultDto;} catch(err){}
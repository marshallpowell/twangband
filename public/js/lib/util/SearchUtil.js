SearchUtil={};

SearchUtil.searchByTags = function(tag){
    var param = encodeURIComponent(tag);
    window.location.href='/music?search=songs&tags='+param;
};

SearchUtil.searchByKeywords = function(keywords){
    var param = encodeURIComponent(keywords);
    console.log('take me to: '+'/music?search=keyword&keywords='+param);
    window.location.href='/music?search=songs&keywords='+param;
};

SearchUtil.searchTracksByKeywords = function(keywords){
    var param = encodeURIComponent(keywords);
    console.log('take me to: '+'/music?search=keyword&keywords='+param);
    window.location.href='/music?search=tracks&keywords='+param;
};

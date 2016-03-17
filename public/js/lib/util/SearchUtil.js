SearchUtil={};

SearchUtil.searchByTags = function(tag){
    var param = encodeURIComponent(tag);
    window.location.href='/song/user?search=keyword&tags='+param;
};

SearchUtil.searchByKeywords = function(keywords){
    var param = encodeURIComponent(keywords);
    console.log('take me to: '+'/song/user?search=keyword&keywords='+param);
    window.location.href='/song/user?search=keyword&keywords='+param;
};

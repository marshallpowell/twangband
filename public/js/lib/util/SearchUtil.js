SearchUtil={};

SearchUtil.searchByTags = function(tag){
    var param = encodeURIComponent(tag);
    window.location.href='/song/user?search=keyword&tags='+tag;
};

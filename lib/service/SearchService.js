var Q = require('q');
var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var userDao = require(APP_LIB + 'dao/UserDao');
var SongSearchResultDto = require(global.PUBLIC_APP_LIB+'models/SongSearchResultDto.js');
var _ = require('underscore');

var SearchService = module.exports = {};

SearchService.createSongSearchResult = function(songDtos){

    log.debug("-------------- enter createSongSearchResult");

    var deferred = Q.defer();
    var searchResults=[];
    var searchResult;

    var usersMap={};
    var tracksMap={}
    var userIds=[];
    var userDto;
    var songDtoKeys=[];
    var songDto;

    for (var i = 0; i < songDtos.length; i++) {

        songDto = songDtos[i];
        songDtoKeys.push(songDto);

        usersMap[songDto.id] = [];
        usersMap[songDto.id].push(songDto.creatorId);
        userIds.push(songDto.creatorId);

        log.debug('-------------- '+JSON.stringify(songDto)+ ' -------------------');
            for (var x = 0; x < songDto.tracks.length; x++) {
                log.debug("asdf");
                var trackCreatorId = songDto.tracks[x].originalTrackCreatorId;
                log.debug('trackCreatorId: ' + trackCreatorId);

                //TODO need to define a good approach for updating documents and adding/populating new fields
                if (trackCreatorId) {
                    usersMap[songDto.id].push(trackCreatorId);
                    userIds.push(trackCreatorId);
                }

            }
    }

    log.debug("user ids: " + JSON.stringify(userIds));

    userDao.getUsersById(userIds).then(function(users){

        log.debug("found users: " + JSON.stringify(users));

        for(var x = 0; x < songDtoKeys.length; x++) {

            songDto = songDtoKeys[x];
            searchResult = new SongSearchResultDto();
            searchResult.song = songDto;

            SearchService.addTagsToSearchResult(songDto.tags, searchResult);

            //TODO track tags are on the original track... so this won't work
            for(var i = 0; i < songDto.tracks; i++){
                SearchService.addTagsToSearchResult(songDto.tracks[i].tags, searchResult);
            }

            for(var i = 0; i < users.length; i++){
                
                userDto = users[i];
                log.debug('user: ' + userDto.firstName);
                var match = _.find(usersMap[songDto.id], function(obj){
                    return (obj.toString() == userDto.id.toString());
                });

                if(match){
                    log.debug('matched');
                    searchResult.musicians.push(userDto);
                    if(songDto.creatorId.toString() == userDto.id.toString()){
                        searchResult.creator = userDto;
                    }

                }
            }

            searchResults.push(searchResult);
        }

        log.debug('return searchResults: ' + JSON.stringify(searchResults));

        deferred.resolve(searchResults);
    });

    return deferred.promise;
};

/**
 * Private - Add a song and track tags to the search result
 * @param tags
 * @param searchResult
 */
SearchService.addTagsToSearchResult = function(tags, searchResult){

    for(var i = 0; i < tags.length; i++){
        var tag = tags[i].trim();
        if(tag.length){
            searchResult.tags.push(tag);
        }
    }
};

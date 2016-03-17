var Q = require('q');
var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var userDao = require(APP_LIB + 'dao/UserDao');
var trackDao = require(APP_LIB + 'dao/TrackDao');
var SongSearchResultDto = require(global.PUBLIC_APP_LIB+'models/SongSearchResultDto.js');
var TrackSearchResultDto = require(global.PUBLIC_APP_LIB+'models/TrackSearchResultDto.js');
var _ = require('underscore');

var SearchService = module.exports = {};

SearchService.createSongSearchResult = function(songDtos){

    log.debug("enter createSongSearchResult");

    var deferred = Q.defer();
    var searchResults=[];
    var searchResult;

    var usersMap={};
    var userIds=[];
    var userDto;
    var songDtoKeys=[];
    var songDto;

    for (var i = 0; i < songDtos.length; i++) {

        songDto = songDtos[i];
        songDtoKeys.push(songDto);
        usersMap[songDto.id] = songDto.allMusicians;
        userIds = userIds.concat(songDto.allMusicians);

    }

    log.debug("user ids: " + JSON.stringify(userIds));

    userDao.getUsersById(userIds).then(function(users){

        log.debug("found users: " + JSON.stringify(users));

        for(var x = 0; x < songDtoKeys.length; x++) {

            songDto = songDtoKeys[x];
            searchResult = new SongSearchResultDto();
            searchResult.song = songDto;

            for(var i = 0; i < users.length; i++){

                userDto = users[i];
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

SearchService.createTrackSearchResult = function(tracks){

    log.debug("enter createTrackSearchResult");

    var deferred = Q.defer();
    var searchResults=[];
    var searchResult;

    var usersMap={};
    var userIds=[];
    var userDto;


    for (var i = 0; i < tracks.length; i++) {
        userIds.push(tracks[i].creatorId);
    }

    userDao.getUsersById(userIds).then(function(users){

        for(var x = 0; x < users.length; x++) {
            usersMap[users[x].id] = users[x];
        }

        for(var x = 0; x < tracks.length; x++) {
            searchResult = new TrackSearchResultDto();
            searchResult.track = tracks[x];
            searchResult.tags = tracks[x].tags;
            searchResult.musician = usersMap[tracks[x].creatorId];

            searchResults.push(searchResult);
        }

        log.debug('track search results: ' + JSON.stringify(searchResults));

        deferred.resolve(searchResults);

    });


    return deferred.promise;
};
var Q = require('q');
var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var userDao = require(APP_LIB + 'dao/UserDao');
var trackDao = require(APP_LIB + 'dao/TrackDao');
var songDao = require(APP_LIB + 'dao/SongDao');
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

    //log.debug("user ids: " + JSON.stringify(userIds));

    userDao.getUsersById(userIds).then(function(users){

        //log.debug("found users: " + JSON.stringify(users));

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
                    searchResult.musicians.push(userDto);
                    if(songDto.creatorId.toString() == userDto.id.toString()){
                        searchResult.creator = userDto;
                    }

                }
            }

            searchResults.push(searchResult);
        }

        //log.debug('return searchResults: ' + JSON.stringify(searchResults));
        log.debug('return ' + searchResults.length + ' search results');

        deferred.resolve(searchResults);
    });



    return deferred.promise;
};

SearchService.createTrackSearchResult = function(trackSearchResults){

    log.debug("enter createTrackSearchResult");

    var deferred = Q.defer();
    var searchResults=[];
    var searchResult;

    var usersMap={};
    var userIds=[];
    var songIds=[];
    var userDto;

    var trackIds = [];
    var trackSongMap = {};

    for (var i = 0; i < trackSearchResults.length; i++) {

        trackIds.push(trackSearchResults[i].id);
        songIds = songIds.concat(trackSearchResults[i].songIds);
        trackSongMap[trackSearchResults[i].id] = trackSearchResults[i].songIds;
    }

    trackDao.getListOfTracksById(trackIds).then(function(trackDtos){

        //log.debug('returned tracks: '+ JSON.stringify(trackDtos));

        for (var i = 0; i < trackDtos.length; i++) {
            userIds.push(trackDtos[i].creatorId);

        }

        userDao.getUsersById(userIds).then(function(users){

            for(var x = 0; x < users.length; x++) {
                usersMap[users[x].id] = users[x];
            }

            songDao.findSmallSongSearchResultsById(songIds).then(function(songSearchResults){

                for(var x = 0; x < trackDtos.length; x++) {

                    searchResult = new TrackSearchResultDto();
                    searchResult.track = trackDtos[x];
                    searchResult.tags = trackDtos[x].tags;
                    searchResult.musicians.push(usersMap[trackDtos[x].creatorId]);

                    for(var i = 0; i < songSearchResults.length; i++) {

                        if(trackSongMap[trackDtos[x].id].indexOf(songSearchResults[i].id) > -1){
                            searchResult.songs.push(songSearchResults[i]);
                        }
                    }

                    searchResults.push(searchResult);
                }

                //log.debug('track search results: ' + JSON.stringify(searchResults));
                log.debug('found ' + searchResults.length + ' track search results');

                deferred.resolve(searchResults);
            });


        });

    }, function(err){
        deferred.reject(err);
    });


    return deferred.promise;
};
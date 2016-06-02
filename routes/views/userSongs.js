var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var songDao = require(APP_LIB + 'dao/SongDao');
var trackDao = require(APP_LIB + 'dao/TrackDao');
var userDao = require(APP_LIB + 'dao/UserDao');
var searchService = require(APP_LIB + 'service/SearchService');
var Q = require('q');

exports = module.exports = function(req, res) {

    log.debug("enter userSongs with user id: " + JSON.stringify(req.user));
    var locals = res.locals;
    var offset = req.query.offset || 0;
    var limit = req.query.limit || 10;
    var requestType = req.query.requestType || 'html';

    var jsonResult={};
    jsonResult.searchResults=[];
    jsonResult.songs=[];
    jsonResult.errors=[];

    // locals.section is used to set the currently selected
    // item in the header navigation.
    locals.section = 'songs';

    var renderView = function(data){

        if(requestType === 'html'){
            log.debug('render html view');
            res.render('userSongs');
        }
        else{
            log.debug('render json view');
            res.json(data);
        }
    };

    var getUsersFromSong = function(songDto){

        var deferred = Q.defer();
        var userIds=[];

        userIds.push(songDto.creatorId);

        for(var i = 0; i < songDto.tracks.length; i++){
            if(userIds.indexOf(songDto.tracks[i].originalTrackCreatorId) != -1){
                userIds.push(songDto.tracks[i].originalTrackCreatorId);
            }
        }

        userDao.getUsersById(userIds).then(function(users){
            deferred.resolve(users);
        });

        return deferred.promise;
    };

    var successSongSearchCb = function (songs) {
        searchService.createSongSearchResult(songs).then(function(searchResults){
            locals['songSearchResults'] = searchResults;
            locals['songs'] = songs;
            locals['offset'] = songs.length;
            jsonResult.searchResults = searchResults;
            jsonResult.songs = songs;
            renderView(jsonResult);
        });
    };

    var successTrackSearchCb = function (tracks) {
        searchService.createTrackSearchResult(tracks).then(function(searchResults){

            log.debug('####searchResults: ' + JSON.stringify(searchResults));
            locals['trackSearchResults'] = searchResults;
            locals['offset'] = tracks.length;
            locals['tracks'] = tracks;

            jsonResult.searchResults = searchResults;
            jsonResult.songs = tracks;
           renderView(jsonResult);
        });
    };

    var failureCb = function (error) {
        log.debug("error retrieving songs: " + err);
        req.flash('error', "error retrieving songs: " + err);
        jsonResult.errors.push("error retrieving songs: " + err)
        renderView(jsonResult);
    };

    var updateLocals = function (title, tab, searchType, offset, limit) {
        locals['title'] = title;
        locals[tab] = true;
        locals['limit'] = limit;
        locals['offset'] = offset;
        locals['search'] = req.query.search || 'songs';

        if(searchType == 'tracks'){
            locals['showTracks'] = true;
        }
        else{
            locals['showSongs'] = true;
        }
    };

    var isLoggedIn = function(){
        if (!req.user) {
            throw new Error("You must be logged in to view this page");
        }
    };

    try {


        if (req.query.search == 'collaborator') {

            updateLocals('Songs you have been invited to collaborate on', req.query.search, 'songs', offset, limit);
            isLoggedIn();
            songDao.findUserCollaboratorSongs(req.user.id, offset, limit).then(
                successSongSearchCb,
                failureCb
            );
        }

        else if (req.query.search == 'mySongs') {

            updateLocals('Your Songs', req.query.search, 'songs', offset, limit);
            isLoggedIn();

            songDao.findUserSongs(req.user.id, offset, limit).then(
                successSongSearchCb,
                failureCb
            );

        }

        else if (req.query.search == 'myTracks') {

            updateLocals('All of your tracks', req.query.search, 'tracks', offset, limit);
            isLoggedIn();

            trackDao.findUserTracks(req.user, offset, limit).then(
                successTrackSearchCb,
                failureCb
            );
        }
        else if (req.query.search == 'tracks') {

            updateLocals('Create a new song from an existing track ', req.query.keywords, 'tracks', offset, limit);
            isLoggedIn();

            var keywords = req.query.keywords || '';

            log.debug('search for public tracks with keywords: ' + keywords);

            if(keywords.length){
                trackDao.searchTracksByKeywords(keywords, offset, limit).then(
                    successTrackSearchCb,
                    failureCb
                );
            }
            else{
                renderView(jsonResult);
            }


        }
        //TODO songs user has liked
        else if (req.query.search == 'favoriteSongs') {

            updateLocals('These are songs you have liked', req.query.search, 'songs', offset, limit);
            isLoggedIn();

            songDao.findLatestPublicSongs(offset, limit).then(
                successSongSearchCb,
                failureCb
            );
        }
        //TODO musicians i follow songs
        else if (req.query.search == 'following') {

            updateLocals('Songs from musicians you follow', req.query.search, offset, limit);
            isLoggedIn();

            songDao.findLatestPublicSongs(offset, limit).then(
                successSongSearchCb,
                failureCb
            );
        }
        else if (req.query.search == 'songs') {

            if(req.query.tags){
                updateLocals('Song Search by tags', 'keywords', 'songs', offset, limit);
                var tags = [];
                tags.push(req.query.tags);
                songDao.findPublicSongsByTags(tags, offset, limit).then(
                    successSongSearchCb,
                    failureCb
                );
            }
            else{
                var keywords = req.query.keywords || '';

                updateLocals('Song Search for: '+keywords, 'keywords', 'songs', offset, limit);
                locals['keywords'] = keywords;
                if(keywords.length){
                    songDao.searchPublicSongs(keywords, offset, limit).then(
                        successSongSearchCb,
                        failureCb
                    );
                }
                else{
                    renderView(jsonResult);
                }

            }

        }
        //TODO latest public songs
        else {
            updateLocals('Our latest songs', 'latest', 'songs', offset, limit);
            songDao.findLatestPublicSongs(offset, limit).then(
                successSongSearchCb,
                failureCb
            );
        }

    }
    catch(e){
        req.flash('error', e.message);
        jsonResult.errors.push(e.message);
        renderView(jsonResult);
    }


};
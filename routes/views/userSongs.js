var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var songDao = require(APP_LIB + 'dao/SongDao');
var trackDao = require(APP_LIB + 'dao/TrackDao');
var userDao = require(APP_LIB + 'dao/UserDao');
var searchService = require(APP_LIB + 'service/SearchService');
var Q = require('q');

exports = module.exports = function(req, res) {

    log.debug("enter userSongs with user id: " + JSON.stringify(req.user));
    var locals = res.locals;

    // locals.section is used to set the currently selected
    // item in the header navigation.
    locals.section = 'songs';

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
            res.render('userSongs');
        });
    };

    var successTrackSearchCb = function (tracks) {
        searchService.createTrackSearchResult(tracks).then(function(searchResults){

            log.debug('####searchResults: ' + JSON.stringify(searchResults));
            locals['trackSearchResults'] = searchResults;

            var tracks = [];
            for(var x = 0; x < searchResults.length; x++){
                tracks.push(searchResults[x].track);
            }

            if(tracks.length){
                locals['tracks'] = tracks;
            }

            res.render('userSongs');
        });
    };

    var failureCb = function (error) {
        log.debug("error retrieving songs: " + err);
        req.flash('error', "error retrieving songs: " + err);
        res.render('userSongs');
    };

    var updateLocals = function (title, tab, searchType) {
        locals['title'] = title;
        locals[tab] = true;

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

            updateLocals('Songs you have been invited to collaborate on', req.query.search, 'songs')
            isLoggedIn();
            songDao.findUserCollaboratorSongs(req.user.id).then(
                successSongSearchCb,
                failureCb
            );
        }

        else if (req.query.search == 'mySongs') {

            updateLocals('Your Songs', req.query.search, 'songs');
            isLoggedIn();

            songDao.findUserSongs(req.user.id).then(
                successSongSearchCb,
                failureCb
            );

        }
        //TODO user tracks
        else if (req.query.search == 'myTracks') {
            updateLocals('All of your tracks', req.query.search, 'tracks');
            isLoggedIn();

            trackDao.findUserTracks(req.user).then(
                successTrackSearchCb,
                failureCb
            );
        }
        else if (req.query.search == 'tracks') {

            updateLocals('Create a new song from an existing track ', req.query.keywords, 'tracks');
            isLoggedIn();

            var keywords = req.query.keywords || '';

            log.debug('search for public tracks with keywords: ' + keywords);

            if(keywords.length){
                trackDao.searchTracksByKeywords(keywords).then(
                    successTrackSearchCb,
                    failureCb
                );
            }
            else{
                res.render('userSongs');
            }


        }
        //TODO songs user has liked
        else if (req.query.search == 'favoriteSongs') {
            updateLocals('These are songs you have liked', req.query.search, 'songs');
            isLoggedIn();

            songDao.findLatestPublicSongs().then(
                successSongSearchCb,
                failureCb
            );
        }
        //TODO musicians i follow songs
        else if (req.query.search == 'following') {
            updateLocals('Songs from musicians you follow', req.query.search);
            isLoggedIn();

            songDao.findLatestPublicSongs().then(
                successSongSearchCb,
                failureCb
            );
        }
        else if (req.query.search == 'songs') {

            if(req.query.tags){
                updateLocals('Song Search by tags', 'keywords', 'songs');
                var tags = [];
                tags.push(req.query.tags)
                songDao.findPublicSongsByTags(tags).then(
                    successSongSearchCb,
                    failureCb
                );
            }
            else{
                var keywords = req.query.keywords || '';

                updateLocals('Song Search for: '+keywords, 'keywords', 'songs');

                if(keywords.length){
                    songDao.searchPublicSongs(keywords).then(
                        successSongSearchCb,
                        failureCb
                    );
                }
                else{
                    res.render('userSongs');
                }

            }

        }
        //TODO latest public songs
        else {
            updateLocals('Our latest songs', 'latest', 'songs');
            songDao.findLatestPublicSongs(0,20).then(
                successSongSearchCb,
                failureCb
            );
        }

    }
    catch(e){
        req.flash('error', e.message);
        res.render('userSongs');
    }


};
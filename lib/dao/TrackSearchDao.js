var Q = require('q');
var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var ObjectId = require('mongoose').Types.ObjectId;
var dtoMapper = require(APP_LIB + 'util/DtoMapper');
var trackDao = require(APP_LIB + 'dao/TrackDao');
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var _ = require('underscore');
var Schema = mongoose.Schema;
var TrackSearchSchema = new Schema({

    trackName: {type: String, required: true},
    trackTags: [String],
    trackDescriptionKeywords: [String],
    songKeywords: [String],
    songIds : [Schema.Types.ObjectId]

});

TrackSearchSchema.index(
    {
        trackNames: "text",
        trackTags: "text",
        trackDescriptionKeywords: "text",
        songKeywords: "text"
    },
    {
        weights: {
            trackNames: 10,
            trackTags: 8,
            trackDescriptionKeywords: 5,
            songKeywords: 4
        },
        name: "TrackSearchSchemaIndex"
    }
);

TrackSearchSchema.plugin(mongoosePaginate);

var TrackSearch = mongoose.model('TrackSearch', TrackSearchSchema);

var TrackSearchDao = module.exports = {};


TrackSearchDao.addOrUpdate = function(trackSearchDto){

    log.debug("enter addOrUpdate with trackSearchDto: " + JSON.stringify(trackSearchDto));

    var query = {};
    query["_id"] = new ObjectId(trackSearchDto.trackId);

    var saveCB = function(err, result){
        if (err) {
            logger.debug("error saving new trackSearch: " + err);
        }
        else {
            logger.debug("successfully saved trackSearch");
        }
    };

    if(trackSearchDto.isPublic){

        TrackSearch.findOne(query).exec(function (err, trackSearch) {

            if(err){
                log.debug('error searching for trackSearch: ' + err);
                return;
            }
            if(trackSearch){

                trackSearch.trackName = (trackSearchDto.trackName.length)? trackSearchDto.trackName : trackSearch.trackName;
                trackSearch.trackTags = _.union(trackSearch.trackTags, trackSearchDto.trackTags);
                trackSearch.trackDescriptionKeywords = _.union(trackSearch.trackDescriptionKeywords, trackSearchDto.trackDescriptionKeywords);
                trackSearch.songKeywords = _.union(trackSearch.songKeywords, trackSearchDto.songKeywords);
                trackSearch.songIds = _.union(trackSearch.songIds, trackSearchDto.songIds);
                trackSearch.save(saveCB);
            }
            else{

                var newTrackSearch = new TrackSearch({
                    '_id': query["_id"],
                    'trackName': trackSearchDto.trackName,
                    'trackTags': trackSearchDto.trackTags,
                    'trackDescriptionKeywords': trackSearchDto.trackDescriptionKeywords,
                    'songKeywords': trackSearchDto.songKeywords,
                    'songIds' : trackSearchDto.songIds
                });

                newTrackSearch.save(saveCB);
            }

        });
    }
    else{
        //remove the search entry if it is not public
        log.debug("removing search entry for id: " + trackSearchDto.trackId);
        TrackSearch.find(query).remove().exec();
        return;
    }

};

/**
 *
 * @param keywords
 * @param offset
 * @param limit
 */
TrackSearchDao.searchTracksByKeywords = function(keywords, offset, limit){

    log.debug('entered searchTracksByKeywords with keywords: ' + keywords);

    var deferred = Q.defer();
    var query = {};

    var options ={};
    options['offset'] = offset || 0;
    options['limit'] = limit || 10;
    options['fields'] = '_id, songIds';
    query['$text'] = { $search: keywords };

    TrackSearch.paginate(query, options, function (err, results) {

        if (err) {
            deferred.reject(err);
        }
        else {

            log.debug('found tracks: ' + results.docs.length);
            var trackData = [];
            for(var i = 0; i < results.docs.length; i++){

                var trackInfo = {};
                trackInfo.trackId = results.docs[i]._id;
                trackInfo.songIds = results.docs[i].songIds;
                trackData.push(trackInfo);
            }

            log.debug('found tracks: ' + JSON.stringify(trackData));

            deferred.resolve(trackData);

        }

    });

    return deferred.promise;
};
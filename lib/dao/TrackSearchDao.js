var Q = require('q');
var log = require(APP_LIB + 'util/Logger').getLogger(__filename);
var ObjectId = require('mongoose').Types.ObjectId;
var dtoMapper = require(APP_LIB + 'util/DtoMapper');

var mongoose = require('mongoose');
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

    TrackSearch.findOne(query).exec(function (err, trackSearch) {

        if(err){
            log.debug('error searching for trackSearch: ' + err);
            return;
        }
        if(trackSearch){
log.debug('found existing trackSearch: ' + JSON.stringify(trackSearch));

            trackSearch.trackName = (trackSearchDto.trackName.length)? trackSearchDto.trackName : trackSearch.trackName;
            trackSearch.trackTags = _.union(trackSearch.trackTags, trackSearchDto.trackTags);
            trackSearch.trackDescriptionKeywords = _.union(trackSearch.trackDescriptionKeywords, trackSearchDto.trackDescriptionKeywords);
            trackSearch.songKeywords = _.union(trackSearch.songKeywords, trackSearchDto.songKeywords);
            trackSearch.songIds = _.union(trackSearch.songIds, trackSearchDto.songIds);
            trackSearch.save(saveCB);
        }
        else{
log.debug('inserting new trackSearch');

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
};
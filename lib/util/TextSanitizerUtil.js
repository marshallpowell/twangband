/**
 * Created by marshallpowell on 3/17/16.
 */
var _ = require('underscore');
var log = require(APP_LIB + 'util/Logger').getLogger(__filename);

var TextSanitizerUtil = module.exports = {};

TextSanitizerUtil.vanillaWords = [',', '.', '!', ';', '*', '&', 'i','a','about','an','and','are','as','at','be','by','com','de','en','for','from','how','in','is','it','la','of','on','or','that','the','this','to','was','what','when','where','who','will','with','und','the','www'];


TextSanitizerUtil.getKeywords = function(text){

    log.debug('getKeywords: ' + text);

    if(!text){
        return [];
    }

    var out = text.toLowerCase().split(" ");

    out = _.difference(out, TextSanitizerUtil.vanillaWords);

    log.debug('keyword array: ' + JSON.stringify(out));
    return out;
};

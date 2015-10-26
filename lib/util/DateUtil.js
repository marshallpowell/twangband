/**
 * Created by vagrant on 10/15/15.
 */

var DateUtil = module.exports = {};

DateUtil.formatDate = function(date){

    if (typeof(date) == "undefined") {
        return "Unknown";
    }
    // These methods need to return a String
    return date.getDay() + "/" + date.getMonth() + "/" + date.getFullYear();
}


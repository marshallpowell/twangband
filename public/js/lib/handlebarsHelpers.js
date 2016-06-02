


$(document).ready(function () {
    (function ($, undefined) {
        /**
         * helper utils for handlebars
         */

        var HbsHelpers = {};
        HbsHelpers.formatDate = function(date){

            if (typeof(date) == "undefined") {
                return "Unknown";
            }
            //FIXME These methods need to return a String
            //return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear();
            return date.toString();
        };

        HbsHelpers.truncateText = function(string, length){

            if(string.length >  length){
                return string.trim().substring(0, length)+'...';
            }
            else{
                return string.trim();
            }
            // These methods need to return a String

        };

        Handlebars.registerHelper('json', JSON.stringify);
        Handlebars.registerHelper('formatDate', HbsHelpers.formatDate);
        Handlebars.registerHelper('truncateText', HbsHelpers.truncateText);

        /**
         * partials
         */

        Handlebars.registerPartial('tagInfo', Handlebars.compile($("#tagInfoPartial").html()));
        Handlebars.registerPartial('musicianInfoIcon', Handlebars.compile($("#musicianInfoIconPartial").html()));
        Handlebars.registerPartial('songCollaboratorResults', Handlebars.compile($("#songCollaboratorResultsPartial").html()));
        Handlebars.registerPartial('songTagButton', Handlebars.compile($("#songTagButtonPartial").html()));
    }(jQuery));
});
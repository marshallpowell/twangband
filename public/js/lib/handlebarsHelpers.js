


$(document).ready(function () {
    (function ($, undefined) {
        /**
         * helper utils for handlebars
         */

        var HbsHelpers = {};


        HbsHelpers.truncateText = function(string, length){

            if(string.length >  length){
                return string.trim().substring(0, length)+'...';
            }
            else{
                return string.trim();
            }
            // These methods need to return a String

        };


        HbsHelpers.formatDate = function(date){

            if (typeof(date) == "undefined") {
                return "Unknown";
            }

            var d = new Date(date),
                month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear();

            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;

            return [month, day, year].join('/');
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
        Handlebars.registerPartial('likeIcon', Handlebars.compile($("#likeIconPartial").html()));
    }(jQuery));
});
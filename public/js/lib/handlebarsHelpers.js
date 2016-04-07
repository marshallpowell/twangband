$(document).ready(function () {
    (function ($, undefined) {
        /**
         * helper utils for handlebars
         */

        Handlebars.registerHelper('json', JSON.stringify);

        /**
         * partials
         */

        Handlebars.registerPartial('tagInfo', Handlebars.compile($("#tagInfoPartial").html()));
        Handlebars.registerPartial('musicianInfoIcon', Handlebars.compile($("#musicianInfoIconPartial").html()));

    }(jQuery));
});
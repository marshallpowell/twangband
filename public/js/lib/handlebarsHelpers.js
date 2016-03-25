/**
 * helper utils for handlebars
 */

Handlebars.registerHelper('json', function(options) {
    return JSON.stringify(this[Object.keys(this)[0]]);
});
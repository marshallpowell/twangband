var moment = require('moment');
var _ = require('underscore');
var hbs = require('handlebars');

var HbsHelpers = module.exports = {};


/**
 * Generic HBS Helpers
 * ===================
 */

// standard hbs equality check, pass in two values from template
// {{#ifeq keyToCheck data.myKey}} [requires an else blockin template regardless]
HbsHelpers.ifeq = function(a, b, options) {
	if (a == b) {
		return options.fn(this);
	} else {
		return options.inverse(this);
	}
};

/**
 * Port of Ghost helpers to support cross-theming
 * ==============================================
 *
 * Also used in the default keystonejs-hbs theme
 */

// ### Date Helper
// A port of the Ghost Date formatter similar to the keystonejs - jade interface
//
//
// *Usage example:*
// `{{date format='MM YYYY}}`
// `{{date publishedDate format='MM YYYY'`
//
// Returns a string formatted date
// By default if no date passed into helper than then a current-timestamp is used
//
// Options is the formatting and context check this.publishedDate
// If it exists then it is formated, otherwise current timestamp returned

HbsHelpers.date = function(context, options) {
	if (!options && context.hasOwnProperty('hash')) {
		options = context;
		context = undefined;

		if (this.publishedDate) {
			context = this.publishedDate;
		}
	}

	// ensure that context is undefined, not null, as that can cause errors
	context = context === null ? undefined : context;

	var f = options.hash.format || 'MMM Do, YYYY',
		timeago = options.hash.timeago,
		date;

	// if context is undefined and given to moment then current timestamp is given
	// nice if you just want the current year to define in a tmpl
	if (timeago) {
		date = moment(context).fromNow();
	} else {
		date = moment(context).format(f);
	}
	return date;
};

HbsHelpers.flashMessages = function(messages) {
	var output = '';
	for (var i = 0; i < messages.length; i++) {

		if (messages[i].title) {
			output += '<h4>' + messages[i].title + '</h4>';
		}

		if (messages[i].detail) {
			output += '<p>' + messages[i].detail + '</p>';
		}

		if (messages[i].list) {
			output += '<ul>';
			for (var ctr = 0; ctr < messages[i].list.length; ctr++) {
				output += '<li>' + messages[i].list[ctr] + '</li>';
			}
			output += '</ul>';
		}
	}
	return new hbs.SafeString(output);
};

//FIXME
HbsHelpers.formatDate = function(date){

	if (typeof(date) == "undefined") {
		return "Unknown";
	}
	// These methods need to return a String
	return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear();
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


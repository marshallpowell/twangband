
var ValidationUtil = {};

//http://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
ValidationUtil.escapeHtml = function(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

try{module.exports = ValidationUtil;} catch(err){}
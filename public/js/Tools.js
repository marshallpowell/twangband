

(function() {

    var Tools = {};

    Tools.isDebugEnabled = false;

    Tools.debug = function(message){
        console.log(message);
    }

    Tools.getClass = function(obj){

        return Object.prototype.toString.call(obj);
    }

    if (typeof exports !== 'undefined') {
        exports.Tools = Tools;
    }

    // define globally in case AMD is not available or available but not used

    if (typeof window !== 'undefined') {
        window.Tools = Tools;
    }

})();

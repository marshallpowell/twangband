/**
 * Created by vagrant on 3/4/15.
 */
var winston = require('winston');


var Logger = module.exports = {};

Logger.getLogger = function(file) {



   var mylog = {};
    

    mylog.logger = global.logger;

    mylog.fileName = file;

    mylog.formatMessage = function(message, err){
        error = (err) ? " ERROR: " + err : "";
        return mylog.fileName + " >> " + message + error;
    };

   mylog.debug = function(message, err){
        mylog.logger.log('debug', mylog.formatMessage(message, err));

    };


    mylog.info = function(message, err){
        mylog.logger.log('info', mylog.formatMessage(message, err));

    };


    mylog.error = function(message, err){
        mylog.logger.log('error', mylog.formatMessage(message, err));

    };

    /**
     * Utility method to show all of an objects properties.
     * @param objectInput - The object whom you want to inspect
     * @returns {string}
     */
    mylog.showObjectProperties = function(objectInput){

        var output = '';
        for (var key in objectInput) {
            output +="prop = " + key + "\n";
            if (objectInput.hasOwnProperty(key)) {
                var obj = objectInput[key];
                for (var prop in obj) {
                    // important check that this is objects own property
                    // not from prototype prop inherited
                    if(obj.hasOwnProperty(prop)){
                        output += " subprop: " + prop  + " = " + obj[prop] + "\n";
                    }
                }
            }
        }

        return output;
    }

    return mylog;

};

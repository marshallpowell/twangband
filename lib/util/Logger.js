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

    return mylog;

};

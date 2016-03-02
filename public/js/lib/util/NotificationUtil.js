
NotificationUtil = {};

/**
 *
 * @param message
 * @param alertClass
 * @param appendMessage (optional, whether you want to append to the div, or clear first)
 * @param divId (optional, parent div to fill)
 */
NotificationUtil.notify = function(message, alertClass, appendMessage, divId){

    var alertDiv =  document.createElement('div');
    alertDiv.className="alert "+alertClass;

    var parentDiv = "flash-messages";

    if(divId){
        parentDiv = divId;
    }

    if(!appendMessage){
        $("#"+parentDiv).empty();
    }

    alertDiv.innerHTML = '<a class="panel-close close" data-dismiss="alert">×</a><i class="fa fa-coffee"></i> '+message;
    $("#"+parentDiv).append(alertDiv);
};

/**
 * Error Notification
 * @param message
 * @param appendMessage (optional)
 * @param divId (optional)
 */
NotificationUtil.error = function(message, appendMessage, divId){
    NotificationUtil.notify(message, "alert-danger", true, divId);
};

/**
 * Success Notification
 * @param message
 * @param appendMessage (optional)
 * @param divId (optional)
 */
NotificationUtil.success = function(message, appendMessage, divId){
    NotificationUtil.notify(message, "alert-success");
};

$(document).ready(function () {
    (function (tb, $, undefined) {

        var log = new Logger('DEBUG');
        var template = Handlebars.compile($("#userProfilePartial").html());

        tb.dialogs.showUserProfile = function(userDto){

            log.debug('enter showUserProfile with: ' + JSON.stringify(userDto));
            var context = {};
            context.userDto = userDto;
            log.debug('template: ' + template(context));
            $('#userProfileBody').html(template(context));
            $('#userProfileDialog').modal('toggle');

        };

    }(window.tb = window.tb || {}, jQuery));
});

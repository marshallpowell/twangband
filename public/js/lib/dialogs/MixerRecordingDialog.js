$(document).ready(function () {

    (function (tb, $, undefined) {

        var recordingTemplate = Handlebars.compile($("#mixerRecordingPartial").html());
        var callibrateTemplate = Handlebars.compile($("#mixerCallibratePartial").html());



        var log = new Logger('DEBUG');
        var chooseMetronome=true;
        var useMetronome;



        tb.dialogs.mixer.openRecordingDialog = function () {
            var context = {};
            var latency = MixerUtil.getCookie('systemLatency');

            if(latency == null || latency.length==0){
                tb.dialogs.mixer.openCallibrationDialog();
                return;
            }

            $('#mixerRecordingBody').html(recordingTemplate(context));
            initMetronome();

            $('#mixerRecordingDialog').on('hidden.bs.modal', function () {
                toggleMetronome('stop');
            });

            $('#mixerRecordingDialog').modal('toggle');

        };

        tb.dialogs.mixer.openCallibrationDialog = function() {
            var context = {};
            $('#mixerRecordingBody').html(callibrateTemplate(context));
            $('#mixerRecordingDialog').modal('toggle');
        }



    }(window.tb = window.tb || {}, jQuery));
});
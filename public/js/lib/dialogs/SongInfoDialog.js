
$(document).ready(function () {
    (function (tb, $, undefined) {

        /**
         * popup dialog for song info
         */

        var songInfoDialogTemplate = Handlebars.compile($("#songInfoDialogPartial").html());
        var songInfoWavesurfer = Object.create(WaveSurfer);
        var removeLoadingMessage = function () {
            document.getElementById('loadingSongInfoDialogWav').remove();
        };

        tb.dialogs.openSongInfoDialog = function (smallSongSearchResultDto,showSongUrl) {

            var songLoaded = false;
            var context = {};
            context.smallSongSearchResultDto = smallSongSearchResultDto;
            context.showSongUrl = (showSongUrl != undefined)? showSongUrl : true;

            $('#newSongFromTrackBody').html(songInfoDialogTemplate(context));

            setTimeout(function () {

                var options = {
                    container: document.getElementById('songInfoDialogWav'),
                    waveColor: '#1989D4',
                    progressColor: '#2BAD1D ',
                    cursorColor: 'navy'
                };

                songInfoWavesurfer.init(options);
                songInfoWavesurfer.load('/uploads/' + smallSongSearchResultDto.fileName);

                songInfoWavesurfer.on('ready', removeLoadingMessage);
                songInfoWavesurfer.on('destroy', removeLoadingMessage);
                songInfoWavesurfer.on('error', removeLoadingMessage);
            }, 500);

            $( "#songInfoDialogWavBtnPlay").click(function() {
                songInfoWavesurfer.playPause();
            });

            $( "#songInfoDialogWavBtnStop").click(function() {
                songInfoWavesurfer.stop();
            });

            $( "#songInfoDialogWavBtnBack").click(function() {
                songInfoWavesurfer.skipBackward();
            });

            $( "#songInfoDialogWavBtnForward").click(function() {
                songInfoWavesurfer.skipForward();
            });

            $( "#newSongFromTrackDialog").on('hidden.bs.modal', function (e) {
                songInfoWavesurfer.stop();
            });

            $('#newSongFromTrackDialog').modal('toggle');

        };

    }(window.tb = window.tb || {}, jQuery));
});

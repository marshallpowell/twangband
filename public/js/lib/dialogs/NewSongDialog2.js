$(document).ready(function () {

    (function (tb, $, undefined) {
        /**
         * http://appendto.com/2010/10/how-good-c-habits-can-encourage-bad-javascript-habits-part-1/
         * contains the functions to support the new song form dialog
         */

        var newSongFromTrackTemplate = Handlebars.compile($("#newSongFromTrackPartial").html());
        var log = new Logger('DEBUG');

        tb.dialogs.openNewSongDialog = function (trackDto) {
            var context = {};
            context.trackDto = trackDto;

            $('#newSongFromTrackBody').html(newSongFromTrackTemplate(context));
            $('#newSongFromTrackDialog').modal('toggle');

        };

        tb.dialogs.submitNewSong = function (name, isPublic, trackDtoJson) {

            var name = name || '';
            var isPublic = isPublic || false;
            var trackDto = undefined;
            var errors = [];

            try {
                trackDto = JSON.parse(trackDtoJson);
            }
            catch (err) {
            }


            errors = SongValidation.validateSongFieldData(name);

            if (errors.length) {
                NotificationUtil.error(errors.join("\n<br/> * "), false, 'newSongFromTrackNotifications');
                return;
            }
            else {

                var newSongDto = new SongDto();
                newSongDto.name = name;
                newSongDto.isPublic = isPublic;

                if (trackDto) {
                    var songTrackDto = new SongTrackDto();
                    songTrackDto.originalTrackDto = trackDto;
                    songTrackDto.originalTrackId = trackDto.id;
                    newSongDto.tracks.push(songTrackDto);
                }


                var formData = new FormData();
                formData.append("song", JSON.stringify(newSongDto));

                $.ajax({
                    url: '/song/save',
                    data: formData,
                    cache: false,
                    contentType: false,
                    processData: false,
                    type: 'POST',
                    success: function (data) {

                        //TODO need to handle errors too
                        log.debug("saved song: " + data);

                        window.location.href = "/songMixer?song=" + data.id;

                    },
                    fail: function (error) {
                        NotificationUtil.error('There was an error creating a song from this track: ' + error, true, 'newSongFromTrackNotifications');

                    }
                });
            }
        };

    }(window.tb = window.tb || {}, jQuery));
});
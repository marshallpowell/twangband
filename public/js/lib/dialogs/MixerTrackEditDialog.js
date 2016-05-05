$(document).ready(function () {
    (function (tb, $, undefined) {
        /**
         * http://appendto.com/2010/10/how-good-c-habits-can-encourage-bad-javascript-habits-part-1/
         * contains the functions to support the new song form dialog
         */
        var template = Handlebars.compile($("#mixerTrackEditDialogPartial").html());

        tb.dialogs.mixer.track.openTrackEditDialog = function (trackDto,readOnly) {

            console.log('track in: ' + JSON.stringify(trackDto));
            var context = {};
            context.trackDto = trackDto;
            context.disabled = false;
            context.isPublic = trackDto.isPublic;

                context.readOnly = readOnly;
                log.debug('context.readOnly: ' + Boolean(context.readOnly));

            $('#mixerTrackEditDialogBody').html(template(context));
            $('#mixerTrackEditDialog').modal('toggle');

            $('#mixerTrackEditDialogTrackTags').tagsinput({
                typeaheadjs: {
                    name: 'instruments',
                    displayKey: 'name',
                    valueKey: 'name',
                    source: tags.ttAdapter()
                }
            });

        };

        tb.dialogs.mixer.track.updateTrack = function () {

            var trackDto = new TrackDto();
            trackDto.name = document.getElementById('mixerTrackEditDialogTrackName').value || '';
            trackDto.description = document.getElementById('mixerTrackEditDialogTrackDescription').value || '';
            trackDto.isPublic = $(document.getElementById('mixerTrackEditDialogIsPublic')).is(':checked');
            trackDto.id = document.getElementById('mixerTrackEditDialogTrackId').value;
            trackDto.tags = $(document.getElementById('mixerTrackEditDialogTrackTags')).val();

            var errors = [];
            errors = errors.concat(TrackValidation.validate(trackDto));
            errors = errors.concat(TagValidation.validate(trackDto.tags));

            if (errors.length) {
                NotificationUtil.error(errors.join("\n<br/> * "), false, 'mixerTrackEditDialogNotifications');
                return;
            }
            else {

                var formData = new FormData();
                formData.append("track", JSON.stringify(trackDto));

                $.ajax({
                    url: '/track/save',
                    data: formData,
                    cache: false,
                    contentType: false,
                    processData: false,
                    type: 'POST',
                    success: function (data) {
                        //TODO need to handle errors too
                        if(data.errors.length){
                            NotificationUtil.error('There was an error saving this track: ' + data.errors.join("\n<br/> * "), true, 'mixerTrackEditDialogNotifications');
                            return;
                        }

                        if(data.track){
                            log.debug("saved track: " + data);
                            NotificationUtil.success('Track Saved', true, 'mixerTrackEditDialogNotifications');

                            document.getElementById("trackLabel"+data.track.uiId).innerText= data.track.name.substring(0,15) + "...";
                            document.getElementById('trackJson'+data.track.uiId).value = JSON.stringify(data.track);

                            console.log('track out: ' + document.getElementById('trackJson'+data.track.uiId).value);
                            return;
                        }

                        NotificationUtil.error('There was an error processing your request, please try back later', true, 'mixerTrackEditDialogNotifications');
                    },
                    fail: function (error) {
                        NotificationUtil.error('There was an error saving this track: ' + error, true, 'mixerTrackEditDialogNotifications');

                    }
                });
            }
        };

    }(window.tb = window.tb || {}, jQuery));
});


$(document).ready(function () {
    (function (tb, $, undefined) {

        /**
         * popup dialog for song info
         */

        var songEditDialogTemplate = Handlebars.compile($("#mixerSongEditDialogPartial").html());

        tb.dialogs.mixer.openSongEditDialog = function (songDto) {

            var context = {};
            context.songDto = songDto;
            context.isPublic = songDto.isPublic;

            $('#mixerSongEditDialogBody').html(songEditDialogTemplate(context));

            $('#mixerSongEditDialogSongTags').tagsinput({
                typeaheadjs: {
                    name: 'instruments',
                    displayKey: 'name',
                    valueKey: 'name',
                    source: tags.ttAdapter()
                }
            });

            $('#mixerSongEditDialog').modal('toggle');

        };

        tb.dialogs.mixer.saveSong = function(){

            var errors = SongValidation.validateSongFieldData(document.getElementById('mixerSongEditDialogSongName').value);

            if(errors.length){
                NotificationUtil.error(errors.join("\n<br/> * "), true, 'mixerSongEditDialogFormNotifications');
                return;
            }
            else{

                mixer.currentSongDto.name = $("#mixerSongEditDialogSongName").val();
                mixer.currentSongDto.description = $("#mixerSongEditDialogSongDescription").val();
                mixer.currentSongDto.tags = $("#mixerSongEditDialogSongTags").val();
                mixer.currentSongDto.isPublic = $("#mixerSongEditDialogSongIsPublic").is(':checked');

                mixer.saveSong('mixerSongEditDialogFormNotifications');
                return;
            }


        };

    }(window.tb = window.tb || {}, jQuery));
});

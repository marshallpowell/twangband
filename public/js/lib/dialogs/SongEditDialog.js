
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

            var name = document.getElementById('mixerSongEditDialogSongName').value;
            var description = document.getElementById('mixerSongEditDialogSongDescription').value;
            var tags = $("#mixerSongEditDialogSongTags").val();

            var dto = {};
            dto.name = name;
            dto.description = description;
            dto.tags = tags;
            var errors = [];
            errors = errors.concat(SongValidation.validate(dto));
            errors = errors.concat(TagValidation.validate(tags));


            if(errors.length){
                NotificationUtil.error(errors.join("\n<br/> * "), true, 'mixerSongEditDialogFormNotifications');
                return;
            }
            else{

                mixer.currentSongDto.name = name;
                mixer.currentSongDto.description = description;
                mixer.currentSongDto.tags = tags;
                mixer.currentSongDto.isPublic = $("#mixerSongEditDialogSongIsPublic").is(':checked');

                mixer.saveSong('mixerSongEditDialogFormNotifications');
                return;
            }


        };

    }(window.tb = window.tb || {}, jQuery));
});
